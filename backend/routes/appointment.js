const express = require('express');
const AppointmentController = require('../controllers/appointment.controller.js');
const verifyToken = require('../middleware/authJwt.js');

const router = express.Router();
router.use(verifyToken);

router.get('/', AppointmentController.getAllAppointments);
router.get('/:id', AppointmentController.getAppointmentId);

router.post('/add', AppointmentController.addAppointment);

router.put("/time/:id", AppointmentController.saveAppointmentTimes);
router.put("/time/archive/:id", AppointmentController.archiveAppointment);

router.put('/addPetToReplies', AppointmentController.addPetToReplies);
router.put('/deleteReply', AppointmentController.deleteReply);

module.exports = router;
