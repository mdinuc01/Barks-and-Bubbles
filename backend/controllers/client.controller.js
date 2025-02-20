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

      let oldClient = await Client.findOne({ _id: id, created_by: req.userId }).lean();

      let controlRoute = await Route.findOne({ "name": "control", createdBy: req.userId }).lean();
      let order;

      const area = controlRoute.serviceAreas.find((area) => area.name == oldClient.serviceArea);
      if (!area) return; // Exit if the serviceArea does not exist

      const newLength = area.length - 1;

      if (updatedData.serviceArea != oldClient.serviceArea) {
        // If the new length is greater than 0, update it
        if (newLength > 0) {
          await Route.updateOne(
            { name: "control", createdBy: req.userId },
            { $set: { "serviceAreas.$[element].length": newLength } },
            {
              arrayFilters: [{ "element.name": oldClient.serviceArea }],
              multi: false,
            }
          );
        } else {
          // If the new length is 0, remove the serviceArea object
          await Route.updateOne(
            { name: "control", createdBy: req.userId },
            { $pull: { serviceAreas: { name: oldClient.serviceArea } } }
          );
        }

        //add to new serviceArea
        const serviceAreaControlNew = await controlRoute.serviceAreas.find((area) => area.name == updatedData.serviceArea);

        if (serviceAreaControlNew && serviceAreaControlNew.length) {
          order = serviceAreaControlNew.length;

          //updating all routes with the serviceArea present 
          await Route.updateOne(
            { "name": "control", createdBy: req.userId },
            { $set: { "serviceAreas.$[element].length": order + 1 } },
            {
              arrayFilters: [{ "element.name": updatedData.serviceArea }],
              multi: false

            }
          );
        }
        else {
          order = 0;

          await Route.updateOne(
            { name: "control", createdBy: req.userId, "serviceAreas.name": { $ne: updatedData.serviceArea } },
            { $push: { serviceAreas: { name: updatedData.serviceArea, length: 1 } } }, // Add new if not exists
            { multi: false }
          );
        }
      }

      //update client record
      let data = await Client.findOneAndUpdate({ _id: id, created_by: req.userId }, {
        $set: {
          'petParentName': updatedData.petParentName,
          'contactMethod': updatedData.contactMethod,
          'serviceArea': updatedData.serviceArea,
          'address': updatedData.address,
          'type': updatedData.type,
          'order': order
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

      let route = await Route.findOne({ "name": "control", createdBy: req.userId }).lean();

      const serviceAreaControl = await route.serviceAreas.find((area) => area.name == serviceArea);
      let order;

      if (serviceAreaControl && serviceAreaControl.length) {
        order = serviceAreaControl.length;

        //updating all routes with the serviceArea present 
        await Route.updateOne(
          { "name": "control", createdBy: req.userId },
          { $set: { "serviceAreas.$[element].length": order + 1 } },
          {
            arrayFilters: [{ "element.name": serviceArea }],
            multi: false

          }
        );
      }
      else {
        order = 0;

        await Route.updateOne(
          { name: "control", createdBy: req.userId, "serviceAreas.name": { $ne: serviceArea } },
          { $push: { serviceAreas: { name: serviceArea, length: 1 } } }, // Add new if not exists
          { multi: false }
        );
      }

      let createdClient = await Client.create({
        petParentName, contactMethod, serviceArea, address, order, type: [], petName, pets: [{ animalType, breed, petName }],
        created_by: req.userId
      });

      let data = await Client.find({ created_by: req.userId }).lean();

      if (data)
        return res.status(200).json({ message: `Client created`, data: { clients: data, createdId: createdClient._id } });

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
      let clients = await Client.find({ created_by: req.userId });
      clients = clients.filter(client => client.type.includes("Nail Trimming"));

      const allAreas = await Client.find({ created_by: req.userId }).distinct('serviceArea');

      const allClients = allAreas.map(area => {
        let clientsInLocation = clients.filter(client => client.serviceArea == area);
        return { [area]: clientsInLocation };
      });

      let sentClients = [];

      if (app.messages.sentTo) {
        clients = clients.filter((pet) => {
          return app.messages.sentTo.some((c) => {
            return c.id == pet._id;
          });
        });

        locations = app.route.serviceAreas.map((a) => a.name);

        sentClients = locations.map(locationVal => {
          let clientsInLocation = clients.filter(client => client.serviceArea === locationVal);
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

    const deletedClient = await Client.findOneAndDelete({ _id: id, created_by: req.userId }).lean();

    if (!deletedClient) {
      return res.status(404).json({ error: 'Pet not found or unauthorized' });
    }

    const serviceArea = deletedClient.serviceArea;
    let route = await Route.findOne({ name: "control", createdBy: req.userId }).lean();

    const area = route.serviceAreas.find((area) => area.name == serviceArea);
    if (!area) return; // Exit if the serviceArea does not exist

    const newLength = area.length - 1;

    // If the new length is greater than 0, update it
    if (newLength > 0) {
      await Route.updateOne(
        { name: "control", createdBy: req.userId },
        { $set: { "serviceAreas.$[element].length": newLength } },
        {
          arrayFilters: [{ "element.name": serviceArea }],
          multi: false,
        }
      );
    } else {
      // If the new length is 0, remove the serviceArea object
      await Route.updateOne(
        { name: "control", createdBy: req.userId },
        { $pull: { serviceAreas: { name: serviceArea } } }
      );
    }


    res.status(200).json({ message: 'Pet Deleted Successfully', deleted: true });
  }

  async updateClientOrder(req, res) {
    const clients = req.body.clients;
    try {

      clients.clients.forEach(async client => {
        await Client.findOneAndUpdate({ _id: client._id, created_by: req.userId }, {
          $set: {
            'order': client.order,
          }
        })

      });

      res.status(200).json({ message: 'Clients order updated', updated: true });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error, update: false });

    }
  }
}

module.exports = new ClientController();
