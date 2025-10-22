const jwt = require('jsonwebtoken');
     const grupoConexiones = require('../configuracion/db');

     const autenticar = async (req, res, next) => {
       const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
       if (!token) return res.status(401).json({ error: 'No se proporcionó un token' });

       try {
         const usuario = jwt.verify(token, process.env.CLAVE_SECRETA);
         const db = grupoConexiones();
         const [rows] = await db.execute('SELECT id, role, idPaciente FROM users WHERE id = ?', [usuario.id]);
         if (rows.length === 0) return res.status(403).json({ error: 'Usuario no encontrado' });
         req.user = { id: rows[0].id, rol: rows[0].role, idPaciente: rows[0].idPaciente };
         next();
       } catch (err) {
         res.status(403).json({ error: 'Token inválido' });
       }
     };

     const autorizar = (rolesPermitidos) => {
       return (req, res, next) => {
         if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
           return res.status(403).json({ error: 'Acceso denegado' });
         }
         next();
       };
     };

     module.exports = { autenticar, autorizar };