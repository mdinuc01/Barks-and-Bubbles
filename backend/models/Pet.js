const mongoose = require('mongoose');

const petScheme = mongoose.Schema(
  {
    petParentName: {
      type: String,
      required: true
    },
    contactMethod: {
      type: String,
      required: true
    },
    animalType: {
      type: String,
      required: true
    },
    breed: {
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
    }
  }
)

module.exports = mongoose.model("Pets", petScheme);