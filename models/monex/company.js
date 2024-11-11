const mongoose = require('mongoose');

// Define el esquema para la colección "Company".
// Este esquema representa la estructura de una empresa en la base de datos.
const companySchema = new mongoose.Schema({
  company: String, // Nombre de la empresa
  contact: String, // Nombre del contacto principal
  phone: String,   // Teléfono de la empresa
  email: String,   // Correo electrónico de la empresa
  address: String, // Dirección de la empresa
  followup: String, // Seguimiento o notas adicionales sobre la empresa
  status: String,   // Estado de la empresa (ej. activo, inactivo)
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' } // Referencia al empleado responsable
});

// Exporta el modelo "Company" para su uso en otras partes de la aplicación.
module.exports = mongoose.model('Company', companySchema);
