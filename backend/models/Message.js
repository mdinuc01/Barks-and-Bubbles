class Message {
  constructor(client = {}, date = '') {
    this.name = client.petParentName;
    this.date = date;
    this.petName = client.petName
  }

  createMessage() {
    return `Hi ${this.name}! We’re back for nail trimming ${this.date}! Please give us a \u{1F44D} if you’d like us to swing by for ${this.petName}’s nail trim, and we’ll get back to you a day prior with a timeframe \u{1F43E}`
  }
}

module.exports = Message;