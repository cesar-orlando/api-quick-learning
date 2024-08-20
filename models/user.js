const mongoose = require("mongoose");
/*Usuarios admin*/
const UserSchema = new mongoose.Schema(
    {
        email: String,
        password: String,
        name: String,
        permissions: Number,
        status: Number
    },
    { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
