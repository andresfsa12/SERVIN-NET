const express = require('express');
const router = express.Router();
const connection = require('../config/connection');

const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
    }
    next();
};

// Mapear columna ID
const idColumnMap = {
    suscriptores: 'id_suscriptores',
    continuidad: 'id_continuidad',
    pqr: 'id_pqr',
    micromedicion: 'id_mm',
    caudal: 'id_caudal',
    vertimiento: 'id_vertimiento',
    lodos: 'id_lodos',  // ← Asegúrate de que esté aquí
    redacueducto: 'id_redAcueducto',
    redalcantarillado: 'id_red_alcantarillado',
    energia: 'id_energia',
    personal: 'id_personal',
    financiero: 'id_financiero',
    eventos_climaticos: 'id_eventos_c',
    poir: 'id_poir',
    tarifa_acu: 'id_tarifas_acu',
    tarifa_alc: 'id_tarifas_alc'
};

const tablasValidas = [
    'suscriptores',
    'continuidad',
    'pqr',
    'micromedicion',
    'caudal',
    'vertimiento',
    'lodos',
    'redacueducto',
    'redalcantarillado',
    'energia',
    'personal',
    'financiero',
    'eventos_climaticos',
    'poir',
    'tarifa_acu',
    'tarifa_alc'
];

