const mysql = require('mysql2/promise');

     let grupoConexiones = null;

     function getConnectionPool() {
       if (!grupoConexiones) {
         console.log('Conectando con:', {
           host: process.env.HOST_BD,
           user: process.env.USUARIO_BD,
           password: process.env.CONTRASENA_BD
         });
         grupoConexiones = mysql.createPool({
           host: process.env.HOST_BD,
           user: process.env.USUARIO_BD,
           password: process.env.CONTRASENA_BD,
           database: process.env.NOMBRE_BD,
           waitForConnections: true,
           connectionLimit: 10,
           queueLimit: 0
         });
       }
       return grupoConexiones;
     }

     module.exports = getConnectionPool; // Exporta la función, no el resultado