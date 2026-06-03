// --- main.js ---
// Ya no inicializamos Supabase aquí, usamos el "supabaseClient" creado en config.js

function verificarEstadoGlobal() {
    // Escucha en tiempo real cualquier cambio de sesión (Login, Logout, Carga inicial o redirección de Google)
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        const authContainer = document.getElementById('auth-container');
        const rutaActual = window.location.pathname;

        if (session) {
            // Si el usuario ya está conectado y está intentando ver la pantalla de login, lo mandamos al inicio
            if (rutaActual.includes('auth.html')) {
                window.location.href = 'index.html';
                return;
            }

            // Consultar el nombre en la tabla perfiles
            const { data: perfil } = await supabaseClient
                .from('perfiles')
                .select('nombre_completo')
                .eq('id', session.user.id)
                .single();

            let nombreMostrar = perfil?.nombre_completo || session.user.email.split('@')[0];

            // Inyectar el menú desplegable en la barra de navegación
            if (authContainer) {
                authContainer.innerHTML = `
                    <div class="profile-dropdown-container">
                        <button id="profile-trigger" class="btn-profile">
                            ✦ Hola, ${nombreMostrar} ▾
                        </button>
                        <div id="dropdown-menu" class="dropdown-content">
                            <a href="perfil.html">Mi Perfil</a>
                            <a href="shop.html">Ir a la Tienda</a>
                            <a href="sub.html">Club Secreto</a>
                            <hr class="dropdown-divider">
                            <a href="#" id="btn-logout" class="logout-link">Cerrar Sesión</a>
                        </div>
                    </div>
                `;

                // Lógica de apertura del menú desplegable
                const trigger = document.getElementById('profile-trigger');
                const menu = document.getElementById('dropdown-menu');

                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menu.classList.toggle('show');
                });

                document.addEventListener('click', () => {
                    menu.classList.remove('show');
                });

                // Lógica de salida de la cuenta
                document.getElementById('btn-logout').addEventListener('click', async (e) => {
                    e.preventDefault();
                    await supabaseClient.auth.signOut();
                    window.location.href = 'index.html';
                });
            }

        } else {
            // Si NO hay sesión y el usuario intenta forzar la entrada a las zonas privadas, lo expulsamos a auth
            if (rutaActual.includes('perfil.html') || rutaActual.includes('sub.html')) {
                window.location.href = 'auth.html';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', verificarEstadoGlobal);