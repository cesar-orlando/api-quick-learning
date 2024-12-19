const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { default: mongoose } = require('mongoose');
/* Bland IA */
const call = require("./router/v1/callSend");
const listCalls = require("./router/v1/listCalls");
const callDetails = require("./router/v1/callDetails");
/* Twilio */
const voice = require("./router/v2/twilio/voice");
const whatsApp = require("./router/v2/twilio/whatsApp");
/* Follow Up Boos */
const followupboss = require("./router/v2/followupboss/people");
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ limit: "32MB", extended: true }));
app.use(express.json({ limit: "32MB", extended: true }));

/* Routes */
app.use("/api/v1/user", require("./router/v1/user"));
app.use("/api/v1/customer", require("./router/v1/customer"));
app.use("/api/v1/datecourses", require("./router/v1/dateCourses"));
app.use("/api/v1/sedes", require("./router/v1/sedes"));
app.use("/api/v1/promo", require("./router/v1/promo"));

/* Quick Learning */
app.use("/api/v1/quicklearning", require("./router/quicklearning/v1/customer"));

/* Monex */
app.use("/api/v1/monex", require("./router/v1/monex/customers"));
app.use("/api/v1/monex/companies", require("./router/v1/monex/companies"));
app.use("/api/v1/monex/employees", require("./router/v1/monex/employees"));

/* Bland IA */
app.use("/api/v1/callsend", call);
app.use("/api/v1/listcalls", listCalls);
app.use("/api/v1/calldetails", callDetails);

/* Real State */
app.use("/api/v2/realstate", require("./router/v2/twilio/realState"));

//Twilio
app.use("/api/v2/voice", voice);
app.use("/api/v2/whastapp", whatsApp);

//Follow Up Boss
app.use("/api/v2/followupboss", followupboss);

//Countries
app.use("/api/v2/countries", require("./router/companies/country"));


app.listen(PORT, () => {

    console.log(`API listening on PORT ${PORT} `)
    mongoose.connect(process.env.MONGO_URI, {
        autoCreate: true
    }).then(() => {
            console.log('conexión exitosa');
        })
        .catch((error) => {
            console.log(error);
        })
})

app.get('/', (req, res) => {
    res.send('Hey this is my API running 🥳')
})

// Export the Express API
module.exports = app

