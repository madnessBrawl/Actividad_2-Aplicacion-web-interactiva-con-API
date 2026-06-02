/* LOGICA PRINCIPAL DEL SISTEMA DE INICIO - AUTENTIFICACION */ 

/* ==========================================================================
   SCRIPT PRINCIPAL - AUTENTICACIÓN Y PERSISTENCIA (LOCALSTORAGE)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // Selectores del Login (index.html)
    const formLogin = document.getElementById('formulario-login');
    const msgErrorLogin = document.getElementById('mensaje-error-login');

    // --- SELECTORES: CREARCUENTA.HTML ---
    const formRegistro = document.getElementById('formulario-registro');
    const msgErrorRegistro = document.getElementById('mensaje-error-registro');

    // --- SELECTORES: PREGUNTASEGURIDAD.HTML ---
    const formPreguntas = document.getElementById('formulario-preguntas');
    const msgErrorPreguntas = document.getElementById('mensaje-error-preguntas');

    // --- SELECTORES: RECUPERARCUENTA.HTML (PASOS DE FLUJO UNIFICADO) ---
    const formRecP1 = document.getElementById('form-recuperar-p1');
    const formRecP2 = document.getElementById('form-recuperar-p2');
    const formRecP3 = document.getElementById('form-recuperar-p3');
    
    const paso1 = document.getElementById('recuperar-paso1');
    const paso2 = document.getElementById('recuperar-paso2');
    const paso3 = document.getElementById('recuperar-paso3');
    const paso4 = document.getElementById('recuperar-paso4');

    // Almacena temporalmente el objeto del usuario encontrado en recuperación
    let usuarioEnProcesoRecuperacion = null;


    /* ==========================================================================
       1. PROCESAMIENTO DE REGISTRO - PASO 1 (Datos de usuario)
       ========================================================================== */

    // Controlador del formulario de Login
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault(); // Frena cualquier intento de recarga

            const usuarioInput = document.getElementById('usuario').value.trim().toLowerCase();
            const passwordInput = document.getElementById('contrasenia').value;
            let usuarioValidado = null; // Almacenará el usuario si coincide

            // Bucle de inspección en LocalStorage
            for (let i = 0; i < localStorage.length; i++) {
                const clave = localStorage.key(i);
                if (clave.startsWith('user_')) {
                    const usuario = JSON.parse(localStorage.getItem(clave));
                    
                    // Compara contra el correo electrónico o el nombre completo
                    if (usuario.email.toLowerCase() === usuarioInput || usuario.nombre.toLowerCase() === usuarioInput) {
                        usuarioValidado = usuario; // Asignación limpia
                        break; // Cerramos el bucle al encontrarlo
                    }
                }
            }

            // EVALUACIÓN DE SEGURIDAD ESTRICTA
            if (usuarioValidado && usuarioValidado.password === passwordInput) {
                msgErrorLogin.style.display = 'none'; // Esconde errores previos
                window.location.href = 'dashboard-gestion.html'; // REDIRECCIÓN MANUAL APROBADA
            } else {
                // Si los datos no coinciden, se bloquea el acceso y muestra la alerta
                mostrarError(msgErrorLogin, "Usuario o contraseña incorrectos.");
            }
        });
    }

    if (formRegistro) {
        formRegistro.addEventListener('submit', (e) => {
            e.preventDefault(); // Cancela recarga nativa

            const nombre = document.getElementById('reg-nombre').value.trim();
            const cedula = document.getElementById('reg-cedula').value.trim();
            const telefono = document.getElementById('reg-telefono').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value;
            const confirmPass = document.getElementById('reg-confirm-password').value;

            // Validación: Clave corta
            if (pass.length < 6) {
                mostrarError(msgErrorRegistro, "La contraseña debe tener mínimo 6 dígitos.");
                return;
            }

            // Validación: Discordancia de claves
            if (pass !== confirmPass) {
                mostrarError(msgErrorRegistro, "Las contraseñas no coinciden.");
                return;
            }

            // Guardado transitorio en memoria caché local
            const nuevoUsuario = { nombre, cedula, telefono, email, password: pass };
            localStorage.setItem('registro_temporal', JSON.stringify(nuevoUsuario));
            
            // Avanza a la pantalla de preguntas de seguridad
            window.location.href = 'preguntaSeguridad.html';
        });
    }


    /* ==========================================================================
       2. PROCESAMIENTO DE REGISTRO - PASO 2 (Preguntas de Seguridad)
       ========================================================================== */
    if (formPreguntas) {
        formPreguntas.addEventListener('submit', (e) => {
            e.preventDefault();

            const p1_q = document.getElementById('p1-seleccion').value;
            const p1_a = document.getElementById('p1-respuesta').value.trim().toLowerCase();
            const p2_q = document.getElementById('p2-seleccion').value;
            const p2_a = document.getElementById('p2-respuesta').value.trim().toLowerCase();
            const p3_q = document.getElementById('p3-seleccion').value;
            const p3_a = document.getElementById('p3-respuesta').value.trim().toLowerCase();

            // Carga de datos del paso 1
            const datosPersonales = JSON.parse(localStorage.getItem('registro_temporal'));

            if (!datosPersonales) {
                mostrarError(msgErrorPreguntas, "Falta el paso anterior. Registre de nuevo.");
                return;
            }

            // Construcción del perfil final consolidado
            const usuarioCompleto = {
                ...datosPersonales,
                seguridad: { p1_q, p1_a, p2_q, p2_a, p3_q, p3_a }
            };

            // Indexación única por correo electrónico en el LocalStorage
            localStorage.setItem(`user_${datosPersonales.email}`, JSON.stringify(usuarioCompleto));
            localStorage.removeItem('registro_temporal'); // Limpieza de temporales

            // Transición a la vista de éxito
            window.location.href = 'usuarioCreado-exito.html';
        });
    }

    /* ==============================================================
       3. REFACTORIZACIÓN: SISTEMA DE RECUPERACIÓN CON VENTANA MODAL
       ============================================================== */
    
    const formRecNombre = document.getElementById('form-recuperar-nombre');
    const modalPreguntas = document.getElementById('modal-preguntas');
    const formModalPreguntas = document.getElementById('form-modal-preguntas');
    const formEjecutarCambio = document.getElementById('form-ejecutar-cambio');

    let usuarioEncontrado = null; // Guardará el objeto del usuario localizado

    //Buscar cuenta por Nombre Completo

    if (formRecNombre) {
        formRecNombre.addEventListener('submit', (e) => {
            e.preventDefault(); // Detiene el envío por defecto
            const nombreBusqueda = document.getElementById('recuperar-nombre').value.trim().toLowerCase();
            const errorNombre = document.getElementById('error-rec-nombre');
            usuarioEncontrado = null; // Reinicia el estado de búsqueda

            // Recorre los registros de LocalStorage buscando coincidencias
            for (let i = 0; i < localStorage.length; i++) {
                const clave = localStorage.key(i);
                if (clave.startsWith('user_')) {
                    const usuario = JSON.parse(localStorage.getItem(clave));
                    // Compara nombres en minúsculas para evitar fallos de mayúsculas
                    if (usuario.nombre.toLowerCase() === nombreBusqueda) {
                        usuarioEncontrado = usuario;
                        break;
                    }
                }
            }

            // Validación si no encuentra al usuario
            if (!usuarioEncontrado) {
                mostrarError(errorNombre, "El nombre de usuario no se encuentra registrado.");
                return;
            }

            // Inyección limpia de enunciados en los labels del Modal
            document.getElementById('modal-label-p1').textContent = usuarioEncontrado.seguridad.p1_q;
            document.getElementById('modal-label-p2').textContent = usuarioEncontrado.seguridad.p2_q; // Linea corregida aquí
            document.getElementById('modal-label-p3').textContent = usuarioEncontrado.seguridad.p3_q;

            // Remueve la clase oculta para hacer emerger el Modal en pantalla
            modalPreguntas.classList.remove('modal-oculto');
        });
    }

    // Validar cuestionarios dentro del Modal
    if (formModalPreguntas) {
        formModalPreguntas.addEventListener('submit', (e) => {
            e.preventDefault();
            const r1 = document.getElementById('modal-resp1').value.trim().toLowerCase();
            const r2 = document.getElementById('modal-resp2').value.trim().toLowerCase();
            const r3 = document.getElementById('modal-resp3').value.trim().toLowerCase();
            const errorModal = document.getElementById('error-modal-preguntas');

            // Valida las respuestas almacenadas
            if (r1 !== usuarioEncontrado.seguridad.p1_a ||
                r2 !== usuarioEncontrado.seguridad.p2_a ||
                r3 !== usuarioEncontrado.seguridad.p3_a) {
                mostrarError(errorModal, "Respuestas de seguridad incorrectas.");
                return;
            }

            // Guarda el correo temporalmente para saber a quién modificar en la siguiente página
            sessionStorage.setItem('correo_recuperacion', usuarioEncontrado.email);
            
            // Envía al usuario a la página de nueva clave
            window.location.href = 'cambiarClave.html';
        });
    }

    // Guardar nueva contraseña (Se ejecuta en cambiarClave.html)
    if (formEjecutarCambio) {
        formEjecutarCambio.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevaPass = document.getElementById('cambio-nueva-pass').value;
            const confirmPass = document.getElementById('cambio-confirm-pass').value;
            const errorCambio = document.getElementById('error-cambio-pass');

            if (nuevaPass.length < 6) {
                mostrarError(errorCambio, "Debe poseer al menos 6 dígitos.");
                return;
            }

            if (nuevaPass !== confirmPass) {
                mostrarError(errorCambio, "Las contraseñas no coinciden.");
                return;
            }

            // Recupera la clave de identificación única
            const correoUsuario = sessionStorage.getItem('correo_recuperacion');
            const datosUsuario = JSON.parse(localStorage.getItem(`user_${correoUsuario}`));

            if (datosUsuario) {
                // Sobreescribe y actualiza la contraseña
                datosUsuario.password = nuevaPass;
                localStorage.setItem(`user_${correoUsuario}`, JSON.stringify(datosUsuario));
                sessionStorage.removeItem('correo_recuperacion'); // Limpieza
                
                // Redirección directa al éxito total
                window.location.href = 'cambioClave-exito.html';
            }
        });
    }
     
    // Función auxiliar para mostrar errores de forma consistente ante usuarios inexistente ante el sistema
    function mostrarError(elemento, texto) {
        if (elemento) {
            elemento.textContent = texto;      // Inserta el texto del error
            elemento.style.display = 'block';  // Fuerza a que el HTML lo muestre en pantalla
            elemento.style.color = '#ff4d4d';  // Le da el color rojo de advertencia
        }
    }
});