const dotenv = require('dotenv');
dotenv.config();

const mysql = require('mysql2/promise');
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log('Conectado con exito a la base de datos MySQL.');
module.exports = connection;