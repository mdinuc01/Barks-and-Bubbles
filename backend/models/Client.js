const mongoose = require('mongoose');

const clientScheme = mongoose.Schema(
  {
    petParentName: {
      type: String,
      required: true
    },
    contactMethod: {
      type: String,
      required: true
    },
    petName: {
      type: String,
      required: true
    },
    serviceArea: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    created_by:
    {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    },
    pets: {
      type: Array,
      default: [],
      required: true
    },
    type: {
      type: Array,
      default: [],
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }
)

module.exports = mongoose.model("Clients", clientScheme);