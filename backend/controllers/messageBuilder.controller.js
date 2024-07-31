const Builder = require('../models/MessageBuilder.js');

class MessageBuilderController {

  async getMessages(req, res, next) {
    try {
      const data = await Builder.find();
      return res.status(200).json({ message: `Messages found`, data });

    } catch (error) {
      return res.status(500).json({ message: `Internal Server Error` });
    }
  }

  async updateMessage(req, res, next) {
    try {
      const { _id, updateMessage } = req.body;
      const builder = await Builder.findOneAndUpdate({ _id },
        { $set: { 'message': updateMessage } },
        { new: true });


      if (builder) {
        const data = await Builder.find();
        return res.status(200).json({ message: `Messages updated`, data });
      } else {
        return res.status(404).json({ message: `Message not found` });

      }
    } catch (error) {
      return res.status(500).json({ message: `Internal Server Error` });
    }
  }
}

module.exports = new MessageBuilderController();
