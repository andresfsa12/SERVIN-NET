const express = require('express');
const session = require('express-session');
const path = require('path');
const authRoutes = require('./src/routes/auth'); // tu router con POST /login

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'tu_secreto_aqui',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// servir /public (incluye public/views/...)
app.use(express.static(path.join(__dirname, 'public')));

// rutas de autenticación
app.use('/', authRoutes);

// fallback para SPA (si quieres que index.html siempre se entregue)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));