// Captura de los elementos interactivos del DOM necesarios
const botonTema = document.getElementById('contenedor-modo-oscuro');
const iconoTema = document.getElementById('icono-modo-oscuro');
const textoTema = document.getElementById('subtitulo-modo-oscuro');

// Escuchador de eventos: Se ejecuta cada vez que el usuario hace clic en el selector del modo oscuro
botonTema.addEventListener('click', () => {
    
    // 1. Alterna la clase "dark-mode" en la etiqueta principal <body>
    // Si la clase no existe la añade, si ya existe la remueve
    document.body.classList.toggle('dark-mode');
    
    // 2. Verifica si el modo oscuro quedó activo tras el clic para actualizar la interfaz
    if (document.body.classList.contains('dark-mode')) {
        
        // Si está activo el modo oscuro: Cambia a la imagen correspondiente
        iconoTema.src = 'imagenes/modo-oscuro-logo.png';
        
        // Actualiza el subtítulo inferior para ofrecer control de retorno (UX)
        textoTema.textContent = 'modo claro';
        
    } else {
        
        // Si regresó al modo claro: Restaura la imagen por defecto
        iconoTema.src = 'imagenes/modo-claro-logo.png';
        
        // Restaura el subtítulo original de la interfaz
        textoTema.textContent = 'modo oscuro';
    }
});