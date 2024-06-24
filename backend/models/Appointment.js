const mongoose = require('mongoose');

const appointmentScheme = mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    location: {
      type: Array,
      required: true
    },
    active: {
      type: Boolean,
      required: true,
      default: true
    },
    messages: {
      type: {},
      required: true,
      default: {}
    },
    replies: {
      type: Array,
      required: true,
      default: []
    },
    scheduler: {
      type: Array,
      required: true,
      default: []
    },
    created_by:
    {
      type: String,
      required: true
    }
  }
)

module.exports = mongoose.model("Appointments", appointmentScheme);