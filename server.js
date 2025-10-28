const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./src/routes/auth'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'tu_secreto', 
    resave: false, 
    saveUninitialized: true 
}));

// Rutas de autenticación
app.use('/', authRoutes);

// Ruta raíz - sirve el archivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/views/index.html'));
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
    });
});

// Ruta para el panel de control
app.get('/views/inicio/panel_control.html', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public/views/inicio/panel_de_control.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});