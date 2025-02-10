const Appointment = require('../models/Appointment.js');
const Client = require('../models/Client.js');
const Route = require('../models/Route.js');

class ClientController {

  async getAllClients(req, res, next) {
    try {
      let data = await Client.find({ created_by: req.userId });

      return res.status(200).json({ message: `Clients found: ${data.length}`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async getClientById(req, res, next) {
    try {

      const id = req.params.id;
      let data = await Client.findOne({ _id: id, created_by: req.userId });

      if (data)
        return res.status(200).json({ message: `Client found`, data });

      else
        return res.status(404).json({ message: `Client not found` });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }

  }

  async updateClient(req, res, next) {
    try {

      const id = req.params.id;
      const updatedData = req.body.data;



      let data = await Client.findOneAndUpdate({ _id: id, created_by: req.userId }, {
        $set: {
          'petParentName': updatedData.petParentName,
          'contactMethod': updatedData.contactMethod,
          'serviceArea': updatedData.serviceArea,
          'address': updatedData.address,
          'type': updatedData.type
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

  async createClient(req, res, next) {
    try {
      const { petParentName,
        contactMethod,
        animalType,
        breed,
        petName,
        serviceArea,
        address } = req.body;

      await Client.create({
        petParentName, contactMethod, animalType, breed, petName, serviceArea, address,
        created_by: req.userId
      });

      let data = await Client.find({ created_by: req.userId });

      if (data)
        return res.status(200).json({ message: `Client created`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async setActivate(req, res, next) {
    try {
      const { id, status } = req.body;

      await Client.findOneAndUpdate({ _id: id }, {
        $set: {
          'active': status,
        }
      })

      let data = await Client.find({ created_by: req.userId });

      if (data)
        return res.status(200).json({ message: `Status for ${id} was updated to ${status}`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async getAllClientsWithLocations(req, res) {
    try {
      const { id } = req.params;
      const app = await Appointment.findOne({ _id: id }).populate('route', 'serviceAreas');
      let locations = await Route.find({ createdBy: req.userId });
      let pets = await Client.find({ created_by: req.userId });

      const allAreas = await Client.find({ created_by: req.userId }).distinct('serviceArea');

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

  async deleteClient(req, res) {
    const { id } = req.params;

    const deletedClient = await Client.findOneAndDelete({ _id: id, created_by: req.userId });

    if (!deletedClient) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    res.status(200).json({ message: 'Pet Deleted Successfully', deleted: true });
  }
}

module.exports = new ClientController();
