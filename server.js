const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { default: mongoose } = require('mongoose');
const path = require("path");
const http = require("http"); // <-- 🔥 Nuevo
const { Server } = require("socket.io"); // <-- 🔥 Nuevo

const server = http.createServer(app); // <-- 🔥 Reemplaza app.listen

const io = new Server(server, {
  cors: {
    origin: "*", // o pon tu frontend si quieres limitarlo
  },
});

app.set("io", io); // 🔥 Para usar io en cualquier ruta con req.app.get("io")

/* Socket IO */
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado por socket:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado:", socket.id);
  });
});

/* Middleware */
app.use(cors());
app.use(express.urlencoded({ limit: "32MB", extended: true }));
app.use(express.json({ limit: "32MB", extended: true }));

/* Tus rutas, sin cambios */
app.use("/api/v1/user", require("./router/v1/user"));
app.use("/api/v1/customer", require("./router/v1/customer"));
app.use("/api/v1/datecourses", require("./router/v1/dateCourses"));
app.use("/api/v1/sedes", require("./router/v1/sedes"));
app.use("/api/v1/promo", require("./router/v1/promo"));

app.use("/api/v1/quicklearning", require("./router/quicklearning/v1/customer"));
app.use("/api/v1/chat", require("./router/quicklearning/v1/chat"));
app.use("/api/v1/quicklearning/calls", require("./router/quicklearning/v1/calls"));

app.use("/api/v1/monex", require("./router/v1/monex/customers"));
app.use("/api/v1/monex/companies", require("./router/v1/monex/companies"));
app.use("/api/v1/monex/employees", require("./router/v1/monex/employees"));

app.use("/api/v1/callsend", require("./router/v1/callSend"));
app.use("/api/v1/listcalls", require("./router/v1/listCalls"));
app.use("/api/v1/calldetails", require("./router/v1/callDetails"));

app.use("/api/v2/realstate", require("./router/v2/twilio/realState"));
app.use("/api/v1/realstate/calls", require("./router/realstate/calls"));
app.use("/api/v2/voice", require("./router/v2/twilio/voice"));
app.use("/api/v2/whastapp", require("./router/v2/twilio/whatsApp"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/api/v2/followupboss", require("./router/v2/followupboss/people"));
app.use("/api/v2/countries", require("./router/companies/country"));

/* MongoDB + Server Start */
const PORT = process.env.PORT || 3125;
server.listen(PORT, () => {
  console.log(`🚀 API corriendo en puerto ${PORT}`);

  mongoose.connect(process.env.MONGO_URI, {
    autoCreate: true,
  })
  .then(() => {
    console.log("✅ Conexión a Mongo exitosa");
  })
  .catch((err) => {
    console.error("❌ Error al conectar Mongo:", err);
  });
});

app.get("/", (req, res) => {
  res.send("Hey this is my API running 🥳");
});

module.exports = app;