// 1. Rutas genéricas (aplican a todas las tablas)
// GET - Consultar datos (añadir validación vigencia antes de reglas específicas)
router.get('/api/ingreso-datos/:tabla', requireAuth, async (req, res) => {
    try {
        const { tabla } = req.params;
        const { vigencia, servicio, mes } = req.query;
        const userId = req.session.userId;

        if (!tablasValidas.includes(tabla)) {
            return res.status(400).json({ success: false, message: `Tabla no válida: ${tabla}` });
        }

        // Validar vigencia existe
        const [vigenciaExists] = await connection.execute(
            'SELECT id_vigencia FROM vigencia WHERE id_vigencia = ?',
            [vigencia]
        );
        if (!vigenciaExists.length) {
            return res.status(400).json({
                success: false,
                message: `La vigencia ${vigencia} no existe en la base de datos. Contacte al administrador.`
            });
        }

        // Reglas específicas
        if (tabla === 'pqr' && mes === 'Anual') {
            return res.status(400).json({ success: false, message: 'PQR no admite periodo Anual' });
        }

        if (tabla === 'energia' && mes === 'Anual') {
            return res.status(400).json({ success: false, message: 'Energía no admite periodo Anual' });
        }

        if (tabla === 'personal') {
            if (mes !== 'Anual') {
                return res.status(400).json({ success: false, message: 'Personal solo admite periodo Anual' });
            }
            if (servicio !== 'aa') {
                return res.status(400).json({ success: false, message: 'Personal solo admite servicio "Ambos" (aa)' });
            }
        }

        if (tabla === 'financiero') {
            if (mes !== 'Anual') {
                return res.status(400).json({ success: false, message: 'Financiero solo admite periodo Anual' });
            }
            if (servicio !== 'aa') {
                return res.status(400).json({ success: false, message: 'Financiero solo admite servicio "Ambos" (aa)' });
            }
        }

        if (tabla === 'eventos_climaticos') {
            if (mes !== 'Anual') {
                return res.status(400).json({ success: false, message: 'Eventos Climáticos solo admite periodo Anual' });
            }
            if (servicio !== 'aa') {
                return res.status(400).json({ success: false, message: 'Eventos Climáticos solo admite servicio "Ambos" (aa)' });
            }
        }

        if (tabla === 'redacueducto') {
            if (mes !== 'Anual') {
                return res.status(400).json({ success: false, message: 'Red de Acueducto solo admite periodo Anual' });
            }
            if (servicio !== 'acueducto') {
                return res.status(400).json({ success: false, message: 'Red de Acueducto solo admite servicio acueducto' });
            }
        }

        if (tabla === 'redalcantarillado') {
            if (mes !== 'Anual') {
                return res.status(400).json({ success: false, message: 'Red de Alcantarillado solo admite periodo Anual' });
            }
            if (servicio !== 'alcantarillado') {
                return res.status(400).json({ success: false, message: 'Red de Alcantarillado solo admite servicio alcantarillado' });
            }
        }

        if (tabla === 'energia' && servicio === 'aa') {
            return res.status(400).json({ success: false, message: 'Energía no admite servicio "Ambos". Seleccione acueducto o alcantarillado.' });
        }

        // POIR (anual + aa)
        if (tabla === 'poir') {
            if (mes !== 'Anual') {
                return res.status(400).json({ success: false, message: 'POIR solo admite periodo Anual' });
            }
            if (servicio !== 'aa') {
                return res.status(400).json({ success: false, message: 'POIR solo admite servicio "Ambos" (aa)' });
            }
        }

        // Tarifa Acueducto (usar mes)
        if (tabla === 'tarifa_acu') {
            if (mes !== 'Anual') {
                return res.status(400).json({ success: false, message: 'Tarifa Acueducto solo admite periodo Anual' });
            }
            if (servicio !== 'acueducto') {
                return res.status(400).json({ success: false, message: 'Tarifa Acueducto solo admite servicio acueducto' });
            }
        }

        // Tarifa Alcantarillado (usar mes)
        if (tabla === 'tarifa_alc') {
            if (mes !== 'Anual') {
                return res.status(400).json({ success: false, message: 'Tarifa Alcantarillado solo admite periodo Anual' });
            }
            if (servicio !== 'alcantarillado') {
                return res.status(400).json({ success: false, message: 'Tarifa Alcantarillado solo admite servicio alcantarillado' });
            }
        }

        let query = `SELECT * FROM ${tabla} WHERE id_usuarioFK = ? AND id_vigenciaFK = ?`;
        const params = [userId, vigencia];

        // Campo periodo vs mes
        if (tabla === 'personal' || tabla === 'financiero' || tabla === 'eventos_climaticos' || tabla === 'poir' || tabla === 'tarifa_acu' || tabla === 'tarifa_alc') {
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
        const [datos] = await connection.execute(query, params);
        return res.json({ success: true, datos });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al consultar: ' + error.message });
    }
});

// POST - Crear registro (reemplazar bloque desde const insert = ...)
router.post('/api/ingreso-datos/:tabla', requireAuth, async (req, res) => {
  try {
    const { tabla } = req.params;
    const userId = req.session.userId;
    const data = { ...req.body };

    console.log(`[POST /api/ingreso-datos/${tabla}] Body:`, data);

    if (!tablasValidas.includes(tabla)) {
        return res.status(400).json({ success: false, message: `Tabla no válida: ${tabla}` });
    }

    // Validar vigencia
    const [vigenciaExists] = await connection.execute(
        'SELECT id_vigencia FROM vigencia WHERE id_vigencia = ?',
        [data.vigencia]
    );
    if (!vigenciaExists.length) {
        return res.status(400).json({
            success: false,
            message: `La vigencia ${data.vigencia} no existe en la base de datos. Contacte al administrador.`
        });
    }

    // Validaciones específicas (dejando las que ya tienes)
    if (tabla === 'pqr' && data.mes === 'Anual') {
        return res.status(400).json({ success: false, message: 'PQR no admite periodo Anual' });
    }

    // Personal (único anual)
    if (tabla === 'personal') {
        if (data.mes !== 'Anual') return res.status(400).json({ success: false, message: 'Personal requiere periodo Anual' });
        if (data.servicio !== 'aa') return res.status(400).json({ success: false, message: 'Personal requiere servicio "Ambos" (aa)' });
        const [existPersonal] = await connection.execute(
            `SELECT id_personal FROM personal WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND periodo = 'Anual'`,
            [userId, data.vigencia]
        );
        if (existPersonal.length) {
            return res.status(400).json({ success: false, message: 'Ya existe un registro anual de Personal para esta vigencia. Use la opción Editar.' });
        }
    }

    // Financiero (único anual)
    if (tabla === 'financiero') {
        if (data.mes !== 'Anual') return res.status(400).json({ success: false, message: 'Financiero requiere periodo Anual' });
        if (data.servicio !== 'aa') return res.status(400).json({ success: false, message: 'Financiero requiere servicio "Ambos" (aa)' });
        const [existFin] = await connection.execute(
            `SELECT id_financiero FROM financiero WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND periodo = 'Anual' AND servicio = 'aa'`,
            [userId, data.vigencia]
        );
        if (existFin.length) {
            return res.status(400).json({ success: false, message: 'Ya existe un registro anual de Financiero para esta vigencia. Use la opción Editar.' });
        }
    }

    // Eventos Climáticos (único anual)
    if (tabla === 'eventos_climaticos') {
        if (data.mes !== 'Anual') return res.status(400).json({ success:false, message:'Eventos Climáticos requiere periodo Anual' });
        if (data.servicio !== 'aa') return res.status(400).json({ success:false, message:'Eventos Climáticos requiere servicio "aa"' });
        const [existEv] = await connection.execute(
            `SELECT id_eventos_c FROM eventos_climaticos
             WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND periodo = 'Anual' AND servicio = 'aa'`,
            [userId, data.vigencia]
        );
        if (existEv.length) {
            return res.status(400).json({ success:false, message:'Ya existe registro anual de Eventos Climáticos. Use Editar.' });
        }
    }

    // Energía
    if (tabla === 'energia') {
        if (data.mes === 'Anual') {
            return res.status(400).json({ success: false, message: 'Energía no admite periodo Anual' });
        }
        if (data.servicio !== 'acueducto' && data.servicio !== 'alcantarillado') {
            return res.status(400).json({ success: false, message: 'Energía requiere servicio acueducto o alcantarillado (no ambos)' });
        }
        
        const [existEnergia] = await connection.execute(
            `SELECT id_energia FROM energia 
             WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND mes = ? AND servicio = ?`,
            [userId, data.vigencia, data.mes, data.servicio]
        );
        if (existEnergia.length) {
            return res.status(400).json({ 
                success: false, 
                message: `Ya existe un registro de Energía para ${data.servicio} en esta vigencia y mes. Use la opción Editar.` 
            });
        }
    }

    // Red Acueducto
    if (tabla === 'redacueducto') {
        if (data.mes !== 'Anual') {
            return res.status(400).json({ success: false, message: 'Red de Acueducto requiere periodo Anual' });
        }
        if (data.servicio !== 'acueducto') {
            return res.status(400).json({ success: false, message: 'Red de Acueducto requiere servicio acueducto' });
        }
        
        const [existRA] = await connection.execute(
            `SELECT id_redAcueducto FROM redacueducto 
             WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND mes = 'Anual' AND servicio = 'acueducto'`,
            [userId, data.vigencia]
        );
        if (existRA.length) {
            return res.status(400).json({ success: false, message: 'Ya existe un registro anual de Red de Acueducto para esta vigencia. Use Editar.' });
        }
    }

    // Tarifa Acueducto
    if (tabla === 'tarifa_acu') {
        if (data.mes !== 'Anual') return res.status(400).json({ success:false, message:'Tarifa Acueducto requiere periodo Anual' });
        if (data.servicio !== 'acueducto') return res.status(400).json({ success:false, message:'Tarifa Acueducto requiere servicio acueducto' });
        const [existTarifa] = await connection.execute(
            `SELECT id_tarifas_acu FROM tarifa_acu
             WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND periodo = 'Anual' AND servicio = 'acueducto'`,
            [userId, data.vigencia]
        );
        if (existTarifa.length) return res.status(400).json({ success:false, message:'Ya existe registro anual de Tarifa Acueducto. Use Editar.' });
    }

    // Tarifa Alcantarillado
    if (tabla === 'tarifa_alc') {
        if (data.mes !== 'Anual') return res.status(400).json({ success:false, message:'Tarifa Alcantarillado requiere periodo Anual' });
        if (data.servicio !== 'alcantarillado') return res.status(400).json({ success:false, message:'Tarifa Alcantarillado requiere servicio alcantarillado' });
        const [existAlc] = await connection.execute(
            `SELECT id_tarifas_alc FROM tarifa_alc
             WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND periodo = 'Anual' AND servicio = 'alcantarillado'`,
            [userId, data.vigencia]
        );
        if (existAlc.length) return res.status(400).json({ success:false, message:'Ya existe registro anual de Tarifa Alcantarillado. Use Editar.' });
    }

    let insert = { id_usuarioFK: userId, id_vigenciaFK: data.vigencia };

    if (tabla === 'tarifa_acu') {
        insert.servicio = data.servicio;
        insert.periodo  = data.mes; // <-- antes se usaba data.periodo (undefined)
        insert.tarifa_cf_aprob = data.tarifa_cf_aprob ?? 0;
        insert.tarifa_cf_fact  = data.tarifa_cf_fact  ?? 0;
        insert.tarifa_cc_aprob = data.tarifa_cc_aprob ?? 0;
        insert.tarifa_cc_fact  = data.tarifa_cc_fact  ?? 0;
    } else if (tabla === 'tarifa_alc') {
        insert.servicio = data.servicio;
        insert.periodo  = data.mes; // <-- corregido
        insert.tarifa_cf_aprob = data.tarifa_cf_aprob ?? 0;
        insert.tarifa_cf_fact  = data.tarifa_cf_fact  ?? 0;
        insert.tarifa_cc_aprob = data.tarifa_cc_aprob ?? 0;
        insert.tarifa_cc_fact  = data.tarifa_cc_fact  ?? 0;
    }

    // Tarifa Alcantarillado (unicidad y construcción insert)
    if (tabla === 'tarifa_alc') {
      if (data.periodo !== 'Anual') return res.status(400).json({ success:false, message:'Tarifa Alcantarillado requiere periodo Anual' });
      if (data.servicio !== 'alcantarillado') return res.status(400).json({ success:false, message:'Tarifa Alcantarillado requiere servicio alcantarillado' });
      const [exist] = await connection.execute(
        `SELECT id_tarifas_alc FROM tarifa_alc
         WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND periodo = 'Anual' AND servicio = 'alcantarillado'`,
        [userId, data.vigencia]
      );
      if (exist.length) return res.status(400).json({ success:false, message:'Ya existe registro anual de Tarifa Alcantarillado para esta vigencia. Use Editar.' });

      insert.servicio = data.servicio;
      insert.periodo  = data.periodo;
      insert.tarifa_cf_aprob = data.tarifa_cf_aprob ?? 0;
      insert.tarifa_cf_fact  = data.tarifa_cf_fact  ?? 0;
      insert.tarifa_cc_aprob = data.tarifa_cc_aprob ?? 0;
      insert.tarifa_cc_fact  = data.tarifa_cc_fact  ?? 0;
    }

    // Tarifa Acueducto
    else if (tabla === 'tarifa_acu') {
      if (data.periodo !== 'Anual') return res.status(400).json({ success:false, message:'Tarifa Acueducto requiere periodo Anual' });
      if (data.servicio !== 'acueducto') return res.status(400).json({ success:false, message:'Tarifa Acueducto requiere servicio acueducto' });
      const [existTarifa] = await connection.execute(
        `SELECT id_tarifas_acu FROM tarifa_acu
         WHERE id_usuarioFK = ? AND id_vigenciaFK = ? AND periodo = 'Anual' AND servicio = 'acueducto'`,
        [userId, data.vigencia]
      );
      if (existTarifa.length) return res.status(400).json({ success:false, message:'Ya existe registro anual de Tarifa Acueducto para esta vigencia. Use Editar.' });

      insert.servicio = data.servicio;
      insert.periodo  = data.periodo;
      insert.tarifa_cf_aprob = data.tarifa_cf_aprob ?? 0;
      insert.tarifa_cf_fact  = data.tarifa_cf_fact  ?? 0;
      insert.tarifa_cc_aprob = data.tarifa_cc_aprob ?? 0;
      insert.tarifa_cc_fact  = data.tarifa_cc_fact  ?? 0;
    }

    // Tablas con campo periodo (personal, financiero, eventos_climaticos, poir)
    else if (tabla === 'personal' || tabla === 'financiero' || tabla === 'eventos_climaticos' || tabla === 'poir') {
      insert.servicio = data.servicio;
      insert.periodo  = data.mes;
      // agregar campos específicos si aplica...
    }

    // Energía (usa mes)
    else if (tabla === 'energia') {
      insert.servicio = data.servicio;
      insert.mes = data.mes;
      Object.keys(data).forEach(k => {
        if (!['vigencia','mes','servicio'].includes(k)) insert[k] = data[k];
      });
    }

    // Resto de tablas con mes
    else {
      insert.servicio = data.servicio;
      insert.mes = data.mes;
      Object.keys(data).forEach(k => {
        if (!['vigencia','mes','servicio'].includes(k)) insert[k] = data[k];
      });
    }

    const cols = Object.keys(insert);
    const vals = Object.values(insert);
    const placeholders = cols.map(() => '?').join(', ');
    const query = `INSERT INTO ${tabla} (${cols.join(', ')}) VALUES (${placeholders})`;

    console.log(`[POST /api/ingreso-datos/${tabla}] Query:`, query);
    console.log(`[POST /api/ingreso-datos/${tabla}] Values:`, vals);

    const [r] = await connection.execute(query, vals);
    return res.json({ success: true, id: r.insertId, message: 'Registro creado correctamente' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al crear: ' + err.message });
  }
});

// PUT - Añadir validación vigencia + reglas tarifa_acu antes de borrar campos
router.put('/api/ingreso-datos/:tabla/:id', requireAuth, async (req, res) => {
    try {
        const { tabla, id } = req.params;
        const userId = req.session.userId;
        const data = { ...req.body };

        if (!tablasValidas.includes(tabla)) {
            return res.status(400).json({ success: false, message: `Tabla no válida: ${tabla}` });
        }

        // Validar vigencia si se envía
        if (data.vigencia) {
            const [vigenciaExists] = await connection.execute(
                'SELECT id_vigencia FROM vigencia WHERE id_vigencia = ?',
                [data.vigencia]
            );
            if (!vigenciaExists.length) {
                return res.status(400).json({
                    success: false,
                    message: `La vigencia ${data.vigencia} no existe en la base de datos.`
                });
            }
        }

        if (tabla === 'tarifa_acu' || tabla === 'tarifa_alc') {
            // Evitar cambio de servicio/periodo en update
            delete data.servicio;
            delete data.periodo;
        }

        // Eliminar campos no actualizables
        delete data.id;
        delete data.vigencia;
        delete data.mes;
        delete data.id_usuarioFK;
        delete data.id_vigenciaFK;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ success: false, message: 'No hay datos para actualizar' });
        }

        const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(data), id, userId];
        const idCol = idColumnMap[tabla];
        const query = `UPDATE ${tabla} SET ${setClause} WHERE ${idCol} = ? AND id_usuarioFK = ?`;

        console.log(`[PUT /api/ingreso-datos/${tabla}] Query:`, query);
        console.log(`[PUT /api/ingreso-datos/${tabla}] Values:`, values);

        const [result] = await connection.execute(query, values);
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Registro no encontrado o no autorizado' });
        }
        res.json({ success: true, message: 'Registro actualizado correctamente' });
    } catch (error) {
        console.error(`[PUT /api/ingreso-datos] Error:`, error);
        res.status(500).json({ success: false, message: 'Error al actualizar: ' + error.message });
    }
});

