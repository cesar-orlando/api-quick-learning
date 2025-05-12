import mongoose from "mongoose";

export const customFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // Identificador único del campo
    label: { type: String, required: true }, // Etiqueta visible del campo
    value: { type: mongoose.Schema.Types.Mixed }, // Valor del campo (puede ser cualquier tipo)
    visible: { type: Boolean, default: true }, // Si el campo es visible o no
    type: {
      type: String,
      enum: ["text", "select", "number", "file", "history"], // Tipos de campo soportados
      default: "text",
    },
    options: { type: [String], default: [] }, // Opciones para campos tipo select
    required: { type: Boolean, default: false }, // Si el campo es obligatorio
    format: { type: String, enum: ["default", "currency"], default: "default" }, // Formato del campo
    validations: {
      type: Object, // Validaciones dinámicas (ejemplo: rango para números)
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);
