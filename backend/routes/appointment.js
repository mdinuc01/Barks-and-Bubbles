const express = require('express');
const AppointmentController = require('../controllers/appointment.controller.js');

const router = express.Router();

router.get('/', AppointmentController.getAllAppointments);
router.get('/:id', AppointmentController.getAppointmentId);

router.post('/add', AppointmentController.addAppointment);

router.put("/time/:id", AppointmentController.saveAppointmentTimes);

module.exports = router;
