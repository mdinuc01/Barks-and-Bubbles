const express = require('express');
const cors = require('cors');
const petRoute = require('./routes/pet.js');
const appRoute = require('./routes/appointment.js');
const messageRoute = require('./routes/message.js');
const authRoute = require('./routes/auth.js');
const corsOptions = require('./config/corsOption.js');
require('dotenv').config();
const mongoose = require('mongoose');
let app = express();
const PORT = process.env.PORT || 8800;

app.use(cors(corsOptions));
app.use(express.json());

//Routes
app.use("/api/pet", petRoute);
app.use("/api/appointment", appRoute);
app.use("/api/message", messageRoute);
app.use("/api/auth", authRoute);


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

