const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Stockage tickets (test)
let tickets = [
  { id: "1", username: "AERIO-001", password: "1234", uptime: "1h", status: "pending" },
  { id: "2", username: "AERIO-002", password: "5678", uptime: "30m", status: "pending" }
];

// API MikroTik
app.get("/api/get-pending-tickets", (req, res) => {
  res.json(tickets.filter(t => t.status === "pending"));
});

app.post("/api/confirm-ticket", (req, res) => {
  const { id } = req.query;
  tickets = tickets.map(t => t.id === id ? { ...t, status: "confirmed" } : t);
  res.json({ success: true });
});

// LOGIN WiFi
app.post("/login", (req, res) => {
  const { username, password, dst } = req.body;
  const user = tickets.find(t => t.username === username && t.password === password);

  if (user) {
    res.send(`
      <h2>Bienvenue ${username} !</h2>
      <p>Connexion réussie.</p>
      <a href="${dst || '/'}">Continuer</a>
    `);
  } else {
    res.send(`
      <h2>Erreur : identifiants incorrects</h2>
      <a href="/">Retour au login</a>
    `);
  }
});

// Page login
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
