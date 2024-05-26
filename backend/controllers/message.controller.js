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
      // let date = req.body.date;
      let db = new JsonDB(new Config("appointments", true, false, '/'));
      let apps = await db.getData("/appointments");

      const app = await apps.find((app) => app.id == appId);


      if (app.replies.length) {
        app.replies.forEach((reply) => {
          if (reply.time && reply.time != null && reply.name) {
            let name = { petParentName: reply.name, contactMethod: reply.from.substring(2) }
            let message = new Message(name, reply.time);

            SMSUtils.sendReply(name, reply.time);

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
      let app = await Appointment.findOne({ _id: appId })


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

      let newApp = await Appointment.findOneAndUpdate(
        { _id: appId },
        {
          'replies': newReplies,
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
          return;
        });
        return { [locationVal]: clientsInLocation };
      });

      let meta = app.location;
      const data = { app: newApp._doc, location, meta };

      return res.status(200).json({ message: `Found Replies`, data });
    } catch (error) {
      console.log({ error })
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
