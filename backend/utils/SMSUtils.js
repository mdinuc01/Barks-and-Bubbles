require('dotenv').config();
const axios = require('axios');
const Message = require('../models/Message.js');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phone = process.env.TWILIO_PHONE_NUMBER;

const twilio = require('twilio');
const client = new twilio.Twilio(accountSid, authToken);

class SMSUtils {

  async getReplies(date) {

    // const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const formattedDate = new Date(date);
    const dateAfter = formattedDate.toUTCString();
    const dateBefore = new Date().toUTCString();

    // const auth = {
    //   username: accountSid,
    //   password: authToken
    // };

    try {
      // const response = await axios.get(url, {
      //   params: {
      //     dateSentAfter: dateAfter,
      //     dateSentBefore: dateBefore,

      //   },
      //   auth: auth
      // });

      // return response.data.messages;
      let res;

      await client.messages
        .list({
          dateSentAfter: dateAfter,
          dateSentBefore: dateBefore,
        })
        .then(messages => res = messages);
      console.log({ res })
      return res;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendText(clientDate, date) {
    let message = new Message(clientDate, date);
    let number = `+1${clientDate.contactMethod}`;

    try {
      const messageObj = await client.messages
        .create({
          body: message.createMessage(),
          from: phone,
          to: number
        })
      return messageObj;
    } catch (error) {
      console.log({ error })
    }
  }

  async sendReply(clientDate, date) {
    let message = new Message(clientDate, date);
    let number = `+1${clientDate.contactMethod}`;

    try {
      const messageObj = await client.messages
        .create({
          body: message.createReply(),
          from: phone,
          to: number
        })
      return messageObj;
    } catch (error) {
      console.log({ error })
    }
  }
}
module.exports = new SMSUtils();
