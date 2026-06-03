// LOGICA DE LA API Y EL ARCHIVO dashboard-gestion-episodio.html y dashboard-gestion-personaje.html

/* ==========================================================================
   CONTROLADOR INTERACTIVO DE DATOS (API, FICHA MODAL AISLADA POR CUENTA)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // === 1. DECLARACIÓN DE VARIABLES Y SELECTORES DEL DOM (IDs SINCRONIZADOS) ===
    let listadoPersonajes = [];      
    let ordenAscendente = true;      
    let personajeSeleccionado = null; 

    // Selectores de la tabla y controles principales
    const tablaCuerpo = document.getElementById('tbody-personajes'); 
    const inputBuscador = document.getElementById('buscador'); 
    const btnOrdenar = document.getElementById('btn-ordenar-tabla');   

    // Selectores de la Ficha / Modal
    const modalFicha = document.getElementById('modal-ficha-personaje'); 
    const imgAvatar = document.getElementById('ficha-img');
    const inputNombre = document.getElementById('ficha-nombre');
    const inputEstado = document.getElementById('ficha-estado');
    const inputTipo = document.getElementById('ficha-tipo');
    const inputGenero = document.getElementById('ficha-genero');
    const inputLocalizacion = document.getElementById('ficha-localizacion');
    const inputOrigen = document.getElementById('ficha-origen');
    
    // Botones y alertas internos del modal
    const btnModificar = document.getElementById('btn-modificar-ficha');
    const btnGuardar = document.getElementById('btn-ficha-guardar');
    const btnCerrarModal = document.getElementById('btn-ficha-salir');
    const txtMensajeFicha = document.getElementById('mensaje-alerta-ficha');

    // === 2. DATOS SIMULADOS DE RESPALDO (REQUISITO OFFLINE MANDATORIO) ===
    const datosSimuladosOffline = [
        { id: 1, name: "Rick Sanchez (Offline)", status: "Alive", species: "Human", type: "", gender: "Male", origin: { name: "Earth" }, location: { name: "Earth" }, image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg" },
        { id: 2, name: "Morty Smith (Offline)", status: "Alive", species: "Human", type: "", gender: "Male", origin: { name: "Earth" }, location: { name: "Earth" }, image: "https://rickandmortyapi.com/api/character/avatar/2.jpeg" },
        { id: 3, name: "Summer Smith (Offline)", status: "Alive", species: "Human", type: "", gender: "Female", origin: { name: "Earth" }, location: { name: "Earth" }, image: "https://rickandmortyapi.com/api/character/avatar/3.jpeg" }
    ];

    // === 3. CONTROLADOR DE IDENTIDAD AISLADA POR CUENTA ===
    
    // Rastrea sessionStorage y localStorage para saber quién inició sesión
    function obtenerUsuarioActivo() {
        const llavesSesion = ['usuarioLogueado', 'usuario', 'user', 'email', 'emailLogueado', 'activeUser'];
        for (let llave of llavesSesion) {
            let userSesion = sessionStorage.getItem(llave);
            if (userSesion) return filtrarFormatoUsuario(userSesion);
        }
        return "Invitado";
    }

    // Extrae el nombre real en caso de encontrar objetos JSON o correos
    function filtrarFormatoUsuario(valor) {
        let textoLimpio = valor.trim();
        if (textoLimpio.startsWith('{')) {
            try {
                const obj = JSON.parse(textoLimpio);
                return (obj.nombre || obj.name || "Usuario").trim();
            } catch (e) {}
        }
        if (textoLimpio.includes('@')) {
            const perfilEnLocal = localStorage.getItem(`user_${textoLimpio}`);
            if (perfilEnLocal) {
                try { return JSON.parse(perfilEnLocal).nombre; } catch(e) {}
            }
        }
        return textoLimpio;
    }

    // Genera una llave única en el LocalStorage para separar los cambios de cada cuenta
    function obtenerClaveAlmacenamiento() {
        const usuario = obtenerUsuarioActivo();
        return `cambios_personajes_${usuario.replace(/\s+/g, '_')}`;
    }

    // === 4. PETICIÓN A LA API REST Y GESTIÓN DE CACHÉ OFFLINE ===
    async function inicializarRepositorioDatos() {
        const URL_API = 'https://rickandmortyapi.com/api/character';
        const CLAVE_CACHE_RESPALDO = 'cache_offline_rick_and_morty';

        try {
            // Intenta descargar los datos reales desde la API REST
            const peticion = await fetch(URL_API);
            if (!peticion.ok) throw new Error("API no disponible");
            const payload = await peticion.json();
            listadoPersonajes = payload.results;

            // Almacena en Caché local para permitir acceso sin conexión a internet
            localStorage.setItem(CLAVE_CACHE_RESPALDO, JSON.stringify(listadoPersonajes));
        } catch (error) {
            console.warn("Modo Offline detectado. Cargando repositorio de caché.");
            const cacheGuardada = localStorage.getItem(CLAVE_CACHE_RESPALDO);
            listadoPersonajes = cacheGuardada ? JSON.parse(cacheGuardada) : datosSimuladosOffline;
        }

        // Recupera y une los cambios guardados exclusivamente por este usuario
        const claveUsuarioActual = obtenerClaveAlmacenamiento();
        const modificacionesCuenta = JSON.parse(localStorage.getItem(claveUsuarioActual)) || {};

        listadoPersonajes = listadoPersonajes.map(personaje => {
            if (modificacionesCuenta[personaje.id]) {
                return { ...personaje, ...modificacionesCuenta[personaje.id] };
            }
            return personaje;
        });

        renderizarTabla(listadoPersonajes);
    }

    // === 5. MAQUETACIÓN DINÁMICA DE FILAS (SINCRONIZADO CON TUS HEADERS) ===
    function renderizarTabla(datos) {
        if (!tablaCuerpo) return;
        tablaCuerpo.innerHTML = ''; 

        datos.forEach(personaje => {
            const fila = document.createElement('tr');
            fila.style.cursor = 'pointer'; 

            // Sincronizado exactamente con tus <th>: ID, Nombre, Especie, Género, Tipo
            fila.innerHTML = `
                <td>${personaje.id}</td>
                <td><strong>${personaje.name}</strong></td>
                <td>${personaje.species || 'Human'}</td>
                <td>${personaje.gender}</td>
                <td>${personaje.type || 'None'}</td>
            `;

            // Evento para abrir la ficha completa al hacer clic en la fila
            fila.addEventListener('click', () => abrirModalFicha(personaje));
            tablaCuerpo.appendChild(fila);
        });
    }

    // === 6. LÓGICA DE BARRA DE BÚSQUEDA Y ORDENAMIENTO ===

    // Buscador en tiempo real usando .filter()
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase().trim();
            const filtrados = listadoPersonajes.filter(p => 
                p.name.toLowerCase().includes(termino) || 
                p.id.toString() === termino
            );
            renderizarTabla(filtrados);
        });
    }

    // Ordenador numérico por ID usando .sort()
    if (btnOrdenar) {
        btnOrdenar.addEventListener('click', () => {
            ordenAscendente = !ordenAscendente;
            listadoPersonajes.sort((a, b) => ordenAscendente ? (a.id - b.id) : (b.id - a.id));
            btnOrdenar.textContent = ordenAscendente ? "Ascendente a Descendente" : "Descendente a Ascendente";
            renderizarTabla(listadoPersonajes);
        });
    }

    // === 7. CONTROL DEL MODAL DE LA FICHA COMPLETA ===

    function abrirModalFicha(personaje) {
        personajeSeleccionado = personaje; 
        
        // Inyecta la información en los inputs del HTML
        if (imgAvatar) imgAvatar.src = personaje.image || '';
        if (inputNombre) inputNombre.value = personaje.name;
        if (inputEstado) inputEstado.value = personaje.status;
        if (inputTipo) inputTipo.value = personaje.type || 'None';
        if (inputGenero) inputGenero.value = personaje.gender;
        if (inputLocalizacion) inputLocalizacion.value = personaje.location ? personaje.location.name : '';
        if (inputOrigen) inputOrigen.value = personaje.origin ? personaje.origin.name : '';

        alternarBloqueoCampos(true); // Abre en modo "solo lectura"
        if (txtMensajeFicha) txtMensajeFicha.textContent = '';
        
        // Muestra el modal quitando la clase oculta (o forzando el display flex)
        if (modalFicha) {
            modalFicha.classList.remove('modal-oculto');
            modalFicha.style.display = 'flex'; 
        }
    }

    function alternarBloqueoCampos(bloquear) {
        const campos = [inputNombre, inputEstado, inputTipo, inputGenero, inputLocalizacion, inputOrigen];
        campos.forEach(campo => { 
            if (campo) {
                campo.disabled = bloquear;
                campo.style.backgroundColor = bloquear ? '' : '#1e293b'; // Cambio visual al editar
            }
        });
    }

    // Botón Modificar: Quita el candado de los inputs
    if (btnModificar) {
        btnModificar.addEventListener('click', () => {
            alternarBloqueoCampos(false);
            if (txtMensajeFicha) {
                txtMensajeFicha.textContent = "Modo edición activo.";
                txtMensajeFicha.style.color = "#3b82f6";
            }
        });
    }

    // Botón Guardar: Guarda localmente los datos de forma aislada por usuario
    if (btnGuardar) {
        btnGuardar.addEventListener('click', () => {
            if (inputNombre.disabled) return;

            const datosModificados = {
                name: inputNombre.value.trim(),
                status: inputEstado.value.trim(),
                type: inputTipo.value.trim(),
                gender: inputGenero.value.trim(),
                species: personajeSeleccionado.species, // Conserva especie original
                image: personajeSeleccionado.image,     // Conserva imagen original
                location: { name: inputLocalizacion.value.trim() },
                origin: { name: inputOrigen.value.trim() }
            };

            // Guarda los datos usando la clave única del usuario logueado
            const claveUsuario = obtenerClaveAlmacenamiento();
            const baseModificaciones = JSON.parse(localStorage.getItem(claveUsuario)) || {};
            
            baseModificaciones[personajeSeleccionado.id] = datosModificados;
            localStorage.setItem(claveUsuario, JSON.stringify(baseModificaciones));

            // Actualiza la lista en memoria y redibuja la tabla
            const idx = listadoPersonajes.findIndex(p => p.id === personajeSeleccionado.id);
            if (idx !== -1) listadoPersonajes[idx] = { ...listadoPersonajes[idx], ...datosModificados };

            alternarBloqueoCampos(true);
            if (txtMensajeFicha) {
                txtMensajeFicha.textContent = "¡Cambios guardados en tu cuenta!";
                txtMensajeFicha.style.color = "#22c55e";
            }
            renderizarTabla(listadoPersonajes);
        });
    }

    // Botón Salir: Cierra la ventana del modal
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', () => {
            if (modalFicha) {
                modalFicha.classList.add('modal-oculto');
                modalFicha.style.display = 'none';
            }
        });
    }

    // === 8. EJECUCIÓN DE INICIO ===
    inicializarRepositorioDatos();
});