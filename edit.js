// --- edit.js ---

// Elementos del DOM
const formPerfil = document.getElementById('form-perfil');
const formDireccion = document.getElementById('form-direccion');
const inputNombre = document.getElementById('perfil-nombre');
const inputEmail = document.getElementById('perfil-email');
const inputDireccion = document.getElementById('perfil-direccion');

const txtTier = document.getElementById('perfil-tier');
const txtEstado = document.getElementById('perfil-estado');
const txtFechaInicio = document.getElementById('perfil-fecha-inicio');
const txtFechaExpiracion = document.getElementById('perfil-fecha-expiracion');
const badgeGoogle = document.getElementById('badge-google');
const alerta = document.getElementById('perfil-alerta');

// Función para mostrar avisos elegantes de éxito o error
function mostrarAlerta(mensaje, tipo = 'exito') {
    alerta.innerText = mensaje;
    alerta.style.display = 'block';
    if (tipo === 'exito') {
        alerta.style.background = '#def7ec';
        alerta.style.color = '#03543f';
        alerta.style.border = '1px solid #84e1bc';
    } else {
        alerta.style.background = '#fde8e8';
        alerta.style.color = '#9b1c1c';
        alerta.style.border = '1px solid #f8b4b4';
    }
    setTimeout(() => { alerta.style.display = 'none'; }, 4000);
}

// 1. Cargar la información actual del usuario en pantalla
async function cargarDatosPerfil() {
    // Escuchamos hasta tener sesión activa
    globalDb.auth.onAuthStateChange(async (event, session) => {
        if (!session) return;

        const userId = session.user.id;

        // Rellenar email desde Auth de Supabase (Siempre seguro)
        if (inputEmail) inputEmail.value = session.user.email;

        // Control del Badge de Google
        if (badgeGoogle && session.user.app_metadata.provider === 'google') {
            badgeGoogle.innerText = 'Conectado con Google';
            badgeGoogle.style.background = '#e1effe';
            badgeGoogle.style.color = '#1e429f';
        }

        // Descargar datos de la tabla 'perfiles'
        const { data: perfil, error } = await globalDb
            .from('perfiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error("Error cargando perfil:", error.message);
            return;
        }

        if (perfil) {
            if (inputNombre) inputNombre.value = perfil.nombre_completo || '';
            if (inputDireccion) inputDireccion.value = perfil.direccion_postal || '';
            if (txtTier) txtTier.innerText = perfil.tier_actual || 'ninguno';
            if (txtEstado) txtEstado.innerText = `Estado: ${perfil.estado_suscripcion || 'inactiva'}`;
            
            // Formatear las fechas mensuales de manera legible (dd/mm/aaaa)
            const opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
            if (txtFechaInicio) {
                txtFechaInicio.innerText = perfil.fecha_inicio 
                    ? new Date(perfil.fecha_inicio).toLocaleDateString('es-ES', opcionesFecha)
                    : '-- / -- / ----';
            }
            if (txtFechaExpiracion) {
                txtFechaExpiracion.innerText = perfil.fecha_expiracion 
                    ? new Date(perfil.fecha_expiracion).toLocaleDateString('es-ES', opcionesFecha)
                    : '-- / -- / ----';
            }
        }
    });
}

// 2. Evento: Guardar Información Personal (Nombre)
if (formPerfil) {
    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { data: { user } } = await globalDb.auth.getUser();
        if (!user) return;

        const { error } = await globalDb
            .from('perfiles')
            .update({ nombre_completo: inputNombre.value })
            .eq('id', user.id);

        if (error) {
            mostrarAlerta('Error al actualizar el nombre: ' + error.message, 'error');
        } else {
            mostrarAlerta('¡Nombre de visualización guardado con éxito! ✨');
        }
    });
}

// 3. Evento: Guardar Dirección de Envío (Calle)
if (formDireccion) {
    formDireccion.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { data: { user } } = await globalDb.auth.getUser();
        if (!user) return;

        const { error } = await globalDb
            .from('perfiles')
            .update({ direccion_postal: inputDireccion.value })
            .eq('id', user.id);

        if (error) {
            mostrarAlerta('Error al actualizar la dirección: ' + error.message, 'error');
        } else {
            mostrarAlerta('¡Dirección de envío guardada con éxito!');
        }
    });
}

// Arrancar la carga al abrir el perfil
document.addEventListener('DOMContentLoaded', cargarDatosPerfil);