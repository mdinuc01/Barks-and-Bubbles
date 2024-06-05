const Message = require('../models/Message.js');
const Pet = require('../models/Pet.js');
const Appointment = require('../models/Appointment.js');
const { JsonDB, Config } = require('node-json-db');
const SMSUtils = require('../utils/SMSUtils.js');


class MessageController {

  async sendMessage(req, res, next) {
    try {
      let locations = req.body.locations;
      let date = req.body.date;
      let appId = req.body.appId;

      // const appDB = new JsonDB(new Config("appointments", true, false, "/"));
      // const clientDB = new JsonDB(new Config("clients", true, false, '/'));
      let pets = await Pet.find();
      let clientSentTo = [];

      //sending messages and populating message array for response retrieval
      if (pets.length) {
        pets.forEach(async (pet) => {

          if (locations.includes(pet.serviceArea)) {

            //*Console logs for testing users to send message to
            // let messageText = new Message(pet, date).createMessage();
            // console.log(messageText + "\n");
            SMSUtils.sendText(pet, date);
            clientSentTo.push({ id: pet.id, contactMethod: pet.contactMethod, petName: pet.petName, petParentName: pet.petParentName, serviceArea: pet.serviceArea });

          }
        });


        const update = {
          'messages.sentTo': clientSentTo,
          'messages.sentDate': new Date()
        };

        const app = await Appointment.findOneAndUpdate(
          { _id: appId },
          {
            $set: {
              'messages.sentTo': clientSentTo,
              'messages.sentDate': new Date()
            }
          },
          { new: true }
        );

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



      if (app.scheduler && app.scheduler.length) {
        app.location.forEach((l) => {
          const scheduler = app.scheduler.find(obj => obj.hasOwnProperty(l));

          if (scheduler[l].replies && scheduler[l].replies.length && scheduler[l].increment) {
            scheduler[l].replies.forEach(async (reply) => {
              if (reply.time && reply.time != null && reply.petParentName) {
                let name = { petParentName: reply.petParentName, contactMethod: reply.from.substring(2) }
                //     // let message = new Message(name, reply.time);
                await SMSUtils.sendReply(name, reply.time, scheduler[l].increment);
              }
            })
          }
        })

        return res.status(200).json({ message: `Replies sent` });
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async getReplies(req, res, next) {
    try {
      const { sentDate, appId } = req.body;
      let replies = await SMSUtils.getReplies(sentDate);
      let app = await Appointment.findOne({ _id: appId });


      let messagesData = app.messages.sentTo;

      const numbersSentTo = messagesData.map((message) => message.contactMethod.toString());
      replies = replies.filter((reply) => {
        let to = reply.to.replaceAll("+1", "");
        let from = reply.from.replaceAll("+1", "");

        if (reply.direction.includes("outbound") && numbersSentTo.includes(to)) { return reply; }

        else if (reply.direction.includes("inbound") && numbersSentTo.includes(from))
          return reply;
      });

      let newReplies = await replies.map((r) => {
        let time;
        let petParentName;
        let currentReply = app.replies.find((reply) => reply.sid === r.sid);
        if (currentReply && currentReply.time) {
          time = currentReply.time;
          petParentName = currentReply.petParentName;

        }
        return { ...r, time, petParentName }


      });

      newReplies = removeCircularReferences(newReplies);


      let schedulerReplies = app.location.map((l) => {
        const scheduler = app.scheduler.find(obj => obj.hasOwnProperty(l));
        let replies = newReplies.filter((r) => {
          if (r.from == "+13346410423") return;

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
        });

        return { [l]: { replies, length: replies.length, increment: scheduler[l].increment ? scheduler[l].increment : "0.5" } };
      });


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

      return res.status(200).json({ message: `Found Replies`, data });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
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


module.exports = new MessageController();
