// --- main.js ---
// Usamos el cliente globalDb configurado en tu archivo config.js

async function verificarEstadoGlobal() {
    globalDb.auth.onAuthStateChange(async (event, session) => {
        const authContainer = document.getElementById('auth-container');
        const rutaActual = window.location.pathname;

        if (session) {
            // Si el usuario ya está conectado e intenta entrar a la página de login, lo redirigimos a la portada
            if (rutaActual.includes('auth.html')) {
                window.location.href = 'index.html';
                return;
            }

            // 1. Intentar buscar el perfil del usuario en la tabla limpia
            let { data: perfil, error } = await globalDb
                .from('perfiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (error) {
                console.error("Error al consultar el perfil:", error.message);
            }

            // 2. BYPASS: Si el perfil no existe en la tabla, lo creamos automáticamente desde JavaScript
            if (!perfil) {
                // Extraer el nombre de los metadatos de Google o de su registro por email
                const nombreMeta = session.user.user_metadata?.full_name || 
                                   session.user.user_metadata?.name || 
                                   session.user.email.split('@')[0];

                const { data: nuevoPerfil, error: insertError } = await globalDb
                    .from('perfiles')
                    .insert([{
                        id: session.user.id,
                        tier_actual: 'ninguno',
                        estado_suscripcion: 'inactiva',
                        nombre_completo: nombreMeta,
                        correo: session.user.email, // Guarda automáticamente el email del usuario
                        direccion_postal: null,     // Se rellenará más adelante en el perfil o compra
                        fecha_inicio: null,         // Se activará al realizar el pago mensual
                        fecha_expiracion: null      // Se activará al realizar el pago mensual
                    }])
                    .select()
                    .single();

                if (insertError) {
                    console.error("Error crítico al crear perfil desde JS:", insertError.message);
                } else {
                    perfil = nuevoPerfil; // Perfil creado con éxito, lo asignamos para usar sus datos
                }
            }

            // 3. Renderizar y mostrar el nombre del usuario en la Navbar
            let nombreMostrar = perfil?.nombre_completo || session.user.email.split('@')[0];

            if (authContainer) {
                authContainer.innerHTML = `
                    <div class="profile-dropdown-container">
                        <button id="profile-trigger" class="btn-profile">
                            ✦ Hola, ${nombreMostrar} ▾
                        </button>
                        <div id="dropdown-menu" class="dropdown-content">
                            <a href="profile.html">Mi Perfil</a>
                            <a href="shop.html">Ir a la Tienda</a>
                            <a href="sub.html">Club Secreto</a>
                            <hr class="dropdown-divider">
                            <a href="#" id="btn-logout" class="logout-link">Cerrar Sesión</a>
                        </div>
                    </div>
                `;

                // Lógica para abrir y cerrar el menú desplegable del perfil
                const trigger = document.getElementById('profile-trigger');
                const menu = document.getElementById('dropdown-menu');

                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menu.classList.toggle('show');
                });

                document.addEventListener('click', () => {
                    menu.classList.remove('show');
                });

                // Manejo del cierre de sesión (Sign Out)
                document.getElementById('btn-logout').addEventListener('click', async (e) => {
                    e.preventDefault();
                    await globalDb.auth.signOut();
                    window.location.href = 'index.html';
                });
            }

        } else {
            // Si no hay ninguna sesión activa y el usuario intenta entrar a zonas protegidas, lo expulsamos al login
            if (rutaActual.includes('profile.html') || rutaActual.includes('sub.html')) {
                window.location.href = 'auth.html';
            }
        }
    });
}

// Inicializar la verificación cuando todo el HTML de la página esté completamente cargado
document.addEventListener('DOMContentLoaded', verificarEstadoGlobal);