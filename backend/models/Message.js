class Message {
  constructor(client = {}, date = '') {
    this.name = client.petParentName;
    this.date = date;
    this.petName = client.petName
  }

  createMessage() {
    return `Hi ${this.name}! We’re back for nail trimming on ${this.date}! Please give us a \u{1F44D} if you’d like us to swing by for ${this.petName}’s nail trim, and we’ll get back to you a day prior with a timeframe \u{1F43E}`
  }

  createReply() {
    return `Hi ${this.name}! Aiming to be there around ${this.getTimeRange()} tomorrow \u{1F60A}`
  }

  getTimeRange() {
    // Split the input time string into hours and minutes
    const [hours, minutes, period] = this.date.split(/:| /);

    // Convert hours to 24-hour format for easier manipulation
    let hour24 = parseInt(hours);
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    }

    // Increment the hour by 1, considering edge case for 12 PM
    hour24 = (hour24 + 1) % 24;

    // Convert back to 12-hour format
    let newHours = (hour24 % 12) || 12;
    const newPeriod = hour24 < 12 ? "AM" : "PM";

    // Construct the output string
    const newTime = `${newHours}:${minutes} ${newPeriod}`;
    return `${this.date} - ${newTime}`;
  }
}

module.exports = Message;