// --- edit.js --- (Sustituye todo el código por este)

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

// Función para mostrar avisos
function mostrarAlerta(mensaje, tipo = 'exito') {
    alerta.innerText = mensaje;
    alerta.style.display = 'block';
    
    // Hacemos scroll suave hacia arriba para que el usuario siempre vea la alerta
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tipo === 'exito') {
        alerta.style.background = '#def7ec';
        alerta.style.color = '#03543f';
        alerta.style.border = '1px solid #84e1bc';
    } else if (tipo === 'cargando') {
        alerta.style.background = '#e1effe';
        alerta.style.color = '#1e429f';
        alerta.style.border = '1px solid #a4cafe';
    } else {
        alerta.style.background = '#fde8e8';
        alerta.style.color = '#9b1c1c';
        alerta.style.border = '1px solid #f8b4b4';
    }

    // Solo ocultamos la alerta a los 4 segundos si no es el mensaje de "cargando..."
    if (tipo !== 'cargando') {
        setTimeout(() => { alerta.style.display = 'none'; }, 4000);
    }
}

// 1. Cargar la información actual
async function cargarDatosPerfil() {
    globalDb.auth.onAuthStateChange(async (event, session) => {
        if (!session) return;

        const userId = session.user.id;
        if (inputEmail) inputEmail.value = session.user.email;

        if (badgeGoogle && session.user.app_metadata.provider === 'google') {
            badgeGoogle.innerText = 'Conectado con Google';
            badgeGoogle.style.background = '#e1effe';
            badgeGoogle.style.color = '#1e429f';
        }

        const { data: perfil, error } = await globalDb
            .from('perfiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (perfil) {
            if (inputNombre) inputNombre.value = perfil.nombre_completo || '';
            if (inputDireccion) inputDireccion.value = perfil.direccion_postal || '';
            if (txtTier) txtTier.innerText = perfil.tier_actual || 'ninguno';
            if (txtEstado) txtEstado.innerText = `Estado: ${perfil.estado_suscripcion || 'inactiva'}`;
            
            const opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
            if (txtFechaInicio) txtFechaInicio.innerText = perfil.fecha_inicio ? new Date(perfil.fecha_inicio).toLocaleDateString('es-ES', opcionesFecha) : '-- / -- / ----';
            if (txtFechaExpiracion) txtFechaExpiracion.innerText = perfil.fecha_expiracion ? new Date(perfil.fecha_expiracion).toLocaleDateString('es-ES', opcionesFecha) : '-- / -- / ----';
        }
    });
}

// 2. Evento: Guardar Nombre
if (formPerfil) {
    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault(); // ¡Crucial! Evita que la página se recargue
        mostrarAlerta('Guardando cambios...', 'cargando'); // Feedback instantáneo

        const { data: { user } } = await globalDb.auth.getUser();
        if (!user) {
            mostrarAlerta('Error: No se encontró la sesión', 'error');
            return;
        }

        const { error } = await globalDb
            .from('perfiles')
            .update({ nombre_completo: inputNombre.value })
            .eq('id', user.id);

        if (error) {
            mostrarAlerta('Error al actualizar: ' + error.message, 'error');
        } else {
            mostrarAlerta('¡Nombre de visualización guardado con éxito! ✨', 'exito');
            // Actualizamos el nombre también en el botón de la barra de navegación al instante
            const btnProfile = document.getElementById('profile-trigger');
            if (btnProfile) btnProfile.innerHTML = `✦ Hola, ${inputNombre.value} ▾`;
        }
    });
}

// 3. Evento: Guardar Dirección Postal
if (formDireccion) {
    formDireccion.addEventListener('submit', async (e) => {
        e.preventDefault(); // ¡Crucial!
        mostrarAlerta('Guardando dirección...', 'cargando'); 

        const { data: { user } } = await globalDb.auth.getUser();
        if (!user) return;

        const { error } = await globalDb
            .from('perfiles')
            .update({ direccion_postal: inputDireccion.value })
            .eq('id', user.id);

        if (error) {
            mostrarAlerta('Error al actualizar la dirección: ' + error.message, 'error');
        } else {
            mostrarAlerta('¡Dirección de envío guardada con éxito! 📦', 'exito');
        }
    });
}

document.addEventListener('DOMContentLoaded', cargarDatosPerfil);