const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    username: String,
    password: String,
    plan: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
