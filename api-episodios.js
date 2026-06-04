// LOGICA DE LA API Y EL ARCHIVO dashboard-gestion-episodios.html

document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES GLOBALES ---
    let episodios = []; // Almacena los episodios cargados
    let asc = true; // Control de dirección de ordenamiento
    let episodioActual = null; // Fila seleccionada para editar

    // --- ELEMENTOS DEL PANEL PRINCIPAL ---
    const tabla = document.getElementById('tbody-episodios');
    const buscador = document.getElementById('buscador');
    const btnOrdenar = document.getElementById('btn-ordenar-tabla');

    // --- ELEMENTOS DE LA FICHA MODAL ---
    const modal = document.getElementById('modal-ficha-episodio');
    const inputNombre = document.getElementById('ficha-nombre');
    const inputFecha = document.getElementById('ficha-fecha');
    const inputCodigo = document.getElementById('ficha-codigo');
    
    // --- BOTONES DE LA FICHA ---
    const btnModificar = document.getElementById('btn-modificar-ficha');
    const btnGuardar = document.getElementById('btn-ficha-guardar');
    const btnSalir = document.getElementById('btn-ficha-salir');
    const txtAlerta = document.getElementById('mensaje-alerta-ficha');

    // --- CARGA DE DATOS DE LA API + RESPALDO LOCAL OFFLINE ---
    async function cargarEpisodios() {
        try {
            const res = await fetch('https://rickandmortyapi.com/api/episode');
            const data = await res.json();
            episodios = data.results;
            localStorage.setItem('cache_episodios', JSON.stringify(episodios)); // Guarda en caché
        } catch (e) {
            // Carga de emergencia si no hay internet
            const cache = localStorage.getItem('cache_episodios');
            episodios = cache ? JSON.parse(cache) : [
                { id: 1, name: "Pilot (Offline)", air_date: "Dec 2, 2013", episode: "S01E01" }
            ];
        }
        // Incorpora ediciones locales previas guardadas
        aplicarCambiosLocales();
        renderizarTabla(episodios);
    }

    // --- INYECTAR DATOS EN LA TABLA ---
    function renderizarTabla(lista) {
        tabla.innerHTML = '';
        lista.forEach(ep => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ep.id}</td>
                <td><strong>${ep.name}</strong></td>
                <td>${ep.air_date}</td>
                <td>${ep.episode}</td>
            `;
            tr.addEventListener('click', () => abrirModal(ep)); // Abre ficha al hacer clic
            tabla.appendChild(tr);
        });
    }

    // --- BUSCADOR EN TIEMPO REAL ---
    buscador.addEventListener('input', (e) => {
        const valor = e.target.value.toLowerCase().trim();
        const filtrados = episodios.filter(ep => 
            ep.name.toLowerCase().includes(valor) || 
            ep.episode.toLowerCase().includes(valor)
        );
        renderizarTabla(filtrados);
    });

    // --- ORDENAR TABLA POR ID ---
    btnOrdenar.addEventListener('click', () => {
        asc = !asc;
        episodios.sort((a, b) => asc ? a.id - b.id : b.id - a.id);
        btnOrdenar.textContent = asc ? "Ascendente a Descendente" : "Descendente a Ascendente";
        renderizarTabla(episodios);
    });

    // --- ACCIONES DE LA FICHA MODAL ---
    function abrirModal(ep) {
        episodioActual = ep;
        inputNombre.value = ep.name;
        inputFecha.value = ep.air_date;
        inputCodigo.value = ep.episode;
        
        bloquearInputs(true); // Inicializa bloqueado por seguridad
        txtAlerta.textContent = '';
        modal.classList.remove('modal-oculto');
    }

    function bloquearInputs(estado) {
        inputNombre.disabled = estado;
        inputFecha.disabled = estado;
        inputCodigo.disabled = estado;
    }

    // Botón Modificar: Habilita los cuadros de texto
    btnModificar.addEventListener('click', () => {
        bloquearInputs(false);
        txtAlerta.textContent = "Campos editables.";
        txtAlerta.style.color = "#3b82f6";
    });

    // Botón Guardar: Guarda cambios localmente y actualiza la tabla
    btnGuardar.addEventListener('click', () => {
        if (inputNombre.disabled) return;

        // Actualiza el objeto en memoria
        episodioActual.name = inputNombre.value.trim();
        episodioActual.air_date = inputFecha.value.trim();
        episodioActual.episode = inputCodigo.value.trim();

        // Guarda permanentemente en LocalStorage
        const ediciones = JSON.parse(localStorage.getItem('ediciones_episodios')) || {};
        ediciones[episodioActual.id] = {
            name: episodioActual.name,
            air_date: episodioActual.air_date,
            episode: episodioActual.episode
        };
        localStorage.setItem('ediciones_episodios', JSON.stringify(ediciones));

        bloquearInputs(true);
        txtAlerta.textContent = "¡Guardado con éxito!";
        txtAlerta.style.color = "#22c55e";
        renderizarTabla(episodios); // Refresca la tabla principal
    });

    // Botón Salir: Cierra el modal
    btnSalir.addEventListener('click', () => {
        modal.classList.add('modal-oculto');
    });

    // Fusiona las ediciones guardadas con el listado principal
    function aplicarCambiosLocales() {
        const ediciones = JSON.parse(localStorage.getItem('ediciones_episodios'));
        if (!ediciones) return;
        episodios = episodios.map(ep => ediciones[ep.id] ? { ...ep, ...ediciones[ep.id] } : ep);
    }

    // --- INICIO DE LA APLICACIÓN ---
    cargarEpisodios();
});