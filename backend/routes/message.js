const express = require('express');
const MessageController = require('../controllers/message.controller.js');
const verifyToken = require('../middleware/authJwt.js');

const router = express.Router();
router.use(verifyToken);

router.put('/getReplies', MessageController.getReplies)
router.put('/sendMessage', MessageController.sendMessage);
router.put('/sendReplies/:id', MessageController.sendReplies);

module.exports = router;
