const connection = require("../config/connection");

const insertUser = "INSERT INTO rol (nombre_rol) VALUES ('Administrador')";    

const printError = (msg) => (error) => {
    error && console.log(msg, error);
}

connection.connect((error) => {
    error && console.log('Error de conexión a la base de datos:', error);

    connection.query(insertUser, printError('Error al insertar el usuario administrador:'));
    console.log('Rol insertado correctamente.');        
    connection.end();
});