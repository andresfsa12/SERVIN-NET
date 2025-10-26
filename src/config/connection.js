const dotenv = require('dotenv');
dotenv.config();

const mysql = require('mysql2');
const connection = mysql.createConnection(process.env.DATABASE_URL);

console.log('Conectado con exito a la base de datos MySQL.');
module.exports = connection;