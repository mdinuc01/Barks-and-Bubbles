const express = require('express');
const cors = require('cors');
const appRoute = require('./routes/appointment.js');
const authRoute = require('./routes/auth.js');
const messageRoute = require('./routes/message.js');
const messageBuilderRoute = require('./routes/messageBuilder.js');
const petRoute = require('./routes/pet.js');
const routeRoute = require('./routes/route.js');
const corsOptions = require('./config/corsOption.js');
require('dotenv').config();
const mongoose = require('mongoose');
let app = express();
const PORT = process.env.PORT || 8800;

app.use(cors(corsOptions));
app.use(express.json());
app.set('trust proxy', 1);


//Routes
app.use("/api/appointment", appRoute);
app.use("/api/auth", authRoute);
app.use("/api/message", messageRoute);
app.use("/api/message/builder", messageBuilderRoute);
app.use("/api/pet", petRoute);
app.use("/api/route", routeRoute);



mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to DB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });

