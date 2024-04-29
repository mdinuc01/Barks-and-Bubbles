const express = require('express');
const clientController = require('../controllers/clients.controller');

const router = express.Router();

router.get('/', clientController.getAllClients);

module.exports = router;
