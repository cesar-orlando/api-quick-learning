const mongoose = require("mongoose");

const CustomerMonexSchema = new mongoose.Schema(
  {
    company: String,
    contact: String,
    phone: String,
    email: String,
    address: String,
    followup: String,
    employee: String,
    status: String,
  },
  { timestamps: true }
);
module.exports = mongoose.models.customersMonex || mongoose.model("customersMonex", CustomerMonexSchema);
