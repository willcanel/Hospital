document.addEventListener('DOMContentLoaded', () => {
  let token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  let idPaciente = 1;

  const mensajeInicio = document.getElementById('mensajeInicio');
  const formularioHistorialDiv = document.getElementById('formularioHistorial');
  const subirAdjuntoDiv = document.getElementById('subirAdjunto');

  if (!token) {
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

      console.log('Enviando datos:', { idPaciente, alergias, enfermedades });

      try {
        const respuesta = await fetch('http://localhost:3000/api/historial-personal', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({ idPaciente, alergias, enfermedades })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
          console.log('Respuesta del servidor:', datos);
          throw new Error(datos.error || `Error HTTP ${respuesta.status}`);
        }
        alert('Historial guardado con ID: ' + datos.id);
      } catch (err) {
        alert('Error: ' + err.message);
        console.error('Error detallado:', err);
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
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          },
          body: datosFormulario
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
          console.log('Respuesta del servidor:', datos);
          throw new Error(datos.error || `Error HTTP ${respuesta.status}`);
        }
        alert('Archivo subido: ' + datos.exito);
      } catch (err) {
        alert('Error: ' + err.message);
        console.error('Error detallado:', err);
      }
    });
  }
});