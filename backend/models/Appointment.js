const idUtil = require('../utils/idUtil.js');

class Appointment {
  constructor(date = '', location = '') {
    this.id = idUtil.generateUniqueId("a");
    this.date = date;
    this.location = location;
    this.messages = {};
    this.replies = [];
  }

  // Static method to create a client object from JSON
  static fromJSON(json) {
    const { date, location } = json;
    return new Appointment(date, location);
  }

  toData() {
    return {
      id: this.id,
      date: this.date,
      location: this.location,
      messages: this.messages,
      replies: this.replies
    }
  }
}

module.exports = Appointment;