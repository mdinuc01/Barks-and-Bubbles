const express = require('express');
const clientController = require('../controllers/clients.controller.js');

const router = express.Router();

router.get('/', clientController.getAllClients);

router.post('/add', clientController.addClientsToTable);

module.exports = router;
