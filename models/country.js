const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema(
    {
        company: String,
        number: String,
        email: String,
        state: String,
        city: String,
        street: String,
        zipcode: String,
        status: String,
    },
    { timestamps: true }
    );
module.exports = mongoose.models.country || mongoose.model("country", CountrySchema);