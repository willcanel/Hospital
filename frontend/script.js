document.addEventListener('DOMContentLoaded', () => {
    let tokenSesion = localStorage.getItem('tokenSesion');
    if (!tokenSesion) {
      tokenSesion = 'dummy-token';
      localStorage.setItem('tokenSesion', tokenSesion);
    }
    let idPaciente = 1;

    const mensajeInicio = document.getElementById('mensajeInicio');
    const formularioHistorialDiv = document.getElementById('formularioHistorial');
    const subirAdjuntoDiv = document.getElementById('subirAdjunto');

    if (!tokenSesion) {
      mensajeInicio.style.display = 'block';
    } else {
      mensajeInicio.style.display = 'none';
      formularioHistorialDiv.style.display = 'block';
      subirAdjuntoDiv.style.display = 'block';

      const formHistorial = document.getElementById('formHistorial');
      formHistorial.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alergias = document.getElementById('alergias').value;
        const enfermedades = document.getElementById('enfermedades').value;

        console.log('Enviando datos:', { idPaciente, alergias, enfermedades }); // Depuración

        try {
          const respuesta = await fetch('http://localhost:3000/api/historial-personal', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokenSesion}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idPaciente, alergias, enfermedades })
          });
          const datos = await respuesta.json();
          if (!respuesta.ok) throw new Error(datos.error || 'Error desconocido');
          alert('Historial guardado con ID: ' + datos.id);
        } catch (err) {
          alert('Error: ' + err.message);
          console.error('Error detallado:', err); // Depuración
        }
      });

      const formAdjunto = document.getElementById('formAdjunto');
      formAdjunto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const descripcionAdjunto = document.getElementById('descripcionAdjunto').value;
        const entradaArchivo = document.getElementById('archivoAdjunto');
        const archivo = entradaArchivo.files[0];

        const datosFormulario = new FormData();
        datosFormulario.append('archivo', archivo);
        datosFormulario.append('idPaciente', idPaciente);
        datosFormulario.append('descripcion', descripcionAdjunto);

        try {
          const respuesta = await fetch('http://localhost:3000/api/adjuntos', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tokenSesion}`
            },
            body: datosFormulario
          });
          const datos = await respuesta.json();
          alert('Archivo subido: ' + datos.exito);
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
    }
  });