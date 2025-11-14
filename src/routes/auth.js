const express = require('express');
const router = express.Router();
const path = require('path');
const connection = require('../config/connection');
const { validateUser } = require('../controllers/authController');
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('POST /login - Intento de login:', { username, password: password ? '***' : 'vacío' });
    
    if (!username || !password) {
        console.log('POST /login - Credenciales incompletas');
        return res.status(400).json({ 
            success: false, 
            message: 'Usuario y contraseña son requeridos' 
        });
    }

    try {
        const result = await validateUser(username, password);
        console.log('POST /login - Resultado validación:', { 
            success: result.success, 
            message: result.message 
        });
        
        if (result.success) {
            // Guardar datos en la sesión
            req.session.userId = result.userId;
            req.session.userName = result.userName;
            req.session.userRole = result.userRole;

            console.log('POST /login - Sesión creada:', {
                userId: req.session.userId,
                userName: req.session.userName,
                userRole: req.session.userRole
            });

            // Forzar guardado de sesión antes de responder
            req.session.save((err) => {
                if (err) {
                    console.error('POST /login - Error guardando sesión:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al guardar la sesión'
                    });
                }

                console.log('POST /login - Sesión guardada exitosamente');
                res.json(result);
            });
        } else {
            console.log('POST /login - Credenciales inválidas');
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('POST /login - Error:', error);
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

// Ruta para obtener un usuario específico
router.get('/api/usuarios/:id', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ success: false, message: 'No hay sesión activa' });
        }

        const { id } = req.params;
        const [usuarios] = await connection.execute(
            'SELECT id_usuario, nombre, estado, rol_fk, segmento_fk, cod_sui, cod_dane, email, username FROM usuarios WHERE id_usuario = ?',
            [id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, usuario: usuarios[0] });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Ruta para actualizar usuario
router.put('/api/usuarios/actualizar', async (req, res) => {
    try {
        if (!req.session || !req.session.userId || req.session.userRole !== 1) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }

        const { id_usuario, nombre, estado, rol_fk, segmento_fk, cod_sui, cod_dane, email, username } = req.body;

        await connection.execute(
            `UPDATE usuarios SET 
                nombre = ?, 
                estado = ?, 
                rol_fk = ?, 
                segmento_fk = ?, 
                cod_sui = ?, 
                cod_dane = ?, 
                email = ?, 
                username = ?
            WHERE id_usuario = ?`,
            [nombre, estado, rol_fk, segmento_fk, cod_sui, cod_dane, email, username, id_usuario]
        );

        res.json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
});

