const express = require('express');
  const path = require('path');
  const helmet = require('helmet');
  const dotenv = require('dotenv');
  const rutasApi = require('./rutas/api');
  const { autenticar } = require('./middleware/auth');

  dotenv.config({ path: __dirname + '/.env' });
  console.log('Variables de entorno:', process.env);

  const aplicacion = express();

  // Configurar CSP para pruebas
  aplicacion.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"]
      }
    }
  }));

  // Middleware para parsear
  aplicacion.use(express.json());

  // archivos  fronted
  aplicacion.use(express.static(path.join(__dirname, '../frontend')));

  // Rutas de API
  aplicacion.use('/api', rutasApi);

  // Ruta raíz 
  aplicacion.get('/', autenticar, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  // Ruta para mostrar el inicio si falla algo
  aplicacion.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  const PUERTO = process.env.PUERTO || 3000;
  const servidor = aplicacion.listen(PUERTO, () => {
    console.log(`Servidor corriendo en el puerto ${PUERTO}`);
    console.log(`Frontend disponible en: http://localhost:${PUERTO}`);
    console.log(`API disponible en: http://localhost:${PUERTO}/api`);
  });

  // Manejo de errores no capturados
  process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
    servidor.close(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Rechazo no manejado:', reason);
  });