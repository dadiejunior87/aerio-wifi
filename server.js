const express = require("express");
const bodyParser = require("body-parser");
const path = require("path"); // <-- ajouté pour path.join
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

// ================= API MikroTik =================

// Récupérer tickets non confirmés
app.get("/api/get-pending-tickets", (req, res) => {
  const pending = tickets.filter(t => t.status === "pending");
  res.json(pending);
});

// Confirmer ticket après création sur MikroTik
app.post("/api/confirm-ticket", (req, res) => {
  const { id } = req.query;
  tickets = tickets.map(t => t.id === id ? { ...t, status: "confirmed" } : t);
  res.json({ success: true });
});

// ================= LOGIN WiFi =================
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

// ================= PAGE PRINCIPALE (LOGIN) =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html")); // <-- corrigé avec path.join
});

// ================= PORT =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
tickets.push({ id: "3", username: "TEST-001", password: "1111", uptime: "5m", status: "pending" });
app.get("/success", (req, res) => {
    const user = req.query.user;

    res.send(`
        <h1>Bienvenue ${user}</h1>
        <p><strong>Statut :</strong> Connecté</p>
        <p><strong>Accès Internet activé</strong></p>
    `);
});