// Ruta para cambiar estado del usuario
router.patch('/api/usuarios/estado', async (req, res) => {
    try {
        if (!req.session || !req.session.userId || req.session.userRole !== 1) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }

        const { id_usuario, estado } = req.body;

        await connection.execute(
            'UPDATE usuarios SET estado = ? WHERE id_usuario = ?',
            [estado, id_usuario]
        );

        res.json({ success: true, message: 'Estado actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar estado' });
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

// Crear usuario (sólo admin)
router.post('/api/usuarios', async (req, res) => {
    try {
        // Requiere sesión y rol admin (1)
        if (!req.session || !req.session.userId || Number(req.session.userRole) !== 1) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }

        const {
            id_usuario,
            nombre,
            estado,
            rol_fk,
            segmento_fk,
            cod_sui,
            cod_dane,
            email,
            username,
            password
        } = req.body;

        if (!nombre || !email || !username || !password || !rol_fk || !estado) {
            return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
        }

        // Validar duplicados (username o email)
        const [dups] = await connection.execute(
            'SELECT id_usuario FROM usuarios WHERE username = ? OR email = ? LIMIT 1',
            [username, email]
        );
        if (dups.length > 0) {
            return res.status(409).json({ success: false, message: 'Usuario o email ya existe' });
        }

        // Hash de contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert
        const [result] = await connection.execute(
            `INSERT INTO usuarios (
                ${id_usuario ? 'id_usuario,' : ''} nombre, estado, rol_fk, segmento_fk, cod_sui, cod_dane, email, username, password
            ) VALUES (
                ${id_usuario ? '?,' : ''} ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`,
            id_usuario
                ? [id_usuario, nombre, estado, rol_fk, segmento_fk, cod_sui, cod_dane, email, username, password_hash]
                : [nombre, estado, rol_fk, segmento_fk, cod_sui, cod_dane, email, username, password_hash]
        );

        return res.json({
            success: true,
            message: 'Usuario creado',
            id: result.insertId || id_usuario
        });
    } catch (err) {
        console.error('POST /api/usuarios - Error:', err);
        // MySQL duplicate
        if (err && err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Usuario o email duplicado' });
        }
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// GET - Consultar suscriptores
router.get('/api/suscriptores', async (req, res) => {
    try {
        console.log('[GET /api/suscriptores] Iniciando consulta');
        
        if (!req.session || !req.session.userId) {
            console.log('[GET /api/suscriptores] Sin sesión');
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }

        const { vigencia, mes, servicio } = req.query;
        const userId = req.session.userId;

        console.log('[GET /api/suscriptores] Parámetros:', { userId, vigencia, mes, servicio });

        let query = 'SELECT id_suscriptores, id_usuarioFK, id_vigenciaFK, mes, servicio, suscriptores FROM suscriptores WHERE id_usuarioFK = ?';
        const params = [userId];

        if (vigencia) { query += ' AND id_vigenciaFK = ?'; params.push(vigencia); }
        if (mes) { query += ' AND mes = ?'; params.push(mes); }
        if (servicio) { query += ' AND servicio = ?'; params.push(servicio); }

        query += ' ORDER BY id_suscriptores DESC';

        console.log('[GET /api/suscriptores] Query:', query);
        console.log('[GET /api/suscriptores] Params:', params);

        const [rows] = await connection.execute(query, params);

        console.log('[GET /api/suscriptores] Registros encontrados:', rows.length);

        res.json({ 
            success: true, 
            suscriptores: rows
        });

    } catch (error) {
        console.error('[GET /api/suscriptores] Error:', error);
        console.error('[GET /api/suscriptores] Stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor: ' + error.message 
        });
    }
});

// POST sin suscriptores_n1
router.post('/api/suscriptores', async (req, res) => {
    try {
        console.log('[POST /api/suscriptores] Iniciando creación');
        console.log('[POST /api/suscriptores] Body:', req.body);
        
        if (!req.session?.userId) return res.status(401).json({ success: false, message: 'No autorizado' });

        const { vigencia, mes, servicio, suscriptores } = req.body;
        const userId = req.session.userId;

        console.log('[POST /api/suscriptores] Datos a insertar:', {
            userId,
            vigencia,
            mes,
            servicio,
            suscriptores,
        });

        // Validar campos requeridos
        if (!vigencia || !mes || !servicio) {
            console.log('[POST /api/suscriptores] Campos faltantes');
            return res.status(400).json({ 
                success: false, 
                message: 'Faltan campos requeridos: vigencia, mes, servicio' 
            });
        }

        // Verificar si ya existe un registro para evitar duplicados
        const [existing] = await connection.execute(
            `SELECT id_suscriptores FROM suscriptores 
             WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND mes = ? AND servicio = ?`,
            [userId, vigencia, mes, servicio]
        );

        if (existing.length > 0) {
            console.log('[POST /api/suscriptores] Registro duplicado encontrado');
            return res.status(409).json({ 
                success: false, 
                message: 'Ya existe un registro para estos parámetros' 
            });
        }

        const [result] = await connection.execute(
            `INSERT INTO suscriptores 
             (id_usuarioFK, id_vigenciaFK, mes, servicio, suscriptores)
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId, 
                vigencia, 
                mes, 
                servicio, 
                suscriptores || 0, 
            ]
        );

        console.log('[POST /api/suscriptores] Registro creado con ID:', result.insertId);

        res.json({ 
            success: true, 
            message: 'Suscriptor creado correctamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('[POST /api/suscriptores] Error:', error);
        console.error('[POST /api/suscriptores] Stack:', error.stack);
        
        // Manejar error de clave duplicada
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                success: false, 
                message: 'Ya existe un registro con estos datos' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Error al crear suscriptor: ' + error.message 
        });
    }
});

// PUT sin suscriptores_n1
router.put('/api/suscriptores/:id', async (req, res) => {
    try {
        console.log('[PUT /api/suscriptores] Iniciando actualización');
        console.log('[PUT /api/suscriptores] ID:', req.params.id);
        console.log('[PUT /api/suscriptores] Body:', req.body);
        
        if (!req.session?.userId) return res.status(401).json({ success: false, message: 'No autorizado' });

        const { id } = req.params;
        const { suscriptores } = req.body;
        const userId = req.session.userId;

        console.log('[PUT /api/suscriptores] Datos a actualizar:', {
            id,
            userId,
            suscriptores,
        });

        // Verificar que el registro pertenece al usuario
        const [existing] = await connection.execute(
            'SELECT id_suscriptores FROM suscriptores WHERE id_suscriptores = ? AND id_usuarioFK = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            console.log('[PUT /api/suscriptores] Registro no encontrado o no pertenece al usuario');
            return res.status(404).json({ 
                success: false, 
                message: 'Registro no encontrado o no tiene permisos' 
            });
        }

        const [result] = await connection.execute(
            `UPDATE suscriptores 
             SET suscriptores = ?
             WHERE id_suscriptores = ? AND id_usuarioFK = ?`,
            [suscriptores || 0, id, userId]
        );

        console.log('[PUT /api/suscriptores] Filas afectadas:', result.affectedRows);

        res.json({ 
            success: true, 
            message: 'Suscriptor actualizado correctamente' 
        });

    } catch (error) {
        console.error('[PUT /api/suscriptores] Error:', error);
        console.error('[PUT /api/suscriptores] Stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar: ' + error.message 
        });
    }
});

module.exports = router;