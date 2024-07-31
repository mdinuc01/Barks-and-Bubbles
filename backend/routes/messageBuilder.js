const express = require('express');
const MessageBuilderController = require('../controllers/messageBuilder.controller.js');
const verifyToken = require('../middleware/authJwt.js');

const router = express.Router();
router.use(verifyToken);

router.get('/', MessageBuilderController.getMessages);
router.put('/update', MessageBuilderController.updateMessage);

module.exports = router;
