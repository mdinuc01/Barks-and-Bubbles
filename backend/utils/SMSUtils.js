// require('dotenv').config();
// const axios = require('axios');
// const Message = require('../models/Message.js');
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const phone = process.env.TWILIO_PHONE_NUMBER;

// const twilio = require('twilio');
// const client = new twilio.Twilio(accountSid, authToken);

// class SMSUtils {

//   async getReplies(date) {

//     // const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

//     const formattedDate = new Date(date);
//     const dateAfter = formattedDate.toUTCString();
//     const dateBefore = new Date().toUTCString();

//     try {

//       let res;

//       await client.messages
//         .list({
//           dateSentAfter: dateAfter,
//           dateSentBefore: dateBefore,
//         })
//         .then(messages => res = messages);
//       return res;
//     } catch (error) {
//       console.error('Error fetching messages:', error);
//       throw error;
//     }
//   }

//   async sendText(clientData, date, messageString) {

//     if (!clientData || !clientData.contactMethod || !this.isValidPhoneNumber(clientData.contactMethod)) return;

//     let message = new Message(clientData, date, 0, messageString);
//     let number = `+1${clientData.contactMethod}`;

//     try {
//       const messageObj = await client.messages
//         .create({
//           body: message.createMessage(),
//           from: phone,
//           to: number
//         })
//       return messageObj;
//     } catch (error) {
//       console.log({ error })
//     }
//   }

//   async sendReply(clientData, date, increment, messageString) {
//     if (!clientData || !clientData.contactMethod || !this.isValidPhoneNumber(clientData.contactMethod)) return;

//     let message = new Message(clientData, date, increment, messageString);
//     let number = `+1${clientData.contactMethod}`;

//     try {
//       const messageObj = await client.messages
//         .create({
//           body: message.createMessage(),
//           from: phone,
//           to: number
//         })
//       return messageObj;
//     } catch (error) {
//       console.log({ error })
//     }
//   }

//   isValidPhoneNumber(phoneNumber) {
//     const phoneRegex = /^\d{10}$/;

//     return phoneRegex.test(phoneNumber);
//   }
// }
// module.exports = new SMSUtils();
