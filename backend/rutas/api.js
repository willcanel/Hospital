const express = require('express');
const router = express.Router();
const multer = require('multer');
const { autenticar, autorizar } = require('../middleware/auth');
const grupoConexiones = require('../configuracion/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const almacenamiento = multer.diskStorage({
  destination: (req, archivo, cb) => cb(null, './subidas/'),
  filename: (req, archivo, cb) => cb(null, `${Date.now()}-${archivo.originalname}`)
});
const subir = multer({ storage: almacenamiento });

const manejarSubida = (req, res, next) => {
  subir.single('archivo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

// Endpoint para inicio de sesión
router.post('/inicio-sesion', async (req, res) => {
  const { username, password } = req.body;
  console.log('Solicitud de login:', { username, password });
  if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });

  try {
    const db = grupoConexiones();
    const [rows] = await db.execute('SELECT id, role, idPaciente, password_hash FROM users WHERE username = ?', [username]);
    console.log('Resultado de consulta:', rows);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id, role: user.role, idPaciente: user.idPaciente }, process.env.CLAVE_SECRETA, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Error en /inicio-sesion:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para guardar historial
router.post('/historial-personal', autenticar, async (req, res) => {
  const { idPaciente, alergias, enfermedades, cirugias, vacunas, medicamentos, habitosSalud } = req.body;
  console.log('Datos recibidos:', req.body);
  if (!idPaciente || !alergias || !enfermedades) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (req.user.role === 2 && req.user.idPaciente !== idPaciente) {
    return res.status(403).json({ error: 'Acceso denegado: Solo puedes modificar tu propio historial' });
  }

  try {
    const db = grupoConexiones();
    const [resultado] = await db.execute(
      'INSERT INTO personal_history (patient_id, allergies, diseases, surgeries, vaccines, medications, health_habits, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [idPaciente, alergias, enfermedades, cirugias || null, vacunas || null, medicamentos || null, habitosSalud || null, req.user.id]
    );
    await db.execute(
      'INSERT INTO access_logs (user_id, action) VALUES (?, ?)',
      [req.user.id, `Actualizó historial para paciente ${idPaciente}`]
    );
    res.json({ id: resultado.insertId });
  } catch (err) {
    console.error('Error en la base de datos:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para subir adjuntos
router.post('/adjuntos', autenticar, autorizar([0, 1]), manejarSubida, async (req, res) => {
  const { idPaciente, descripcion } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No se seleccionó ningún archivo' });
  const rutaArchivo = `/subidas/${req.file.filename}`;
  try {
    const db = grupoConexiones();
    await db.execute(
      'INSERT INTO attachments (patient_id, file_name, file_type, file_path, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [idPaciente, req.file.originalname, req.file.mimetype, rutaArchivo, descripcion, req.user.id]
    );
    res.json({ exito: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener historial
router.get('/historial-personal/:idPaciente', autenticar, async (req, res) => {
  res.set('Cache-Control', 'no-store'); // Deshabilitar caché
  const { idPaciente } = req.params;
  console.log('Solicitud recibida para idPaciente:', idPaciente);
  if (!idPaciente || isNaN(idPaciente)) {
    return res.status(400).json({ error: 'ID de paciente inválido' });
  }
  if (req.user.role === 2 && req.user.idPaciente != idPaciente) {
    return res.status(403).json({ error: 'Acceso denegado: Solo puedes ver tu propio historial' });
  }
  try {
    const db = grupoConexiones();
    const [rows] = await db.execute(`
      SELECT ph.*, u.username AS updated_by_name 
      FROM personal_history ph 
      LEFT JOIN users u ON ph.updated_by = u.id 
      WHERE ph.patient_id = ?`,
      [idPaciente]
    );
    console.log('Registros encontrados:', rows);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró historial para este paciente' });
    }
    res.json(rows);
  } catch (err) {
    console.error('Error en /historial-personal:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/patients', autenticar, autorizar([0, 1]), async (req, res) => {
    const { fullName } = req.body;
    if (!fullName) {
        return res.status(400).json({ error: 'Falta el nombre completo' });
    }
    try {
        const db = grupoConexiones();
        const [resultado] = await db.execute(
            'INSERT INTO patients (full_name) VALUES (?)',
            [fullName]
        );
        res.json({ id: resultado.insertId });
    } catch (err) {
        console.error('Error en /patients:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;