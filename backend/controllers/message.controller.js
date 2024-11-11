const Message = require('../models/Message.js');
const Pet = require('../models/Pet.js');
const Appointment = require('../models/Appointment.js');
const SMSUtils = require('../utils/SMSUtils.js');
const nodemailer = require("nodemailer");
const Builder = require('../models/MessageBuilder.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const osascript = require('osascript');

class MessageController {

  async sendMessage(req, res, next) {
    try {    
      const templatePath = path.join(__dirname, '..', 'scripts', 'sendMessageTemplate.scpt');
      let message = "All messages sent successfully!";
    
      // If AppleScript Template Cannot be retrieved
      if (!fs.existsSync(templatePath)) {
        return res.status(500).json({ message: "AppleScript template file not found." });
      }
  
      const { date, appId } = req.body;
      const pets = await Pet.find({ created_by: req.userId });
      const app = await Appointment.findOne({ _id: appId }).populate('route', 'serviceAreas');
      const areas = app?.route?.serviceAreas.map(a => a.name) || [];
      const messageObj = await Builder.findOne({ name: "First Message" });
      const generatedMessages = [];
  
      if (pets.length && app) {
        pets.forEach(pet => {
          if (pet.active && pet.contactMethod && isValidPhoneNumber(pet.contactMethod) && areas.includes(pet.serviceArea)) {
            const messageText = new Message(pet, date, 0, messageObj.message).createMessage();
            if (messageText?.trim()) {
              generatedMessages.push({ message: messageText, phoneNumber: pet.contactMethod });
            }
          }
        });
  
        if (generatedMessages.length === 0) {
          return res.status(400).json({ message: "No valid messages to send." });
        }
      } else {
        return res.status(404).json({ message: "No pets or appointment data found." });
      }
  
      if (os.platform() !== 'darwin') {
        return res.status(500).json({ message: "Messaging is only supported on macOS." });
      }
  
      
      // Create an array of promises for all script executions
      const scriptPromises = generatedMessages.map(async ({ message: messageText, phoneNumber }) => {
        const templateScript = fs.readFileSync(templatePath, 'utf8');
        const scriptContent = templateScript
          .replace("{PHONE_NUMBER}", phoneNumber)
          .replace("{MESSAGE_TEXT}", messageText.replace(/"/g, '\\"')); // Escape double quotes properly
  
        try {
          // Use osascript.eval to execute the AppleScript directly as a string
          await new Promise((resolve, reject) => {
            osascript.eval(scriptContent, { type: 'AppleScript' }, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        } catch (err) {
          console.log("Error sending message:", err);
          message = "Some messages failed to send.";
        }
      });
  
      // Wait for all scripts to execute
      await Promise.all(scriptPromises);
  
      return res.status(200).json({ message, data: { messages: generatedMessages } });
    } catch (error) {
      console.error({ error });
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }
  

  async sendReplies(req, res, next) {
    try {
      let appId = req.params.id;

      const app = await Appointment.findOne({ _id: appId }).populate('route', 'serviceAreas');
      let areas = app.route.serviceAreas.map((a) => a.name);
      let messageObj = await Builder.findOne({ "name": "Second Message" });

      if (app.scheduler && app.scheduler.length && areas.length) {
        areas.forEach((l) => {
          const scheduler = app.scheduler.find(obj => obj.hasOwnProperty(l));
          if (scheduler[l].replies && scheduler[l].replies.length && scheduler[l].increment) {
            scheduler[l].replies.forEach(async (reply) => {
              if (reply.id && reply.time && reply.time != null && reply.petParentName && reply.from) {
                const pet = await Pet.findOne({ _id: reply.id });
                await SMSUtils.sendReply(pet, reply.time, scheduler[l].increment, messageObj.message);
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

    let app = await Appointment.findOne({ _id: appId }).populate('route', 'name serviceAreas');
    let areas = app.route.serviceAreas.map((a) => a);

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
      } else if (reply.direction.includes("inbound") && numbersSentTo.includes(from))
        return reply;

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
      schedulerReplies = areas.map((l) => {
        const scheduler = app.scheduler.find(obj => { if (obj) return obj.hasOwnProperty(l.name) });

        if (!scheduler) {
          return { [l.name]: { replies: [], length: 0, increment: "0.5" } };
        }

        let replies = newReplies.filter((r) => {
          if (r.from == process.env.TWILIO_PHONE_NUMBER) return false; // Changed from return to return false to avoid including undefined elements
          let from = r.from.substring(2);
          let meta = messagesData.find((m) => m.contactMethod == from);
          return !!(meta && meta.serviceArea == l.name);
        }).map((r) => {
          let from = r.from.substring(2);
          let meta = messagesData.find((m) => m.contactMethod == from);

          if (meta) {
            let { contactMethod, ...metaWithoutContactMethod } = meta;

            let time;
            let defaultTime;

            if (l && l.time) {
              time = l.time;
            }
            let currentReply = scheduler[l.name].replies.find((reply) => reply.sid === r.sid);

            if (currentReply && (currentReply.time || currentReply.time == null) && !currentReply.defaultTime) {
              time = currentReply.time;
            }

            if (currentReply && currentReply.defaultTime != null) {
              defaultTime = currentReply.defaultTime
            } else {
              defaultTime = true;
            }

            return {
              sid: r.sid,
              body: r.body,
              from: r.from,
              to: r.to,
              time,
              status: r.status,
              defaultTime: defaultTime,
              ...metaWithoutContactMethod
            };
          }
          return null; // Explicitly return null for non-matching replies
        }).filter(reply => reply !== null) // Filter out null values

        replies = replies.sort((a, b) => {
          // console.log({ a })
          const propA = a.petName.toLowerCase();
          const propB = b.petName.toLowerCase();
          if (propA < propB) {
            return -1;
          }
          if (propA > propB) {
            return 1;
          }
          return 0;
        })

        let increment = 0.5;
        if (l && l.increment) {
          increment = l.increment
        }

        return { [l.name]: { replies, length: replies.length, increment: increment } };
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
    ).populate('route', 'name serviceAreas');

    const data = { app: newApp._doc };
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

verifyAppData = (appData) => {

  const replies = appData.replies;

  const sentTo = appData.messages.sentTo.length;
  const successMsgs = replies.filter((r) => r.status == "delivered").length;
  const undeliveredMsgs = replies.filter((r) => r.status == "undelivered").length;
  const failedMsgs = replies.filter((r) => r.status == "failed").length;

  return sentTo == (successMsgs + undeliveredMsgs + failedMsgs);
}

sendEmailUpdate = (date, appData) => {
  const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const route = appData.route.name;
  const areas = app.route.serviceAreas.map((a) => a.name);

  const serviceAreas = areas.join(", ");
  const replies = appData.replies;
  const sentTo = appData.messages.sentTo.length;
  const successMsgs = replies.filter((r) => r.status == "delivered").length;
  const undeliveredMsgs = replies.filter((r) => r.status == "undelivered").length;
  const failedMsgs = replies.filter((r) => r.status == "failed").length;

  let mailDetails = {
    from: process.env.EMAIL,
    to: process.env.EMAIL_TO,
    subject: `Barks & Bubbles Appointment - ${route} - ${date}`,
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
        <title>Barks & Bubbles Appointment - ${route} - ${date}</title>
      </head>
      <body>
        <h1>Barks & Bubbles Appointment - ${route} - ${date}</h1>
        <h3>All messages have been sent out for this appointment! Please see the status of the messages below:</h3>
        <table>
         <tr>
            <th>Route for this appointment</th>
            <td>${route}</td>
          </tr>
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