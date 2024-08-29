const mongoose = require("mongoose");

const SedesSchema = new mongoose.Schema(
    {
        name: String,
        address: String,
        phone: String,
        status: Number,
    },
    { timestamps: true }
    );

module.exports = mongoose.models.Sedes || mongoose.model("Sedes", SedesSchema);