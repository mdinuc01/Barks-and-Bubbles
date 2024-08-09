const express = require('express');
const RouteController = require('../controllers/route.controller.js');
const verifyToken = require('../middleware/authJwt.js');

const router = express.Router();
router.use(verifyToken);

router.get('/', RouteController.getAllRoutes);
router.get('/get', RouteController.getRoute);

router.post('/create', RouteController.createRoute);

router.put('/update', RouteController.updateRoute);

router.delete('/delete', RouteController.deleteRoute);
module.exports = router;