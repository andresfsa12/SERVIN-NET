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

module.exports = router;