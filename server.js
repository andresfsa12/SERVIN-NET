const express = require('express');
const path = require('path');
const session = require('express-session');
const authRoutes = require('./src/routes/auth'); // tu router con POST /login

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'tu_secreto', resave: false, saveUninitialized: true }));

// servir /public (incluye public/views/...)
app.use(express.static(path.join(__dirname, 'public')));

// rutas de autenticación
app.use('/', authRoutes);

// fallback para SPA (si quieres que index.html siempre se entregue)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));