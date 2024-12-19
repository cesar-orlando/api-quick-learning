const mongoose = require('mongoose');

const CustomerQLSchema = new mongoose.Schema({
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
    city:{
        type: String,
    },
    social:{
        type: String,
    },
    agent:{
        type: Object,
    },
    status:{
        type: Number,
        default: 3
    },
    ia:{ //Este es para si un cliente no quiere que le conteste la IA y hacerlo manual.
        type: Boolean,
        default: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.models.customer || mongoose.model("customer", CustomerQLSchema);
