const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Générer ticket
router.post('/generate', async (req, res) => {
    try {
        const username = "user" + Math.floor(Math.random() * 100000);
        const password = Math.random().toString(36).slice(-6);

        const ticket = await Ticket.create({
            username,
            password,
            plan: "default"
        });

        res.json({ ticket });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lister tickets
router.get('/list', async (req, res) => {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
});

// Stats dashboard
router.get('/stats', async (req, res) => {
    const tickets = await Ticket.find();
    res.json({
        stock: tickets.length,
        solde: tickets.length * 500
    });
});

module.exports = router;
