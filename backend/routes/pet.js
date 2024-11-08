const express = require('express');
const petController = require('../controllers/pet.controller.js');
const verifyToken = require('../middleware/authJwt.js');

const router = express.Router();
router.use(verifyToken);

router.get('/', petController.getAllClients);
router.get('/:id', petController.getPetById);
router.get('/petsWithLocations/:id', petController.getAllPetsWithLocations);

router.post('/add', petController.createPet);
router.put('/status', petController.setActivate);
router.put('/update/:id', petController.updatePet);


module.exports = router;
