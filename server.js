// server.js (Archivo principal)

const express = require('express');
const { testConnection } = require('./src/config/connection');
// Importa tus routers aquí (rutas de autenticación, datosPGR, etc.)

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware esencial
app.use(express.json()); // Permite a Express leer cuerpos JSON (útil para RF-002)

// Llamar a la función de prueba de conexión
testConnection();

// [Opcional pero recomendado: Sincronizar modelos y base de datos]
// require('./src/models/index').sequelize.sync({ force: false })
//   .then(() => console.log('Modelos sincronizados con la Base de Datos.'))
//   .catch(err => console.error('Error al sincronizar modelos:', err));

// Rutas de la API (Ejemplo)
// app.use('/api/v1/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Servidor SERVIN NET PGR está corriendo. La conexión DB ha sido probada.');
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🌍 Servidor escuchando en el puerto ${PORT}`);
});