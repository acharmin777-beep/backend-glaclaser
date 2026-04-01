const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

// 🔐 NUEVO (login)
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./database.sqlite");

// 🔐 NUEVO
const JWT_SECRET = "glaclaser123";

// ===== TABLA =====
db.run(`
CREATE TABLE IF NOT EXISTS cotizaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente TEXT,
  tipo TEXT,
  materiales TEXT,
  ancho REAL,
  alto REAL,
  cantidad INTEGER,
  descuento REAL,
  precio REAL,
  fecha TEXT
)
`);

// 🔐 NUEVA TABLA USUARIOS (NO interfiere con lo tuyo)
db.run(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)
`);

// ===== MIGRACIÓN SEGURA =====
db.run(`ALTER TABLE cotizaciones ADD COLUMN cliente TEXT`, () => {});
db.run(`ALTER TABLE cotizaciones ADD COLUMN cantidad INTEGER DEFAULT 1`, () => {});
db.run(`ALTER TABLE cotizaciones ADD COLUMN descuento REAL DEFAULT 0`, () => {});

// ================= LOGIN =================

// 🔐 REGISTRO
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO usuarios (username, password) VALUES (?, ?)",
    [username, hash],
    function (err) {
      if (err) return res.status(400).json({ message: "Usuario ya existe" });
      res.json({ message: "Usuario creado" });
    }
  );
});

// 🔐 LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM usuarios WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) return res.status(500).json(err);
      if (!user) return res.status(400).json({ message: "Usuario no existe" });

      const valido = await bcrypt.compare(password, user.password);
      if (!valido) {
        return res.status(400).json({ message: "Contraseña incorrecta" });
      }

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "2h" });

      res.json({ token });
    }
  );
});

// ===== ENDPOINTS =====

app.get("/materiales", (req, res) => {
  db.all("SELECT * FROM materiales", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.get("/tipos", (req, res) => {
  db.all("SELECT * FROM tipos", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.get("/costos", (req, res) => {
  db.all("SELECT * FROM costos", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// ===== GUARDAR =====
app.post("/cotizar", (req, res) => {
  const { cliente, tipo, materiales, ancho, alto, cantidad, descuento, precio } = req.body;

  if (!tipo || !precio) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  db.run(
    `INSERT INTO cotizaciones 
    (cliente, tipo, materiales, ancho, alto, cantidad, descuento, precio, fecha)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      cliente || "",
      tipo,
      JSON.stringify(materiales),
      Number(ancho),
      Number(alto),
      Number(cantidad || 1),
      Number(descuento || 0),
      Number(precio)
    ],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

// ===== EDITAR =====
app.put("/cotizaciones/:id", (req, res) => {
  const { cliente, tipo, materiales, ancho, alto, cantidad, descuento, precio } = req.body;

  db.run(
    `UPDATE cotizaciones 
     SET cliente=?, tipo=?, materiales=?, ancho=?, alto=?, cantidad=?, descuento=?, precio=? 
     WHERE id=?`,
    [
      cliente,
      tipo,
      JSON.stringify(materiales),
      Number(ancho),
      Number(alto),
      Number(cantidad || 1),
      Number(descuento || 0),
      Number(precio),
      req.params.id
    ],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

// ===== LISTAR =====
app.get("/cotizaciones", (req, res) => {
  db.all("SELECT * FROM cotizaciones ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// ===== ELIMINAR =====
app.delete("/cotizaciones/:id", (req, res) => {
  db.run("DELETE FROM cotizaciones WHERE id=?", req.params.id, function (err) {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Servidor activo en puerto " + PORT);
});
