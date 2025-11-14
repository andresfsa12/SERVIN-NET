const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración del store MySQL
const options = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'servin_net',
    createDatabaseTable: true,  // crea la tabla si no existe
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

// Crear el store
const sessionStore = new MySQLStore(options);

// Configurar session con el store
app.use(session({
    key: 'servin_net_session',  // nombre de la cookie
    secret: process.env.SESSION_SECRET || 'secret_local',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,      // en dev debe ser false; en producción con HTTPS -> true
        httpOnly: true,
        sameSite: 'lax',    // permite envío de cookie en same-origin
        maxAge: 24*60*60*1000
    }
}));

// Configurar CSP global
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "http://localhost:3000"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
    }
}));

// Luego static y rutas
app.use(express.static(path.join(__dirname, 'public')));
const authRoutes = require('./src/routes/auth');
const ingresoDatosRoutes = require('./src/routes/ingresoDatos');

// Rutas
app.use('/', authRoutes);
app.use('/', ingresoDatosRoutes);

// fallback para SPA (si quieres que index.html siempre se entregue)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
