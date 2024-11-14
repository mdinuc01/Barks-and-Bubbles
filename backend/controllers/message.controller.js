const Message = require('../models/Message.js');
const Pet = require('../models/Pet.js');
const Appointment = require('../models/Appointment.js');
const SMSUtils = require('../utils/SMSUtils.js');
const nodemailer = require("nodemailer");
const Builder = require('../models/MessageBuilder.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const osascript = require('osascript');
const sqlite3 = require('sqlite3').verbose();
const bplist = require("bplist-parser");
const iconv = require("iconv-lite");

class MessageController {

  async sendMessage(req, res, next) {
    try {
      const templatePath = path.join(__dirname, '..', 'scripts', 'sendMessageTemplate.scpt');
      let message = "All messages sent successfully!";

      // If AppleScript Template Cannot be retrieved
      if (!fs.existsSync(templatePath)) {
        return res.status(500).json({ message: "AppleScript template file not found." });
      }

      const { date, appId } = req.body;
      const pets = await Pet.find({ created_by: req.userId });
      let app = await Appointment.findOne({ _id: appId }).populate('route', 'serviceAreas');
      let areas = app?.route?.serviceAreas.map(a => a.name) || [];
      const messageObj = await Builder.findOne({ name: "First Message" });
      let generatedMessages = [];
      let clientSentTo = [];
      let sentDate = new Date();


      if (pets.length && app) {
        pets.forEach(pet => {
          if (pet.active && pet.contactMethod && isValidPhoneNumber(pet.contactMethod) && areas.includes(pet.serviceArea)) {
            const messageText = new Message(pet, date, 0, messageObj.message).createMessage();
            if (messageText?.trim()) {
              generatedMessages.push({ message: messageText, phoneNumber: pet.contactMethod });
              clientSentTo.push({ id: pet.id, contactMethod: pet.contactMethod, petName: pet.petName, petParentName: pet.petParentName, serviceArea: pet.serviceArea });
            }
          }
        });

        if (generatedMessages.length === 0) {
          return res.status(400).json({ message: "No valid messages to send." });
        }
      } else {
        return res.status(404).json({ message: "No pets or appointment data found." });
      }

      if (os.platform() !== 'darwin') {
        return res.status(500).json({ message: "Messaging is only supported on macOS." });
      }

      // Create an array of promises for all script executions
      const scriptPromises = generatedMessages.map(async ({ message: messageText, phoneNumber }) => {
        const templateScript = fs.readFileSync(templatePath, 'utf8');
        const scriptContent = templateScript
          .replace("{PHONE_NUMBER}", phoneNumber)
          .replace("{MESSAGE_TEXT}", messageText.replace(/"/g, '\\"')); // Escape double quotes properly

        try {
          // Use osascript.eval to execute the AppleScript directly as a string
          await new Promise((resolve, reject) => {
            osascript.eval(scriptContent, { type: 'AppleScript' }, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        } catch (err) {
          console.log("Error sending message:", err);
          message = "Some messages failed to send.";
        }
      });

      // Wait for all scripts to execute
      await Promise.all(scriptPromises);

      app = await Appointment.findOneAndUpdate(
        { _id: appId },
        {
          $set: {
            'messages.sentTo': clientSentTo,
            'messages.sentDate': sentDate
          }
        },
        { new: true }
      ).populate('route', 'serviceAreas');

      areas = app.route.serviceAreas.map((a) => a.name);

      const location = areas.map(locationVal => {
        const clientsInLocation = pets.filter(client => client.serviceArea === locationVal);
        return { [locationVal]: clientsInLocation };
      });

      let meta = areas;
      const data = { app: app, location, meta };

      return res.status(200).json({ message, data });
    } catch (error) {
      console.error({ error });
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  async sendReplies(req, res, next) {
    try {
      let appId = req.params.id;

      const app = await Appointment.findOne({ _id: appId }).populate('route', 'serviceAreas');
      let areas = app.route.serviceAreas.map((a) => a.name);
      let messageObj = await Builder.findOne({ "name": "Second Message" });

      if (app.scheduler && app.scheduler.length && areas.length) {
        areas.forEach((l) => {
          const scheduler = app.scheduler.find(obj => obj.hasOwnProperty(l));
          if (scheduler[l].replies && scheduler[l].replies.length && scheduler[l].increment) {
            scheduler[l].replies.forEach(async (reply) => {
              if (reply.id && reply.time && reply.time != null && reply.petParentName && reply.from) {
                const pet = await Pet.findOne({ _id: reply.id });
                await SMSUtils.sendReply(pet, reply.time, scheduler[l].increment, messageObj.message);
              }
            })
          }
        })

        return res.status(200).json({ message: `Replies sent` });
      }
    } catch (error) {
    }
  }
  
  async getReplies(req, res, next) {
    try {
        const { sentDate, appId } = req.body;
        const app = await Appointment.findOne({ _id: appId }).populate('route', 'name serviceAreas');
        let messagesData = app.messages.sentTo;
        let areas = app.route.serviceAreas.map((a) => a);

        const contactMethods = messagesData.map((contact) => 
            contact.contactMethod.startsWith('+1') ? contact.contactMethod : `+1${contact.contactMethod}`
        );

        const sentDateTimestamp = (new Date(sentDate).getTime() - 978307200000) * 1000000;
        const dbPath = '/Users/larissadinuccio/Library/Messages/chat.db';
        const plistpath = '/Users/larissadinuccio/Library/Messages/com.apple.messages.geometrycache_v15.plist';

        const queryMessages = async () => {
          let allResults = [];
          let offset = 0;
          const limit = 20; // Number of rows to fetch per batch
      
          while (true) {
              const results = await new Promise((resolve, reject) => {
                  const db = new sqlite3.Database(dbPath, (err) => {
                      if (err) {
                          console.error('Could not connect to the database:', err.message);
                          return reject(err);
                      }
                  });
      
                  const placeholders = contactMethods.map(() => '?').join(', ');
      
                  const sql = `SELECT
                      m.rowid,
                      COALESCE(m.cache_roomnames, h.id) AS ThreadId,
                      m.is_from_me AS IsFromMe,
                      CASE 
                          WHEN m.is_from_me = 1 THEN m.account 
                          ELSE h.id 
                      END AS FromPhoneNumber,
                      CASE 
                          WHEN m.is_from_me = 0 THEN m.account 
                          ELSE COALESCE(h2.id, h.id) 
                      END AS ToPhoneNumber,
                      m.service AS Service,
                      datetime((m.date / 1000000000) + 978307200, 'unixepoch', 'localtime') AS TextDate, 
                      m.attributedBody as MessageText,
                      c.display_name AS RoomName
                  FROM
                      message AS m
                  LEFT JOIN 
                      handle AS h ON m.handle_id = h.rowid
                  LEFT JOIN 
                      chat AS c ON m.cache_roomnames = c.room_name
                  LEFT JOIN 
                      chat_handle_join AS ch ON c.rowid = ch.chat_id
                  LEFT JOIN 
                      handle AS h2 ON ch.handle_id = h2.rowid
                  WHERE
                      (h2.service IS NULL OR m.service = h2.service)
                      AND (FromPhoneNumber IN (${placeholders}) OR ToPhoneNumber IN (${placeholders}))
                      AND m.date > ? 
                  ORDER BY 
                      m.date DESC LIMIT ${limit} OFFSET ${offset};`;
      
                  const queryParams = [...contactMethods, ...contactMethods, sentDateTimestamp];
      
                  db.all(sql, queryParams, (err, rows) => {
                      if (err) {
                          console.error('Error executing query:', err.message);
                          db.close();
                          return reject(err);
                      }
      
                      db.close((closeErr) => {
                          if (closeErr) {
                              console.error('Error closing the database connection:', closeErr.message);
                              return reject(closeErr);
                          }
                      });
      
                      resolve(rows);
                  });
              });
      
              if (results.length === 0) break; // Stop if no more results are returned
      
              allResults = allResults.concat(results);
              offset += limit;
          }
      
          return allResults.map(async row => {
           
              let messageText = await parseAndExtractText(plistpath, Buffer.from(row.MessageText));
              let to = formatPhoneNumber(row.ToPhoneNumber);
              let from = formatPhoneNumber(row.FromPhoneNumber);
              let direction = row.ToPhoneNumber !== 'P:+16477676216' && row.ToPhoneNumber !== "E:larissadinuccio@gmail.com" ? "outbound-api":"inbound";
            
              return {
                  sid: row.ROWID,
                  body: messageText,
                  dateUpdated: formatDate(row.TextDate),
                  to: to,
                  from: from,
                  status: direction == 'inbound' ? 'received' : 'delivered',
                  direction: direction
              };
          });
      };
      
      
      

      let replies = await Promise.all(await queryMessages());

        const numbersSentTo = messagesData.map((message) => message.contactMethod.toString());
  
    replies = replies.filter(async (reply) => {
    
      let to = reply.to.replaceAll("+1", "");
      let from = reply.from.replaceAll("+1", "");

      if (reply.direction.includes("outbound") && numbersSentTo.includes(to)) {
        return reply;
      } else if (reply.direction.includes("inbound") && numbersSentTo.includes(from))
        return reply;

    });



    let newReplies = replies.map((r) => {
      let time;
      let petParentName;
      let currentReply = app.replies.find((reply) => reply.sid === r.sid);
      if (currentReply && currentReply.time) {
        time = currentReply.time;
        petParentName = currentReply.petParentName;
      }
      return { ...r, time, petParentName };
    });

    newReplies = removeCircularReferences(newReplies);

    let schedulerReplies;
    try {
      schedulerReplies = areas.map((l) => {
        const scheduler = app.scheduler.find(obj => { if (obj) return obj.hasOwnProperty(l.name) });

        if (!scheduler) {
          return { [l.name]: { replies: [], length: 0, increment: "0.5" } };
        }

        let replies = newReplies.filter((r) => {
          if (r.from == process.env.PHONE_NUMBER) return false; // Changed from return to return false to avoid including undefined elements
          let from = r.from.substring(2);
          let meta = messagesData.find((m) => m.contactMethod == from);
          return !!(meta && meta.serviceArea == l.name);
        }).map((r) => {
          let from = r.from.substring(2);
          let meta = messagesData.find((m) => m.contactMethod == from);

          if (meta) {
            let { contactMethod, ...metaWithoutContactMethod } = meta;

            let time;
            let defaultTime;

            if (l && l.time) {
              time = l.time;
            }
            let currentReply = scheduler[l.name].replies.find((reply) => reply.sid === r.sid);

            if (currentReply && (currentReply.time || currentReply.time == null) && !currentReply.defaultTime) {
              time = currentReply.time;
            }

            if (currentReply && currentReply.defaultTime != null) {
              defaultTime = currentReply.defaultTime
            } else {
              defaultTime = true;
            }

            return {
              sid: r.sid,
              body: r.body,
              from: r.from,
              to: r.to,
              time,
              status: r.status,
              defaultTime: defaultTime,
              ...metaWithoutContactMethod
            };
          }
          return null; // Explicitly return null for non-matching replies
        }).filter(reply => reply !== null) // Filter out null values

        replies = replies.sort((a, b) => {
          // console.log({ a })
          const propA = a.petName.toLowerCase();
          const propB = b.petName.toLowerCase();
          if (propA < propB) {
            return -1;
          }
          if (propA > propB) {
            return 1;
          }
          return 0;
        })

        let increment = 0.5;
        if (l && l.increment) {
          increment = l.increment
        }

        return { [l.name]: { replies, length: replies.length, increment: increment } };
      });
    } catch (error) {
      console.error("Error processing scheduler replies:", error);
      throw error; // Re-throw the error to be caught by the outer catch block
    }

    let newApp = await Appointment.findOneAndUpdate(
      { _id: appId },
      {
        'replies': newReplies,
        'scheduler': schedulerReplies
      },
      { new: true }
    ).populate('route', 'name serviceAreas');

    const data = { app: newApp._doc };
        return res.status(200).json({ message: 'Fetched Replies', data });

    } catch (error) {
        console.error('An error occurred:', error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}
  
}

// Function to load the plist file and return its contents
function loadPlistFile(plistPath) {
  return new Promise((resolve, reject) => {
    bplist.parseFile(plistPath, (error, obj) => {
      if (error) {
        reject("Failed to parse plist: " + error);
      } else {
        resolve(obj);
      }
    });
  });
}

// Function to decode NSData, convert to UTF-8, and remove NS-specific attributes
async function extractPlainTextFromNSData(nsStringBuffer, plistStructure) {
  // Decode the NSData as UTF-8 string to properly interpret all characters
  const utf8DecodedString = iconv.decode(nsStringBuffer, "utf-8");


  // Assuming plist contains information on how to extract the main text.
  const mainTextKey = "NSStringMainText"; // Adjust based on plist data

  // Extract the main text from the plist or fallback to the decoded string
  const mainText = plistStructure[0][mainTextKey] || utf8DecodedString;

  // General regex patterns for unwanted NS metadata and encoding artifacts
  const nsPatterns = [
    /@\bNS\w+\b/g,                             // NS-prefixed attributes (e.g., `@NSValue`)
    /\bNSKeyedArchiver\b.*?\bNS\b/g,           // NSKeyedArchiver blocks
    /\bNS\.\w+\b/g,                            // Dot notation for NS attributes (e.g., `_NS.rangeval`)
    /\bNS[a-zA-Z]+/g,                          // General NS objects like NSString, NSDictionary
    /[^\x20-\x7E\u00A0-\uFFFF]+/g,             // Non-printable ASCII and non-Unicode symbols
    /[^\p{L}\p{N}\p{P}\p{S}\s]/gu,             // Non-letters, numbers, punctuation, symbols
    /[0-9a-f]{4,}\b/g,                         // Hex-like strings or non-human-readable data
    /\bstreamtyped\b|@|\\u[0-9a-f]{4}/g,       // streamtyped, and UTF-encoded special characters
    /\b\d+[A-Z]+/g,                            // Patterns like `X$versionY` or `_NS`
    /_kIM\w+AttributeName/g,                   // `kIM` metadata attributes
    /\bNS\w+\b[:;=]?\s*[^ -~]+/g,              // Non-printable/NS-prefixed attributes or values
    /bplist00|AbsoluteDate|\bNSObject\b/g,     // `bplist00` structures, dates, and base NS objects
    /�\+/g,                                       // Explicitly match and remove any `�` characters
    /�/g,
    /iIi_\*/g

  ];

  // Apply each pattern to remove unwanted strings
  let cleanText = mainText;
  for (const pattern of nsPatterns) {
    cleanText = cleanText.replace(pattern, "");
  }

  // Final cleanup: Strip non-printable characters while keeping emojis and readable text
  cleanText = cleanText.replace(/[^\p{L}\p{N}\p{P}\p{S}\s]/gu, "");

  return cleanText;
}

// Main function to parse the NSData and plist
async function parseAndExtractText(plistPath, nsStringBuffer) {
  try {
    // Load the plist file
    const plistData = await loadPlistFile(plistPath);

    // Extract and clean the text
    const cleanText = await extractPlainTextFromNSData(nsStringBuffer, plistData);

    return cleanText; // Return the clean text for further use
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}


let formatPhoneNumber = (input) => {
  if (input == null || !input.length) return input;
  // Remove non-digits and check if input has mostly numbers or letters
  const numbersOnly = input.replace(/\D/g, ''); // Remove non-digits
  const lettersOnly = input.replace(/[^a-zA-Z]/g, ''); // Remove non-letters

  // If mostly letters, return the input unchanged (likely email or non-phone info)
  if (lettersOnly.length >= numbersOnly.length) {
    return "+16477676216";
  }

  // Ensure the number has at least 10 digits; take last 10 digits if longer
  const digits = numbersOnly.length >= 10 ? numbersOnly.slice(-10) : numbersOnly;

  // Format as +1 followed by 10-digit number (add padding if fewer than 10 digits)
  return `+1${digits.padStart(10, '0')}`;
}

let formatDate = (input) => {
  // Parse the input date string
  const date = new Date(input);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  // Format each part of the date and time with padding as necessary
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  // Construct the formatted date string
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000+00:00`;
}

let removeCircularReferences = (obj, seen = new WeakSet()) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (seen.has(obj)) {
    return undefined; // Replace circular references with undefined
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => removeCircularReferences(item, seen));
  }

  const newObj = {};
  for (let key in obj) {
    if (key === 'dateSent' || key === 'dateUpdated' || key === 'dateCreated') {
      newObj[key] = obj[key];
    } else {
      newObj[key] = removeCircularReferences(obj[key], seen);
    }
  }
  return newObj;

}

isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\d{10}$/;

  return phoneRegex.test(phoneNumber);
}

verifyAppData = (appData) => {

  const replies = appData.replies;

  const sentTo = appData.messages.sentTo.length;
  const successMsgs = replies.filter((r) => r.status == "delivered").length;
  const undeliveredMsgs = replies.filter((r) => r.status == "undelivered").length;
  const failedMsgs = replies.filter((r) => r.status == "failed").length;

  return sentTo == (successMsgs + undeliveredMsgs + failedMsgs);
}

sendEmailUpdate = (date, appData) => {
  const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const route = appData.route.name;
  const areas = app.route.serviceAreas.map((a) => a.name);

  const serviceAreas = areas.join(", ");
  const replies = appData.replies;
  const sentTo = appData.messages.sentTo.length;
  const successMsgs = replies.filter((r) => r.status == "delivered").length;
  const undeliveredMsgs = replies.filter((r) => r.status == "undelivered").length;
  const failedMsgs = replies.filter((r) => r.status == "failed").length;

  let mailDetails = {
    from: process.env.EMAIL,
    to: process.env.EMAIL_TO,
    subject: `Barks & Bubbles Appointment - ${route} - ${date}`,
    html: `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            background-color: #ffffff !important;

          }
          h1, h3 {
            color: #2c3e50;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th, td {
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2 !important;
          }
          tr:nth-child(odd) {
            background-color: #e0e0e0 !important;
          }
          tr:nth-child(even) {
            background-color: #ffffff !important;
          }
        </style>
        <title>Barks & Bubbles Appointment - ${route} - ${date}</title>
      </head>
      <body>
        <h1>Barks & Bubbles Appointment - ${route} - ${date}</h1>
        <h3>All messages have been sent out for this appointment! Please see the status of the messages below:</h3>
        <table>
         <tr>
            <th>Route for this appointment</th>
            <td>${route}</td>
          </tr>
          <tr>
            <th>Service Areas in this appointment</th>
            <td>${serviceAreas}</td>
          </tr>
          <tr>
            <th>Clients in this appointment</th>
            <td>${sentTo}</td>
          </tr>
          <tr>
            <th>Messages Sent Successfully</th>
            <td>${successMsgs}</td>
          </tr>
          <tr>
            <th>Undelivered Messages</th>
            <td>${undeliveredMsgs}</td>
          </tr>
          <tr>
            <th>Failed Messages</th>
            <td>${failedMsgs}</td>
          </tr>
        </table>
      </body>
    </html>`
  };

  mailTransport.sendMail(mailDetails, async (err, data) => {
    if (err) {
      console.log({ err });
      throw err;
    }
  })
}


module.exports = new MessageController();