const mongoose = require('mongoose');

// Define el esquema para la colección "Employee".
// Este esquema representa la estructura de un empleado en la base de datos.
const employeeSchema = new mongoose.Schema({
  name: String,  // Nombre del empleado
  phone: String, // Teléfono del empleado
  email: String,  // Correo electrónico del empleado
  status: "String" // Status del empleado
});

// Define una propiedad virtual "companies" en el esquema `Employee`
employeeSchema.virtual("companies", {
  ref: "Company", // El modelo a relacionar
  localField: "_id", // Campo de `Employee` que se relaciona con `Company.employee`
  foreignField: "employee", // Campo en `Company` que contiene el ID de `Employee`
});

employeeSchema.set("toObject", { virtuals: true });
employeeSchema.set("toJSON", { virtuals: true });

// Exporta el modelo "Employee" para su uso en otras partes de la aplicación.
module.exports = mongoose.model('Employee', employeeSchema);
