// Captura de los elementos interactivos del DOM necesarios
const botonTema = document.getElementById('contenedor-modo-oscuro');
const iconoTema = document.getElementById('icono-modo-oscuro');
const textoTema = document.getElementById('subtitulo-modo-oscuro');

// Función que aplica el tema visual correcto según el estado
function aplicarTema(modo) {
    if (modo === 'dark') {
        document.body.classList.add('dark-mode');
        if(iconoTema) iconoTema.src = 'imagenes/modo-oscuro-logo.png';
        if(textoTema) textoTema.textContent = 'modo claro';
    } else {
        document.body.classList.remove('dark-mode');
        if(iconoTema) iconoTema.src = 'imagenes/modo-claro-logo.png';
        if(textoTema) textoTema.textContent = 'modo oscuro';
    }
}

// Al cargar la página, recupera el tema guardado por el usuario
const temaGuardado = localStorage.getItem('tema-preferido') || 'light';
aplicarTema(temaGuardado);

// Escuchador de eventos para alternar el estado y guardarlo
if (botonTema) {
    botonTema.addEventListener('click', () => {
        const esOscuro = document.body.classList.toggle('dark-mode');
        const nuevoTema = esOscuro ? 'dark' : 'light';
        
        // Guarda el estado elegido para mantenerlo en las otras páginas
        localStorage.setItem('tema-preferido', nuevoTema);
        aplicarTema(nuevoTema);
    });
}