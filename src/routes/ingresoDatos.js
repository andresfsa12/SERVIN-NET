const express = require('express');
const router = express.Router();
const connection = require('../config/connection');

const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    next();
};

const idColumnMap = {
    suscriptores: 'id_suscriptores',
    continuidad: 'id_continuidad',
    pqr: 'id_pqr',
    micromedicion: 'id_mm',  // ← Asegúrate de que esté aquí
    caudal: 'id_caudal',
    vertimiento: 'id_vertimiento',
    lodos: 'id_lodos',
    redacueducto: 'id_redAcueducto',
    redalcantarillado: 'id_red_alcantarillado',
    energia: 'id_energia',
    personal: 'id_personal'
};

// Lista de tablas válidas
const tablasValidas = Object.keys(idColumnMap);

// GET - Consultar datos
router.get('/api/ingreso-datos/:tabla', requireAuth, async (req, res) => {
    try {
        const { tabla } = req.params;
        const { vigencia, servicio, mes } = req.query;
        const userId = req.session.userId;

        console.log(`[GET /api/ingreso-datos/${tabla}]`, { userId, vigencia, servicio, mes });

        // CORRECCIÓN: Validar tabla
        if (!tablasValidas.includes(tabla)) {
            console.error(`[GET] Tabla no válida: ${tabla}. Válidas: ${tablasValidas.join(', ')}`);
            return res.status(400).json({ 
                success: false, 
                message: `Tabla no válida: ${tabla}. Debe ser una de: ${tablasValidas.join(', ')}` 
            });
        }

        let query = `SELECT * FROM ${tabla} WHERE id_usuarioFK = ? AND id_vigenciaFK = ?`;
        const params = [userId, vigencia];

        if (tabla === 'personal') {
            query += ' AND periodo = ?';
            params.push(mes);
        } else {
            query += ' AND mes = ?';
            params.push(mes);
        }

        if (servicio && servicio !== 'undefined' && servicio !== 'null') {
            query += ' AND servicio = ?';
            params.push(servicio);
        }

        query += ' ORDER BY ' + idColumnMap[tabla] + ' DESC';

        console.log(`[GET /api/ingreso-datos/${tabla}] Query:`, query);
        console.log(`[GET /api/ingreso-datos/${tabla}] Params:`, params);

        const [datos] = await connection.execute(query, params);

        console.log(`[GET /api/ingreso-datos/${tabla}] Registros:`, datos.length);

        res.json({ success: true, datos });
    } catch (error) {
        console.error(`[GET /api/ingreso-datos] Error:`, error);
        res.status(500).json({ success: false, message: 'Error al consultar: ' + error.message });
    }
});

// POST - Crear registro
router.post('/api/ingreso-datos/:tabla', requireAuth, async (req, res) => {
    try {
        const { tabla } = req.params;
        const userId = req.session.userId;
        const data = { ...req.body };

        console.log(`[POST /api/ingreso-datos/${tabla}] Body:`, data);

        // CORRECCIÓN: Validar tabla
        if (!tablasValidas.includes(tabla)) {
            console.error(`[POST] Tabla no válida: ${tabla}. Válidas: ${tablasValidas.join(', ')}`);
            return res.status(400).json({ 
                success: false, 
                message: `Tabla no válida: ${tabla}. Debe ser una de: ${tablasValidas.join(', ')}` 
            });
        }

        delete data.id;

        data.id_usuarioFK = userId;
        data.id_vigenciaFK = data.vigencia;

        // Para tabla personal usa "periodo", para otras usa "mes"
        if (tabla === 'personal') {
            data.periodo = data.mes;
            delete data.mes;
        } else {
            data.mes = data.mes;
        }

        delete data.vigencia;

        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');

        const query = `INSERT INTO ${tabla} (${columns.join(', ')}) VALUES (${placeholders})`;

        console.log(`[POST /api/ingreso-datos/${tabla}] Query:`, query);
        console.log(`[POST /api/ingreso-datos/${tabla}] Values:`, values);

        const [result] = await connection.execute(query, values);

        console.log(`[POST /api/ingreso-datos/${tabla}] ID:`, result.insertId);

        res.json({ success: true, id: result.insertId, message: 'Registro creado correctamente' });
    } catch (error) {
        console.error(`[POST /api/ingreso-datos] Error:`, error);
        res.status(500).json({ success: false, message: 'Error al crear: ' + error.message });
    }
});

