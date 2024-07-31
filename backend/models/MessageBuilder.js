const mongoose = require('mongoose');

const messageBuilderScheme = mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    }
  }
)

module.exports = mongoose.model("MessageBuilder", messageBuilderScheme);