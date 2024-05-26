// const idUtil = require('../utils/idUtil.js');
const mongoose = require('mongoose');

// class Appointment {
//   constructor(date = '', location = '') {
//     this.id = idUtil.generateUniqueId("a");
//     this.date = date;
//     this.location = location;
//     this.messages = {};
//     this.replies = [];
//   }

//   // Static method to create a client object from JSON
//   static fromJSON(json) {
//     const { date, location } = json;
//     return new Appointment(date, location);
//   }

//   toData() {
//     return {
//       id: this.id,
//       date: this.date,
//       location: this.location,
//       messages: this.messages,
//       replies: this.replies
//     }
//   }
// }

const messageSchema = new mongoose.Schema({
  sentTo: {
    type: [Object], // Assuming sentTo is an array of objects
    required: true
  },
  sentDate: {
    type: Date,
    required: true
  }
});

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
    messages: {
      type: {},
      required: true,
      default: {}
    },
    replies: {
      type: Array,
      required: true,
      default: []
    }
  }
)

module.exports = mongoose.model("Appointments", appointmentScheme);