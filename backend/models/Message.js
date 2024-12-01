class Message {
  constructor(client, date, increment, message) {
    //client values
    this.petParentName = this.getName(client.petParentName);
    this.petName = client.petName == "" ? "the pack" : client.petName;
    this.contactMethod = client.contactMethod;
    this.animalType = client.animalType;
    this.breed = client.breed;
    this.serviceArea = client.serviceArea;
    this.address = client.address;

    this.date = date;
    this.increment = increment;
    this.message = message;

  }

  createMessage() {
    return this.formatMessage(this.message);
  }

  formatMessage(message) {
    return message.replace(/\$\{([^}]+)\}/g, (match, p1) => {
      try {
        return eval(p1);
      } catch (e) {
        return match;
      }
    });
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

    return nameParts[0];
  }

}

module.exports = Message;