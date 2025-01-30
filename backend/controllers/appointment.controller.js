const Appointment = require('../models/Appointment.js');
const Pet = require('../models/Pet.js');


class AppointmentController {

  async getAllAppointments(req, res, next) {
    try {
      let data = await Appointment.find({ created_by: req.userId })
        .select('_id date location active route')
        .populate('route', 'name');

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
        route: data.location,
        created_by: req.userId

      })
      let currentData = await Appointment.find({ created_by: req.userId }).select('_id date location active route')
        .populate('route', 'name');
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

      const app = await Appointment.findOne({ _id: idToFind, created_by: req.userId }).populate('route', 'name serviceAreas');
      let locations = app.route.serviceAreas.map((a) => a.name);

      //mapping locations clients to app
      let pets = await Pet.find({ serviceArea: { $in: locations }, created_by: req.userId });

      let meta = app.route.serviceAreas;
      const data = { app, meta }

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
        { _id: appId, created_by: req.userId },
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
        { _id: appId, created_by: req.userId },
        {
          $set: {
            'active': isArchived,
          }
        }
      );

      const data = await Appointment.find({ created_by: req.userId }).select('_id date location active route')
        .populate('route', 'name');

      return res.status(200).json({ message: `Appointment Archived Successfully`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async addPetToReplies(req, res) {
    try {
      const { appId, petId } = req.body;

      const pet = await Pet.findOne({ _id: petId, created_by: req.userId });
      const app = await Appointment.findOne({ _id: appId });

      if (!pet || !app) {
        console.error('Pet or Appointment not found');
        return;
      }

      let updatedScheduler = findLocationByAreaName(app.scheduler, pet.serviceArea);

      if (updatedScheduler) {
        // Update the existing scheduler entry
        updatedScheduler.replies.push({
          sid: generateUniqueId(),
          body: '@Client Manually Added',
          from: `+1${pet.contactMethod}`,
          to: process.env.PHONE_NUMBER,
          time: null,
          status: 'received',
          id: petId,
          petName: pet.petName,
          petParentName: pet.petParentName,
          serviceArea: pet.serviceArea
        });
        updatedScheduler.replies.sort((a, b) => a.petName.localeCompare(b.petName));

        updatedScheduler.length += 1;

        // Find the index of the object in the scheduler array that has the key matching the service area
        const index = app.scheduler.findIndex(obj => Object.keys(obj)[0] === pet.serviceArea);

        // if (index !== -1) {
        // If the service area exists, update the specific array element
        const updateField = `scheduler.${index}.${pet.serviceArea}`;
        await Appointment.findOneAndUpdate(
          { _id: appId },
          {
            $set: {
              [updateField]: updatedScheduler
            }
          }
        );
      } else {
        let newReply = {
          replies: [
            {
              sid: generateUniqueId(),
              body: '@Client Manually Added',
              from: `+1${pet.contactMethod}`,
              to: process.env.PHONE_NUMBER,
              time: null,
              status: 'received',
              id: petId,
              petName: pet.petName,
              petParentName: pet.petParentName,
              serviceArea: pet.serviceArea
            }
          ],
          length: 1,
          increment: 0.5
        }

        // Find the index of the object in the scheduler array that has the key matching the service area
        const index = app.scheduler.length;

        // if (index !== -1) {
        // If the service area exists, update the specific array element
        const updateField = `scheduler.${index}.${pet.serviceArea}`;

        await Appointment.findOneAndUpdate(
          { _id: appId },
          {
            $set: {
              [updateField]: newReply
            }
          }
        );
      }
      const data = await Appointment.findOne({ _id: appId });
      return res.status(200).json({ message: `Pet added to replies successfully!`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });

    }
  }
}

function findLocationByAreaName(array, areaName) {
  for (let obj of array) {
    for (let key in obj) {
      if (key === areaName) {
        return obj[key];
      }
    }
  }
  return null; // Return null if no match is found
}

function generateUniqueId() {
  // Get the current timestamp in milliseconds
  const timestamp = Date.now();

  // Generate a random number between 0 and 99999
  const randomNum = Math.floor(Math.random() * 100000);

  // Combine the timestamp and random number to create a unique ID
  const uniqueId = `added-${timestamp}-${randomNum}`;

  return uniqueId;
}

module.exports = new AppointmentController();
