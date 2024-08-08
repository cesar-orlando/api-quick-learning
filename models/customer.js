const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
        required: true
    },
    message: {
        type: String,
    },
    whatsAppProfile:{
        type: String,
        required: true
    },
    whatsAppNumber:{
        type: String,
        required: true
    },
    status:{
        type: Number,
        default: 3
    },
    date: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.models.customer || mongoose.model("customer", CustomerSchema);
