const mongoose = require('mongoose');

const routeScheme = mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    serviceAreas: {
      type: Array,
      required: true,
      default: []
    },
    createdBy: {
      type: String,
      required: true
    }
  }
)

module.exports = mongoose.model("Routes", routeScheme);