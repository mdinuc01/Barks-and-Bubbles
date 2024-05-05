const express = require('express');
const cors = require('cors');
const { JsonDB, Config } = require('node-json-db');
const Client = require('./models/Client');
const Message = require('./models/Message');
const clientRoute = require('./routes/client.js');
const appRoute = require('./routes/appointment.js');
const messageRoute = require('./routes/message.js');
const corsOptions = require('./config/corsOption.js');
require('dotenv').config();
let app = express();

app.use(cors(corsOptions));
app.use(express.json());

//Routes
app.use("/api/client", clientRoute);
app.use("/api/appointment", appRoute);
app.use("/api/message", messageRoute);

app.listen(8800, async () => {
  console.log("Connected to Backend");

});
