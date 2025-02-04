const Appointment = require('../models/Appointment.js');
const Pet = require('../models/Pet.js');
const Routes = require('../models/Route.js');

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
      const idToFind = req.params.id;

      const app = await Appointment.findOne({ _id: idToFind, created_by: req.userId }).populate('route', 'name serviceAreas');
      let locations = app.route.serviceAreas.map((a) => a.name);

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

      const app = await Appointment.findOne({ _id: appId }).select('route scheduler name serviceAreas')
        .populate('route').lean();

      let petIncluded = app.scheduler.some((a) => {
        return a.replies.some((r) => {
          return r.id == petId && !r.delete;
        })
      });

      if (petIncluded) {
        return res.status(200).json({ message: `Client already has a reply!`, data: app });
      }

      const pet = await Pet.findOne({ _id: petId, created_by: req.userId }).lean();

      if (!pet || !app) {
        return res.status(404).json({ message: `Appointment or pet not found` });

      }

      let serviceAreaObj = await app.route.serviceAreas.find((r) => {
        if (r.name == pet.serviceArea) return r;
      });

      let newScheduler = [];

      if (serviceAreaObj) {

        newScheduler = app.scheduler.map((s) => {
          if (s.name == pet.serviceArea) {
            s.replies.push({
              "time": serviceAreaObj.time && serviceAreaObj.time != null ? serviceAreaObj.time : null,
              "status": 'received',
              "defaultTime": true,
              "clientReplies": [],
              "addedClient": true,
              "petParentName": pet.petParentName,
              "contactMethod": `+1${pet.contactMethod}`,
              "petName": pet.petName,
              "serviceArea": pet.serviceArea,
              "id": petId,
              "delete": false
            })
          }
          s.length = s.replies.filter((r) => !r.delete).length;
          return s;
        });
      } else {
        let serviceAreaFound = await Routes.findOne({ "serviceAreas.name": pet.serviceArea }).lean();

        newScheduler = app.scheduler;

        if (serviceAreaFound) {
          newScheduler.push({
            name: pet.serviceArea,
            replies: [
              {
                "time": serviceAreaFound.time,
                "status": 'received',
                "defaultTime": true,
                "clientReplies": [],
                "addedClient": true,
                "petParentName": pet.petParentName,
                "contactMethod": `+1${pet.contactMethod}`,
                "petName": pet.petName,
                "serviceArea": pet.serviceArea,
                "id": petId,
                delete: false
              }
            ],
            length: 1,
            increment: serviceAreaFound.increment
          })
        } else {
          newScheduler.push({
            name: pet.serviceArea,
            replies: [
              {
                "time": null,
                "status": 'received',
                "defaultTime": true,
                "clientReplies": [],
                "addedClient": true,
                "petParentName": pet.petParentName,
                "contactMethod": `+1${pet.contactMethod}`,
                "petName": pet.petName,
                "serviceArea": pet.serviceArea,
                "id": petId,
                delete: false
              }
            ],
            length: 1,
            increment: 0.5
          })
        }
      }

      await Appointment.findOneAndUpdate(
        { _id: appId },
        {
          $set: {
            scheduler: newScheduler
          }
        }
      );

      const data = await Appointment.findOne({ _id: appId });
      return res.status(200).json({ message: `Client reply added successfully!`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });

    }
  }

  async deleteReply(req, res) {
    try {
      const { appId, petId } = req.body;

      const app = await Appointment.findOne({ _id: appId }).select('route scheduler name serviceAreas')
        .populate('route').lean();

      const pet = await Pet.findOne({ _id: petId, created_by: req.userId }).lean();

      if (!app) {
        return res.status(404).json({ message: `Appointment not found` });
      }

      let scheduler = app.scheduler;
      let areaIndex = scheduler.findIndex((area) => area.name == pet.serviceArea);

      scheduler[areaIndex].replies = scheduler[areaIndex].replies.map((reply) => {
        if (reply.id == petId) {
          reply.delete = true;
        } 
        return reply;
      });
      scheduler[areaIndex].length = scheduler[areaIndex].replies.filter((r) => !r.delete).length;

      await Appointment.findOneAndUpdate(
        { _id: appId },
        {
          $set: {
            scheduler: scheduler
          }
        }
      );

      const data = await Appointment.findOne({ _id: appId });
      return res.status(200).json({ message: `Client reply deleted successfully!`, data });

    } catch (error) {
      console.log({error})
      return res.status(500).json({ message: "Internal Server Error", error });

    }
  }
}

module.exports = new AppointmentController();
