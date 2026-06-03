// --- main.js ---
// Usamos el cliente globalDb de tu config.js

async function verificarEstadoGlobal() {
    globalDb.auth.onAuthStateChange(async (event, session) => {
        const authContainer = document.getElementById('auth-container');
        const rutaActual = window.location.pathname;

        if (session) {
            // Si está conectado y está en el login, lo mandamos a la portada
            if (rutaActual.includes('auth.html')) {
                window.location.href = 'index.html';
                return;
            }

            // 1. Intentar buscar el perfil del usuario
            let { data: perfil, error } = await globalDb
                .from('perfiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            // 2. BYPASS: Si el perfil no existe, lo creamos directamente desde JavaScript
            if (!perfil) {
                // Extraer el nombre de los metadatos de Google o del registro
                const nombreMeta = session.user.user_metadata?.full_name || 
                                   session.user.user_metadata?.name || 
                                   session.user.email.split('@')[0];

                const { data: nuevoPerfil, error: insertError } = await globalDb
                    .from('perfiles')
                    .insert([{
                        id: session.user.id,
                        tier_actual: 'ninguno',
                        "estado_subscripción": 'inactiva',
                        "nombre _completo": nombreMeta
                    }])
                    .select()
                    .single();

                if (insertError) {
                    console.error("Error crítico al crear perfil desde JS:", insertError.message);
                } else {
                    perfil = nuevoPerfil; // Perfil creado con éxito
                }
            }

            // 3. Mostrar el nombre en la Navbar
            let nombreMostrar = perfil?.["nombre _completo"] || session.user.email.split('@')[0];

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

                // Control del menú desplegable
                const trigger = document.getElementById('profile-trigger');
                const menu = document.getElementById('dropdown-menu');

                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menu.classList.toggle('show');
                });

                document.addEventListener('click', () => {
                    menu.classList.remove('show');
                });

                // Cierre de sesión
                document.getElementById('btn-logout').addEventListener('click', async (e) => {
                    e.preventDefault();
                    await globalDb.auth.signOut();
                    window.location.href = 'index.html';
                });
            }

        } else {
            // Si no hay sesión y está en zona protegida, expulsar
            if (rutaActual.includes('perfil.html') || rutaActual.includes('sub.html')) {
                window.location.href = 'auth.html';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', verificarEstadoGlobal);