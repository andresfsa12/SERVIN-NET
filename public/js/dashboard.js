// src/js/dashboardController.js

function actualizarIndicadorAvance(formulariosCompletados, totalFormularios) {
    const porcentaje = (formulariosCompletados / totalFormularios) * 100;
    const porcentajeRedondeado = Math.round(porcentaje);
    
    const circulo = document.querySelector('.progreso-circular');
    const texto = document.getElementById('porcentaje-texto');
    const subtitulo = document.querySelector('.indicador-avance small');
    
    // 1. Actualiza la variable CSS para el gradiente cónico
    circulo.style.setProperty('--porcentaje', porcentajeRedondeado);
    
    // 2. Actualiza el texto visible
    texto.textContent = `${porcentajeRedondeado}%`;
    subtitulo.textContent = `${formulariosCompletados} de ${totalFormularios} formularios completados`;
    
    // Opcional: Cambia el color si es 100%
    if (porcentajeRedondeado === 100) {
        circulo.style.setProperty('--progreso-color', '#00B8D4'); /* Azul de cumplimiento */
    }
}

// Ejemplo de uso al cargar el dashboard:
// Supongamos que esta función se llama después de recibir los datos del modelo
actualizarIndicadorAvance(7, 10);