const Appointment = require('../models/Appointment.js');
const { JsonDB, Config } = require('node-json-db');

class AppointmentController {

  async getAllAppointments(req, res, next) {
    try {
      let db = new JsonDB(new Config("appointments", true, false, '/'));
      let data = await db.getData("/appointments");

      if (data.length) {
        return res.status(200).json({ message: `Appointments found: ${data.length}`, data });
      } else {
        return res.status(404).json({ message: "No Appointments found" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async addAppointment(req, res, next) {
    try {
      const data = req.body.data;
      let db = new JsonDB(new Config("appointments", true, false, '/'));
      if (data) {
        const appData = Appointment.fromJSON(data);
        await db.push('/appointments[]', appData.toData());
      }

      let currentData = await db.getData("/appointments");

      if (currentData.length) {
        return res.status(200).json({ message: `Appointments: ${currentData.length}`, data: currentData });
      } else {
        return res.status(404).json({ message: "No Appointments found" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async getAppointmentId(req, res, next) {
    try {
      let appDB = new JsonDB(new Config("appointments", true, false, '/'));
      let clientsDB = new JsonDB(new Config("clients", true, false, '/'));
      let location;
      let appData = await appDB.getData("/appointments");

      const idToFind = req.params.id;

      const app = await appData.find((app) => app.id == idToFind);

      //mapping locations clients to app
      let clients = await clientsDB.getData("/clients");

      if (app.messages.sentTo) {
        location = app.location.map(locationVal => {
          let clientsInLocation = clients.filter(client => {
            // let result = false;

            for (const obj of app.messages.sentTo) {
              if (obj.id === client.id) {
                return client;
              }
            }
          });
          return { [locationVal]: clientsInLocation };
        });

      } else {

        location = app.location.map(locationVal => {
          let clientsInLocation = clients.filter(client => client.serviceArea === locationVal);
          return { [locationVal]: clientsInLocation };
        });
      }

      let meta = app.location;
      const data = { ...app, location, meta }

      if (app) {
        return res.status(200).json({ message: `Appointment found`, data });
      } else {
        return res.status(404).json({ message: "Appointment not found" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async saveAppointmentTimes(req, res, next) {

    try {
      const appId = req.params.id;
      const replies = req.body.replies;
      let appDB = new JsonDB(new Config("appointments", true, false, '/'));
      let appData = await appDB.getData("/appointments");

      let index = await appData.findIndex((app) => app.id == appId);

      appData[index].replies = replies;
      await appDB.push("/appointments", appData);

      return res.status(200).json({ message: `Replies Saved` });


    } catch (error) {


    }
  }
}

module.exports = new AppointmentController();
