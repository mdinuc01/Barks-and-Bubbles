const express = require('express');
const cors = require('cors');
const { JsonDB, Config } = require('node-json-db');
const Client = require('./models/Client');
const Message = require('./models/Message');
const clientRoute = require('./routes/client.js');
const corsOptions = require('./config/corsOption.js')

let app = express();

app.use(cors(corsOptions));
app.use(express.json());

//Routes
app.use("/api/client", clientRoute);

app.listen(8800, async () => {
  console.log("Connected to Backend");

});

let addToDB = async () => {
  let db = new JsonDB(new Config("clients", true, false, '/'));

  try {

    let client = new Client("Test", "6477676278", "Dog", "Lab Mix", "Teo", "Holland Centre");
    // await db.push('/clients[]', client.toData());

    let data = await db.getData("/clients");

    if (data) {
      //TODO - Message Generation Code
      data.forEach(client => {
        const message = new Message(client.petParentName, 'May 12th', client.petName);
        console.log(message.createMessage());
      });
    }
  } catch (error) {
    console.log({ error });
  }
}
