const express = require('express');
const petController = require('../controllers/pet.controller.js');
const verifyToken = require('../middleware/authJwt.js');

const router = express.Router();
router.use(verifyToken);

router.get('/', petController.getAllClients);
router.get('/petsWithLocations/:id', petController.getAllPetsWithLocations);

router.post('/add', petController.createPet);
router.put('/status', petController.setActivate);


module.exports = router;
