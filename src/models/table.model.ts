import mongoose, { Schema, Document } from "mongoose";

export interface ITable extends Document {
  name: string;
  slug: string;
  icon: string;
  isAIEnabled: boolean; // Indica si la tabla tiene soporte para IA
}

const TableSchema: Schema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, required: true },
  isAIEnabled: { type: Boolean, default: false }, // Por defecto, las tablas no tienen IA habilitada
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Table = mongoose.model<ITable>("Table", TableSchema);

export default Table;
