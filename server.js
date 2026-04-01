require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const users = [];

// REGISTRO
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const existe = users.find(u => u.username === username);
  if (existe) return res.status(400).json({ message: "Usuario ya existe" });

  const hash = await bcrypt.hash(password, 10);

  users.push({ username, password: hash });

  res.json({ message: "Usuario creado" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ message: "Usuario no existe" });

  const valido = await bcrypt.compare(password, user.password);
  if (!valido) return res.status(400).json({ message: "Contraseña incorrecta" });

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ token });
});

app.get("/", (req, res) => {
  res.send("API funcionando");
});

app.listen(3000, () => {
  console.log("Servidor activo");
});
