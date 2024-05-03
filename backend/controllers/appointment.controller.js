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
}

module.exports = new AppointmentController();
