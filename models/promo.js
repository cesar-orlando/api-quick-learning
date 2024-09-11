const mongoose = require("mongoose");

const PromoSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    image: String,
    status: Number,
  },
  { timestamps: true }
);
module.exports = mongoose.models.promo || mongoose.model("promo", PromoSchema);
