const Appointment = require('../models/Appointment.js');
const Pet = require('../models/Pet.js');
const Route = require('../models/Route.js');

class ClientController {

  async getAllClients(req, res, next) {
    try {
      let data = await Pet.find({ created_by: req.userId });

      return res.status(200).json({ message: `Clients found: ${data.length}`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async getPetById(req, res, next) {
    try {

      const id = req.params.id;
      let data = await Pet.findOne({ _id: id, created_by: req.userId });

      if (data)
        return res.status(200).json({ message: `Client found`, data });

      else
        return res.status(404).json({ message: `Client not found` });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }

  }

  async updatePet(req, res, next) {
    try {

      const id = req.params.id;
      const updatedData = req.body.data;



      let data = await Pet.findOneAndUpdate({ _id: id, created_by: req.userId }, {
        $set: {
          'petParentName': updatedData.petParentName,
          'contactMethod': updatedData.contactMethod,
          'animalType': updatedData.animalType,
          'breed': updatedData.breed,
          'petName': updatedData.petName,
          'serviceArea': updatedData.serviceArea,
          'address': updatedData.address,
          'active': updatedData.active
        }
      },
        { new: true });

      if (data)
        return res.status(200).json({ message: `Client updated`, data });

      else
        return res.status(404).json({ message: `Client not found` });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }

  }

  async createPet(req, res, next) {
    try {
      const { petParentName,
        contactMethod,
        animalType,
        breed,
        petName,
        serviceArea,
        address } = req.body;

      await Pet.create({
        petParentName, contactMethod, animalType, breed, petName, serviceArea, address,
        created_by: req.userId
      });

      let data = await Pet.find({ created_by: req.userId });

      if (data)
        return res.status(200).json({ message: `Client created`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async setActivate(req, res, next) {
    try {
      const { id, status } = req.body;

      await Pet.findOneAndUpdate({ _id: id }, {
        $set: {
          'active': status,
        }
      })

      let data = await Pet.find({ created_by: req.userId });

      if (data)
        return res.status(200).json({ message: `Status for ${id} was updated to ${status}`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async getAllPetsWithLocations(req, res) {
    try {
      const { id } = req.params;
      const app = await Appointment.findOne({ _id: id }).populate('route', 'serviceAreas');
      let locations = await Route.find({ createdBy: req.userId });
      let pets = await Pet.find({ created_by: req.userId });

      const allAreas = await Pet.find({ created_by: req.userId }).distinct('serviceArea');

      const allClients = allAreas.map(area => {
        let clientsInLocation = pets.filter(client => client.serviceArea == area);
        return { [area]: clientsInLocation };
      });

      let sentClients = [];

      if (app.messages.sentTo) {
        pets = pets.filter((pet) => {
          return app.messages.sentTo.some((c) => {
            return c.id == pet._id;
          });
        });

        locations = app.route.serviceAreas.map((a) => a.name);

        sentClients = locations.map(locationVal => {
          let clientsInLocation = pets.filter(client => client.serviceArea === locationVal);
          return { [locationVal]: clientsInLocation };
        });
      }

      const data = { allClients, sentClients };

      return res.status(200).json({ message: `All clients found`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }

  }
}

module.exports = new ClientController();
