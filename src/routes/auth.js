const express = require('express');
const router = express.Router();
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
        res.json(result);
    } else {
        res.status(401).json(result);
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

module.exports = router;