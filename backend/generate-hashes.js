const bcrypt = require('bcrypt');

     const passwords = ['admin123', 'doctor123', 'paciente123']; // contraseña en texto plano
     passwords.forEach((password, index) => {
       const hash = bcrypt.hashSync(password, 10);
       console.log(`Usuario ${index + 1}: ${hash}`);
     });