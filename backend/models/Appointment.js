const idUtil = require('../utils/idUtil.js');

class Appointment {
  constructor(date = '', location = '') {
    this.id = idUtil.generateUniqueId("app");
    this.date = date;
    this.location = location;
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
      location: this.location
    }

  }
}

module.exports = Appointment;