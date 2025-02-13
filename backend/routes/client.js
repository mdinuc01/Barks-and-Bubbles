const express = require('express');
const clientController = require('../controllers/client.controller.js');
const verifyToken = require('../middleware/authJwt.js');

const router = express.Router();
router.use(verifyToken);

router.get('/', clientController.getAllClients);
router.get('/:id', clientController.getClientById);
router.get('/clientsWithLocations/:id', clientController.getAllClientsWithLocations);

router.post('/add', clientController.createClient);
router.put('/status', clientController.setActivate);
router.put('/update/:id', clientController.updateClient);
router.put('/client-order-change', clientController.updateClientOrder);

router.delete('/delete/:id', clientController.deleteClient);

module.exports = router;
