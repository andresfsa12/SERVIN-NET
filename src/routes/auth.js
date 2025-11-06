const express = require('express');
const router = express.Router();
const path = require('path');
const connection = require('../config/connection');
const { validateUser } = require('../controllers/authController');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Usuario y contraseña son requeridos' 
        });
    }

    try {
        const result = await validateUser(username, password);
        
        if (result.success) {
            // Guardar datos en la sesión
            req.session.userId = result.userId;
            req.session.userName = result.userName;
            req.session.userRole = result.userRole;

            // Forzar guardado de sesión antes de responder
            req.session.save((err) => {
                if (err) {
                    console.error('Error guardando sesión:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al guardar la sesión'
                    });
                }

                console.log('Sesión guardada exitosamente:', {
                    userId: req.session.userId,
                    userName: req.session.userName,
                    userRole: req.session.userRole
                });

                res.json(result);
            });
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
});

//Router para obtener datos de sesión del usuario

router.get('/api/user-session', (req, res) => {
    console.log('Verificando sesión:', {
        session: req.session,
        cookie: req.headers.cookie
    });

    // 🚩 Sanity check y Log de la respuesta 🚩
    if (req.session && req.session.userId) {
        console.log('✅ SESIÓN ACTIVA, respondiendo 200 OK.'); // Log de éxito
        res.status(200).json({ // Usa res.status(200) explícitamente
            success: true,
            userId: req.session.userId,
            userName: req.session.userName,
            userRole: req.session.userRole
        });
    } else {
        console.log('❌ SESIÓN INACTIVA, respondiendo 401 Unauthorized.'); // Log de fallo
        res.status(401).json({
            success: false,
            message: 'No hay sesión activa'
        });
    }
});

// Ruta para obtener usuarios
router.get('/api/usuarios', async (req, res) => {
    try {
        console.log('/api/usuarios - headers.cookie:', req.headers.cookie);
        console.log('/api/usuarios - req.session:', {
            userId: req.session?.userId,
            userRole: req.session?.userRole
        });

        if (!req.session || !req.session.userId) {
            return res.status(401).json({ success: false, message: 'No hay sesión activa' });
        }

        const [usuarios] = await connection.execute(`
            SELECT id_usuario, nombre, estado, rol_fk, segmento_fk, cod_sui, cod_dane, email, username
            FROM usuarios
            ORDER BY id_usuario ASC
        `);

        console.log('Usuarios encontrados:', usuarios.length);
        return res.json({ success: true, usuarios });
    } catch (err) {
        console.error('Error en /api/usuarios:', err);
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
            return res.status(503).json({ success: false, message: 'No se puede conectar a la base de datos' });
        }
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            return res.status(403).json({ success: false, message: 'Credenciales BD inválidas' });
        }
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
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