const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
    {
        company: String,
        name: String,
        email: String,
        password: String,
        permissions: String,
        phone: String,
        country: String,
        status: String,
    },
    { timestamps: true }
    );
module.exports = mongoose.models.employees || mongoose.model("employees", EmployeeSchema);