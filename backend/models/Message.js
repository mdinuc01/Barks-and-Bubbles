class Message {
  constructor(client = {}, date = '', increment = '') {
    this.name = this.getName(client.petParentName);
    this.date = date;
    this.petName = client.petName
    this.increment = increment
  }

  createMessage() {
    return `Hi ${this.name}, it's Alex and Larissa from Barks & Bubbles, we are trying a new automated service.\n\nWe’re back for nail trimming on ${this.date}! Please give us a \u{1F44D} if you’d like us to swing by for ${this.petName}’s nail trim, and we’ll get back to you a day prior with a timeframe \u{1F43E}.\n\nAnything other then a "\u{1F44D}" or "\u{1F44E}" please send us a message at (647) 767-6216.`
  }

  createReply() {
    return `Hi ${this.name}! Aiming to be there around ${this.getTimeRange()} tomorrow \u{1F60A}`
  }

  getTimeRange() {
    // Split the input time string into hours, minutes, and period
    const [hours, minutes, period] = this.date.split(/:| /);

    // Convert hours and minutes to integers
    let hour24 = parseInt(hours);
    let minute = parseInt(minutes);

    // Convert to 24-hour format for easier manipulation
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    // Calculate the total minutes increment based on this.increment
    const incrementMinutes = this.increment * 60;

    // Calculate the new time by adding the increment minutes
    let newMinutes = minute + incrementMinutes;
    let newHour24 = hour24 + Math.floor(newMinutes / 60);
    newMinutes = newMinutes % 60;

    // Handle overflow for hours to keep within 24-hour format
    newHour24 = newHour24 % 24;

    // Convert back to 12-hour format
    let newHours = (newHour24 % 12) || 12;
    const newPeriod = newHour24 < 12 ? "AM" : "PM";

    // Format minutes to always show two digits
    const newMinutesFormatted = newMinutes.toString().padStart(2, '0');

    // Construct the output string
    const newTime = `${newHours}:${newMinutesFormatted} ${newPeriod}`;
    return `${this.date} - ${newTime}`;
  }

  getName(name) {
    const nameParts = name.split(" ");

    // Return the first part
    return nameParts[0];
  }

}

module.exports = Message;