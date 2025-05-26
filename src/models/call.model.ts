import mongoose, { Schema, Document } from "mongoose";

export interface ICall extends Document {
  phone: string;
  twilioConversationId: string;
  elevenConversationId: string;
  linkedTable: {
    refModel: string;
    refId: mongoose.Types.ObjectId;
  };
  advisor?: {
    id: mongoose.Types.ObjectId;
    name: string;
  };
  notes?: string;
}

const CallSchema: Schema = new mongoose.Schema({
  phone: { type: String, required: true },
  twilioConversationId: { type: String, required: true },
  elevenConversationId: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  linkedTable: {
    refModel: { type: String, required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "linkedTable.refModel" },
  },
  advisor: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String },
  },
  notes: { type: String },
});

const Call = mongoose.model<ICall>("Call", CallSchema);
export default Call;