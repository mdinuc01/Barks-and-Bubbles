const Pet = require('../models/Pet.js');

class ClientController {

  async getAllClients(req, res, next) {
    try {
      let data = await Pet.find({ created_by: req.userId });

      return res.status(200).json({ message: `Clients found: ${data.length}`, data });

    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  // async addClientsToTable(req, res, next) {
  //   try {
  //     const data = req.body.data;
  //     // let db = new JsonDB(new Config("clients", true, false, '/'));

  //     if (data) {
  //       data.forEach(async client => {
  //         const clientData = Pet.fromJSON(client);
  //         await db.push('/clients[]', clientData.toData());
  //       });
  //     }
  //     let currentData = await db.getData("/clients");


  //     if (currentData.length) {
  //       return res.status(200).json({ message: `Current Clients: ${currentData.length}`, data: currentData });
  //     } else {
  //       return res.status(404).json({ message: "No Clients found" });
  //     }
  //   } catch (error) {
  //     return res.status(500).json({ message: "Internal Server Error", error });
  //   }
  // }

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
}

module.exports = new ClientController();
