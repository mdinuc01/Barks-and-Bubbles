const Client = require('../models/Client.js');
const { JsonDB, Config } = require('node-json-db');

class ClientController {

  async getAllClients(req, res, next) {

    try {
      let db = new JsonDB(new Config("clients", true, false, '/'));
      let data = await db.getData("/clients");

      if (data.length) {
        return res.status(200).json({ message: `Clients found: ${data.length}`, data });
      } else {
        return res.status(404).json({ message: "No Clients found" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async addClientsToTable(req, res, next) {
    try {
      const data = req.body.data;
      let db = new JsonDB(new Config("clients", true, false, '/'));

      if (data) {
        data.forEach(async client => {
          const clientData = Client.fromJSON(client);
          await db.push('/clients[]', clientData.toData());
        });
      }
      let currentData = await db.getData("/clients");


      if (currentData.length) {
        return res.status(200).json({ message: `Current Clients: ${currentData.length}`, data: currentData });
      } else {
        return res.status(404).json({ message: "No Clients found" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }
}

module.exports = new ClientController();
