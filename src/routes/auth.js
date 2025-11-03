const express = require('express');
const router = express.Router();
const path = require('path');
const { validateUser } = require('../controllers/authController');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Usuario y contraseña son requeridos' 
        });
    }

    const result = await validateUser(username, password);
    
    if (result.success) {
        req.session.userId = result.userId;
        req.session.userName = result.userName;
        res.json(result);
    } else {
        res.status(401).json(result);
    }
});
//Router para obtener datos de sesión del usuario
router.get('/api/user-session', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            success: true,
            userId: req.session.userId,
            userName: req.session.userName,
            userRole: req.session.userRole
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'No hay sesión activa' 
        });
    }
});

// Cerrar sesión
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.json({ success: true });
    });
});

// Rutas para las vistas
router.get('/panel_control', (req, res) => {
    // Verificar si hay sesión activa
    if (!req.session || !req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '../../public/views/cliente/panel_control/index.html'));
});

router.get('/informes_sui', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '../../public/views/cliente/informes_sui/index.html'));
});

router.get('/ingreso_datos', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '../../public/views/cliente/ingreso_datos/index.html'));
});

module.exports = router;