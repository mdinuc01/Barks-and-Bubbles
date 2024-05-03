const express = require('express');
const AppointmentController = require('../controllers/appointment.controller.js');

const router = express.Router();

router.get('/', AppointmentController.getAllAppointments);

router.put('/add', AppointmentController.addAppointment);

module.exports = router;
