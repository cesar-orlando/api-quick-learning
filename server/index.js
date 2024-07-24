const express = require("express");
const app = express();
const cors = require("cors");
/* Bland IA */
const call = require("../router/v1/callSend");
const listCalls = require("../router/v1/listCalls");
const callDetails = require("../router/v1/callDetails");
/* Twilio */
const voice = require("../router/v2/twilio/voice");
const whatsApp = require("../router/v2/twilio/whatsApp");
/* Follow Up Boos */
const followupboss = require("../router/v2/followupboss/people");
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ limit: "32MB", extended: true }));
app.use(express.json({ limit: "32MB", extended: true }));

app.use("/api/v1/callsend", call);
app.use("/api/v1/listcalls", listCalls);
app.use("/api/v1/calldetails", callDetails);

//Twilio
app.use("/api/v2/voice", voice);
app.use("/api/v2/whastapp", whatsApp);

//Follow Up Boss
app.use("/api/v2/followupboss", followupboss);


app.listen(PORT, () => {
    console.log(`API listening on PORT ${PORT} `)
})

app.get('/', (req, res) => {
    res.send('Hey this is my API running 🥳')
})

// Export the Express API
module.exports = app

