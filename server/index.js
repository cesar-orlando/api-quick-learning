const express = require("express");
const app = express();
const cors = require("cors");
const call = require("../router/v1/callSend");
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ limit: "32MB", extended: true }));
app.use(express.json({ limit: "32MB", extended: true }));

app.use("/api/v1/callsend", call );

app.listen(PORT, () => {
    console.log(`API listening on PORT ${PORT} `)
  })
  
  app.get('/', (req, res) => {
    res.send('Hey this is my API running 🥳')
  })
  
  
  // Export the Express API
  module.exports = app
  
