const Message = require('../models/Message.js');
const { JsonDB, Config } = require('node-json-db');
const SMSUtils = require('../utils/SMSUtils.js');


class MessageController {

  async sendMessage(req, res, next) {
    try {
      let locations = req.body.locations;
      let date = req.body.date;
      let appId = req.body.appId;

      const appDB = new JsonDB(new Config("appointments", true, false, "/"));
      const clientDB = new JsonDB(new Config("clients", true, false, '/'));
      let clients = await clientDB.getData("/clients");
      let clientSentTo = [];

      //sending messages and populating message array for response retrieval
      if (clients.length) {
        clients.forEach(async (client) => {

          if (locations.includes(client.serviceArea)) {

            //*Console logs for testing users to send message to
            // let messageText = new Message(client, date).createMessage();
            // console.log(messageText + "\n");
            SMSUtils.sendText(client, date);
            clientSentTo.push({ id: client.id, contactMethod: client.contactMethod, petName: client.petName, petParentName: client.petParentName });

          }
        });

        let appData = await appDB.getData("/appointments");
        const index = appData.findIndex(app => app.id === appId);

        if (index !== -1) {
          appData[index].messages = { sentTo: clientSentTo, sentDate: new Date() };
          await appDB.push("/appointments", appData);

          appData = await appDB.getData("/appointments");
          const app = await appData.find((app) => app.id == appId);

          let clients = await clientDB.getData("/clients");

          const location = app.location.map(locationVal => {
            const clientsInLocation = clients.filter(client => client.serviceArea === locationVal);
            return { [locationVal]: clientsInLocation };
          });

          let meta = app.location;
          const data = { ...app, location, meta }

          return res.status(200).json({ message: `Messages sent`, data });
        }
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
            // console.log(message.createReply() + "/n");

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

      const appDB = new JsonDB(new Config("appointments", true, false, "/"));
      const clientsDB = new JsonDB(new Config("clients", true, false, '/'));

      let app;

      let replies = await SMSUtils.getReplies(sentDate);
      let appData = await appDB.getData("/appointments");
      const index = appData.findIndex(app => app.id === appId);

      if (index !== -1) {
        let messagesData = await appData[index].messages.sentTo;

        const numbersSentTo = messagesData.map((message) => message.contactMethod.toString());

        replies = replies.filter((reply) => {
          let to = reply.to.replaceAll("+1", "");
          let from = reply.from.replaceAll("+1", "");

          if (reply.direction.includes("outbound") && numbersSentTo.includes(to))
            return reply;

          else if (reply.direction.includes("inbound") && numbersSentTo.includes(from))
            return reply;
        });

        let currentSids = appData[index].replies.map((r) => r.sid);
        let repliesFiltered = replies.filter((r) => !currentSids.includes(r.sid));

        if (repliesFiltered.length > 0) {

          // Add elements of repliesFiltered to the beginning of replies
          for (let i = repliesFiltered.length - 1; i >= 0; i--) {
            appData[index].replies.unshift(repliesFiltered[i]);
          }
        }

        await appDB.push("/appointments", appData);

        app = await appData.find((app) => app.id == appId);
      }
      let clients = await clientsDB.getData("/clients");

      let location = app.location.map(locationVal => {
        let clientsInLocation = clients.filter(client => {
          // let result = false;

          for (const obj of app.messages.sentTo) {
            if (obj.id === client.id) {
              return client;
            }
          }
          return;
        });
        return { [locationVal]: clientsInLocation };
      });

      let meta = app.location;
      const data = { ...app, location, meta };

      return res.status(200).json({ message: `Found Replies`, data });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

}

module.exports = new MessageController();