// DELETE - Eliminar registro
router.delete('/api/ingreso-datos/:tabla/:id', requireAuth, async (req, res) => {
    try {
        const { tabla, id } = req.params;
        const userId = req.session.userId;

        console.log(`[DELETE /api/ingreso-datos/${tabla}/${id}] Iniciando eliminación`);

        // Validar tabla
        if (!tablasValidas.includes(tabla)) {
            console.error(`[DELETE] Tabla no válida: ${tabla}`);
            return res.status(400).json({ 
                success: false, 
                message: `Tabla no válida: ${tabla}` 
            });
        }

        // Obtener columna ID correcta
        const idCol = idColumnMap[tabla];
        
        if (!idCol) {
            console.error(`[DELETE] No se encontró columna ID para tabla: ${tabla}`);
            return res.status(400).json({ 
                success: false, 
                message: `Configuración incorrecta para tabla: ${tabla}` 
            });
        }

        // Verificar que el registro existe y pertenece al usuario
        const queryCheck = `SELECT ${idCol} FROM ${tabla} WHERE ${idCol} = ? AND id_usuarioFK = ?`;
        console.log(`[DELETE] Query verificación:`, queryCheck);
        
        const [exists] = await connection.execute(queryCheck, [id, userId]);
        
        if (exists.length === 0) {
            console.log(`[DELETE] Registro no encontrado o no autorizado`);
            return res.status(404).json({ 
                success: false, 
                message: 'Registro no encontrado o no tiene permisos para eliminarlo' 
            });
        }

        // Eliminar registro
        const queryDelete = `DELETE FROM ${tabla} WHERE ${idCol} = ? AND id_usuarioFK = ?`;
        console.log(`[DELETE] Query eliminación:`, queryDelete);
        console.log(`[DELETE] Parámetros:`, [id, userId]);

        const [result] = await connection.execute(queryDelete, [id, userId]);

        console.log(`[DELETE] Filas afectadas:`, result.affectedRows);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No se pudo eliminar el registro' 
            });
        }

        return res.json({ 
            success: true, 
            message: 'Registro eliminado correctamente' 
        });

    } catch (error) {
        console.error(`[DELETE /api/ingreso-datos] Error:`, error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al eliminar: ' + error.message 
        });
    }
});

// 2. Rutas específicas de PQR (al final)
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