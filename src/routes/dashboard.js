const express = require('express');
const router = express.Router();
const connection = require('../config/connection');

// Middleware de autenticación
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    next();
};

// Mapeo de variables a tablas
const VARIABLES_TABLAS = {
    usuarios: 'suscriptores',
    continuidad: 'continuidad',
    pqr: 'pqr',
    micromedicion: 'micromedicion',
    caudal: 'caudal',
    vertimiento: 'vertimiento',
    lodos: 'lodos',
    redacueducto: 'redacueducto',
    redalcantarillado: 'redalcantarillado',
    energia: 'energia',
    personal: 'personal',
    financiero: 'financiero',
    eventos_climaticos: 'eventos_climaticos',
    poir: 'poir',
    tarifa_acu: 'tarifa_acu',
    tarifa_alc: 'tarifa_alc',
    irca: 'irca',
    metas_calidad: 'metas_calidad',
    cuestionario: 'cuestionario'
};

// GET /api/dashboard/avance?vigencia=2024
router.get('/api/dashboard/avance', requireAuth, async (req, res) => {
    try {
        const { vigencia } = req.query;
        const userId = req.session.userId;

        if (!vigencia) {
            return res.status(400).json({ success: false, message: 'Vigencia requerida' });
        }

        const resultados = [];

        for (const [variable, tabla] of Object.entries(VARIABLES_TABLAS)) {
            const query = `SELECT COUNT(*) as total FROM ${tabla} 
                          WHERE id_usuarioFK = ? AND id_vigenciaFK = ?`;
            const [rows] = await connection.execute(query, [userId, vigencia]);
            const total = rows[0].total;
            
            resultados.push({
                variable,
                estado: total > 0 ? 'reportado' : 'no reportado',
                registros: total
            });
        }

        const reportadas = resultados.filter(r => r.estado === 'reportado').length;
        const porcentaje = Math.round((reportadas / resultados.length) * 100);

        res.json({
            success: true,
            vigencia,
            avance: porcentaje,
            total_variables: resultados.length,
            variables_reportadas: reportadas,
            detalle: resultados
        });
    } catch (error) {
        console.error('[Dashboard] Error:', error);
        res.status(500).json({ success: false, message: 'Error al consultar avance' });
    }
});

module.exports = router;