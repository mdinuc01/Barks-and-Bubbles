const Appointment = require('../models/Appointment.js');
const Pet = require('../models/Pet.js');

const { JsonDB, Config } = require('node-json-db');

class AppointmentController {

  async getAllAppointments(req, res, next) {
    try {
      let data = await Appointment.find();

      return res.status(200).json({ message: `Appointments found: ${data.length}`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async addAppointment(req, res, next) {
    try {
      const data = req.body;

      await Appointment.create({
        date: new Date(data.date),
        location: data.location,

      })
      let currentData = await Appointment.find();
      if (currentData) {

        return res.status(200).json({ message: `Appointment create`, data: currentData });
      } else {
        return res.status(404).json({ message: "No Appointments found" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async getAppointmentId(req, res, next) {
    try {
      let location;

      const idToFind = req.params.id;

      const app = await Appointment.findOne({ _id: idToFind });
      let locations = app.location;
      //mapping locations clients to app
      let pets = await Pet.find({ serviceArea: { $in: locations } });

      if (app.messages.sentTo) {
        location = app.location.map(locationVal => {
          let clientsInLocation = pets.filter(client => {
            // let result = false;

            for (const obj of app.messages.sentTo) {
              if (obj.id === client.id && client.serviceArea == locationVal) {
                return client;
              }
            }
          });
          return { [locationVal]: clientsInLocation };
        });

      } else {

        location = app.location.map(locationVal => {
          let clientsInLocation = pets.filter(client => client.serviceArea === locationVal);
          return { [locationVal]: clientsInLocation };
        });
      }

      let meta = app.location;
      const data = { app, location, meta }

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

      await Appointment.findOneAndUpdate(
        { _id: appId },
        {
          $set: {
            'scheduler': replies,
          }
        },
        { new: true }
      );

      return res.status(200).json({ message: `Replies Saved` });


    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async archiveAppointment(req, res, next) {
    try {
      const appId = req.params.id;
      const isArchived = req.body.isArchived;
      await Appointment.findOneAndUpdate(
        { _id: appId },
        {
          $set: {
            'active': isArchived,
          }
        }
      );

      const data = await Appointment.find();

      return res.status(200).json({ message: `Appointment Archived Successfully`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }
}

module.exports = new AppointmentController();