// PUT - Actualizar registro
router.put('/api/ingreso-datos/:tabla/:id', requireAuth, async (req, res) => {
    try {
        const { tabla, id } = req.params;
        const userId = req.session.userId;
        const data = { ...req.body };

        console.log(`[PUT /api/ingreso-datos/${tabla}/${id}] Body:`, data);

        // CORRECCIÓN: Validar tabla
        if (!tablasValidas.includes(tabla)) {
            console.error(`[PUT] Tabla no válida: ${tabla}. Válidas: ${tablasValidas.join(', ')}`);
            return res.status(400).json({ 
                success: false, 
                message: `Tabla no válida: ${tabla}. Debe ser una de: ${tablasValidas.join(', ')}` 
            });
        }

        // Eliminar campos que no deben actualizarse
        delete data.id;
        delete data.vigencia;
        delete data.mes;
        delete data.servicio;
        delete data.id_usuarioFK;
        delete data.id_vigenciaFK;
        delete data.periodo;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No hay datos para actualizar' 
            });
        }

        const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(data), id, userId];
        const idCol = idColumnMap[tabla];

        const query = `UPDATE ${tabla} SET ${setClause} WHERE ${idCol} = ? AND id_usuarioFK = ?`;

        console.log(`[PUT /api/ingreso-datos/${tabla}] Query:`, query);
        console.log(`[PUT /api/ingreso-datos/${tabla}] Values:`, values);

        const [result] = await connection.execute(query, values);

        console.log(`[PUT /api/ingreso-datos/${tabla}] Affected:`, result.affectedRows);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Registro no encontrado o no autorizado' 
            });
        }

        res.json({ success: true, message: 'Registro actualizado correctamente' });
    } catch (error) {
        console.error(`[PUT /api/ingreso-datos] Error:`, error);
        res.status(500).json({ success: false, message: 'Error al actualizar: ' + error.message });
    }
});

// GET ya soporta pqr si es genérico. Asegurar validación periodo
router.get('/api/ingreso-datos/pqr', requireAuth, async (req, res) => {
  try {
    const { vigencia, servicio, mes } = req.query;
    if (mes === 'year') {
      return res.status(400).json({ success: false, message: 'PQR no admite periodo Anual' });
    }
    const userId = req.session.userId;
    const [rows] = await connection.execute(
      `SELECT * FROM pqr WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND mes = ? AND servicio = ?`,
      [userId, vigencia, mes, servicio]
    );
    res.json({ success: true, datos: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error consulta: ' + e.message });
  }
});

router.post('/api/ingreso-datos/pqr', requireAuth, async (req, res) => {
  try {
    const { vigencia, mes, servicio, pqr_recibidas, pqr_resueltas, pqr_no_resueltas } = req.body;
    if (mes === 'year') return res.status(400).json({ success: false, message: 'Periodo inválido' });
    const userId = req.session.userId;
    const [r] = await connection.execute(
      `INSERT INTO pqr (id_usuarioFK, id_vigenciaFK, mes, servicio, pqr_recibidas, pqr_resueltas, pqr_no_resueltas)
       VALUES (?,?,?,?,?,?,?)`,
      [userId, vigencia, mes, servicio, pqr_recibidas, pqr_resueltas, pqr_no_resueltas]
    );
    res.json({ success: true, id: r.insertId, message: 'Creado' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error crear: ' + e.message });
  }
});

router.put('/api/ingreso-datos/pqr/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { pqr_recibidas, pqr_resueltas, pqr_no_resueltas } = req.body;
    const userId = req.session.userId;
    const [r] = await connection.execute(
      `UPDATE pqr SET pqr_recibidas = ?, pqr_resueltas = ?, pqr_no_resueltas = ?
       WHERE id_pqr = ? AND id_usuarioFK = ?`,
      [pqr_recibidas, pqr_resueltas, pqr_no_resueltas, id, userId]
    );
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Actualizado' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error actualizar: ' + e.message });
  }
});

module.exports = router;