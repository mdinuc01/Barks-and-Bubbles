const Message = require('../models/Message.js');
const Pet = require('../models/Pet.js');
const Appointment = require('../models/Appointment.js');
const SMSUtils = require('../utils/SMSUtils.js');
const nodemailer = require("nodemailer");
const Builder = require('../models/MessageBuilder.js');

class MessageController {

  async sendMessage(req, res, next) {
    try {
      let locations = req.body.locations;
      let date = req.body.date;
      let appId = req.body.appId;
      let pets = await Pet.find();
      let clientSentTo = [];
      let sentDate = new Date();

      let messageObj = await Builder.findOne({ "name": "First Message" });

      //sending messages and populating message array for response retrieval
      if (pets.length) {
        pets.forEach(async (pet) => {
          if (!pet.active || !pet.contactMethod || !isValidPhoneNumber(pet.contactMethod)) return;

          if (locations.includes(pet.serviceArea)) {

            //*Console logs for testing users to send message to
            // let messageText = new Message(pet, date, 0, messageObj.message).createMessage();
            // console.log(messageText + "\n");
            SMSUtils.sendText(pet, date, messageObj.message);
            clientSentTo.push({ id: pet.id, contactMethod: pet.contactMethod, petName: pet.petName, petParentName: pet.petParentName, serviceArea: pet.serviceArea });

          }
        });

        const app = await Appointment.findOneAndUpdate(
          { _id: appId },
          {
            $set: {
              'messages.sentTo': clientSentTo,
              'messages.sentDate': sentDate
            }
          },
          { new: true }
        );

        setTimeout(async () => {

          const response = await fetchReplies(sentDate, appId);
          const appData = response.app;
          sendEmailUpdate(date, appData);
        }, 60 * 1000)

        const location = app.location.map(locationVal => {
          const clientsInLocation = pets.filter(client => client.serviceArea === locationVal);
          return { [locationVal]: clientsInLocation };
        });

        let meta = app.location;
        const data = { app: app, location, meta };

        return res.status(200).json({ message: `Messages sent`, data });
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async sendReplies(req, res, next) {
    try {
      let appId = req.params.id;

      const app = await Appointment.findOne({ _id: appId });

      let messageObj = await Builder.findOne({ "name": "Second Message" });

      if (app.scheduler && app.scheduler.length) {
        app.location.forEach((l) => {
          const scheduler = app.scheduler.find(obj => obj.hasOwnProperty(l));

          if (scheduler[l].replies && scheduler[l].replies.length && scheduler[l].increment) {
            scheduler[l].replies.forEach(async (reply) => {
              if (reply.time && reply.time != null && reply.petParentName) {
                let name = { petParentName: reply.petParentName, contactMethod: reply.from.substring(2) }
                //     // let message = new Message(name, reply.time);
                await SMSUtils.sendReply(name, reply.time, scheduler[l].increment, messageObj.message);
              }
            })
          }
        })

        return res.status(200).json({ message: `Replies sent` });
      }
    } catch (error) {
    }
  }

  async getReplies(req, res, next) {
    try {
      const { sentDate, appId } = req.body;
      const data = await fetchReplies(sentDate, appId);

      return res.status(200).json({ message: `Found Replies`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });

    }
  }
}

let fetchReplies = async (sentDate, appId) => {
  try {

    let replies = await SMSUtils.getReplies(sentDate);

    let app = await Appointment.findOne({ _id: appId });

    if (!app) {
      return;
    }

    let messagesData = app.messages.sentTo;

    const numbersSentTo = messagesData.map((message) => message.contactMethod.toString());

    replies = replies.filter((reply) => {
      let to = reply.to.replaceAll("+1", "");
      let from = reply.from.replaceAll("+1", "");

      if (reply.direction.includes("outbound") && numbersSentTo.includes(to)) {
        return reply;
      } else if (reply.direction.includes("inbound") && numbersSentTo.includes(from)) {
        return reply;
      }
    });

    let newReplies = replies.map((r) => {
      let time;
      let petParentName;
      let currentReply = app.replies.find((reply) => reply.sid === r.sid);
      if (currentReply && currentReply.time) {
        time = currentReply.time;
        petParentName = currentReply.petParentName;
      }
      return { ...r, time, petParentName };
    });

    newReplies = removeCircularReferences(newReplies);

    let schedulerReplies;
    try {
      schedulerReplies = app.location.map((l) => {
        const scheduler = app.scheduler.find(obj => { if (obj) return obj.hasOwnProperty(l) });
        if (!scheduler) {
          return { [l]: { replies: [], length: 0, increment: "0.5" } };
        }

        let replies = newReplies.filter((r) => {
          if (r.from == process.env.TWILIO_PHONE_NUMBER) return false; // Changed from return to return false to avoid including undefined elements
          let from = r.from.substring(2);
          let meta = messagesData.find((m) => m.contactMethod == from);
          return !!(meta && meta.serviceArea == l);
        }).map((r) => {
          let from = r.from.substring(2);
          let meta = messagesData.find((m) => m.contactMethod == from);

          if (meta) {
            let { contactMethod, ...metaWithoutContactMethod } = meta;

            let time;
            let currentReply = scheduler[l].replies.find((reply) => reply.sid === r.sid);
            if (currentReply && currentReply.time) {
              time = currentReply.time;
            }

            return {
              sid: r.sid,
              body: r.body,
              from: r.from,
              to: r.to,
              time,
              status: r.status,
              ...metaWithoutContactMethod
            };
          }
          return null; // Explicitly return null for non-matching replies
        }).filter(reply => reply !== null); // Filter out null values


        return { [l]: { replies, length: replies.length, increment: scheduler[l].increment ? scheduler[l].increment : "0.5" } };
      });
    } catch (error) {
      console.error("Error processing scheduler replies:", error);
      throw error; // Re-throw the error to be caught by the outer catch block
    }

    let newApp = await Appointment.findOneAndUpdate(
      { _id: appId },
      {
        'replies': newReplies,
        'scheduler': schedulerReplies
      },
      { new: true }
    );

    let pets = await Pet.find();

    let location = newApp.location.map(locationVal => {
      let clientsInLocation = pets.filter(client => {
        for (const obj of app.messages.sentTo) {
          if (obj.id === client.id && client.serviceArea == locationVal) {
            return client;
          }
        }
      });
      return { [locationVal]: clientsInLocation };
    });

    let meta = app.location;
    const data = { app: newApp._doc, location, meta };
    return data;
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
}


let removeCircularReferences = (obj, seen = new WeakSet()) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (seen.has(obj)) {
    return undefined; // Replace circular references with undefined
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => removeCircularReferences(item, seen));
  }

  const newObj = {};
  for (let key in obj) {
    if (key === 'dateSent' || key === 'dateUpdated' || key === 'dateCreated') {
      newObj[key] = obj[key];
    } else {
      newObj[key] = removeCircularReferences(obj[key], seen);
    }
  }
  return newObj;

}

isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\d{10}$/;

  return phoneRegex.test(phoneNumber);
}

sendEmailUpdate = (date, appData) => {
  const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const serviceAreas = appData.location.join(", ");
  const replies = appData.replies;
  const sentTo = appData.messages.sentTo.length;
  const successMsgs = replies.filter((r) => r.status == "delivered").length;
  const undeliveredMsgs = replies.filter((r) => r.status == "undelivered").length;
  const failedMsgs = replies.filter((r) => r.status == "failed").length;

  let mailDetails = {
    from: "maddinuc98@gmail.com",
    to: "larissadinuccio@gmail.com",
    subject: `Barks & Bubbles Appointment - ${date}`,
    html: `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            background-color: #ffffff !important;

          }
          h1, h3 {
            color: #2c3e50;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th, td {
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2 !important;
          }
          tr:nth-child(odd) {
            background-color: #e0e0e0 !important;
          }
          tr:nth-child(even) {
            background-color: #ffffff !important;
          }
        </style>
        <title>Barks & Bubbles Appointment - ${date}</title>
      </head>
      <body>
        <h1>Barks & Bubbles Appointment - ${date}</h1>
        <h3>All messages have been sent out for this appointment! Please see the status of the messages below:</h3>
        <table>
          <tr>
            <th>Service Areas in this appointment</th>
            <td>${serviceAreas}</td>
          </tr>
          <tr>
            <th>Clients in this appointment</th>
            <td>${sentTo}</td>
          </tr>
          <tr>
            <th>Messages Sent Successfully</th>
            <td>${successMsgs}</td>
          </tr>
          <tr>
            <th>Undelivered Messages</th>
            <td>${undeliveredMsgs}</td>
          </tr>
          <tr>
            <th>Failed Messages</th>
            <td>${failedMsgs}</td>
          </tr>
        </table>
      </body>
    </html>`
  };

  mailTransport.sendMail(mailDetails, async (err, data) => {
    if (err) {
      console.log({ err });
      throw err;
    }
  })
}


module.exports = new MessageController();