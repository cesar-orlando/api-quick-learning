const mongoose = require("mongoose");

const CustomerQLSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nombre del cliente
  phone: { type: String, required: true }, // Teléfono del cliente
  comments: { type: String }, // Espacio para comentarios
  classification: {
    type: String,
    enum: ["Prospecto", "No interesado por precio", "Número equivocado", "Alumno", "Ofrece servicios", "No contesta", "Urgente"], // Clasificación del cliente según la interacción inicial
  },
  status: {
    type: String,
    enum: ["Interesado", "En conversación", "No contesta", "Renovación", "Otros", "Queja", "Sin interacción"], // Estado del cliente en el proceso
  }, // Estado del cliente en el proceso
  visitDetails: {
    // Detalles de la visita (si aplica)
    branch: { type: String }, // Sucursal
    date: { type: Date }, // Fecha de la visita
    time: { type: String }, // Hora de la visita
  },
  enrollmentDetails: {
    // Detalles de inscripción (si aplica)
    consecutive: { type: Number }, // Número consecutivo
    course: { type: String }, // Nombre del curso
    modality: { type: String }, // Modalidad del curso (por ejemplo, en línea, presencial)
    state: { type: String }, // Estado o región
    email: { type: String }, // Correo electrónico del cliente
    source: { type: String }, // Medio o fuente de marketing
    paymentType: { type: String }, // Tipo de pago (por ejemplo, efectivo, tarjeta)
  },
  creationDate: { type: Date, default: Date.now }, // Fecha de creación del registro
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }, // Agente asignado al cliente
  ia: { type: Boolean, default: true }, //Este es para si un cliente no quiere que le conteste la IA y hacerlo manual.
});
module.exports = mongoose.models.customer || mongoose.model("customer", CustomerQLSchema);
