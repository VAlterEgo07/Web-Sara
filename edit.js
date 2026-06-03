// --- edit.js ---
async function cargarDatosPerfil() {
    const { data: { session } } = await globalDb.auth.getSession();
    
    if (!session) {
        window.location.href = 'auth.html';
        return;
    }

    const userId = session.user.id;
    const email = session.user.email;
    const provider = session.user.app_metadata.provider; // Detecta si es 'google' o 'email'

    // Rellenar datos fijos de Auth
    document.getElementById('perfil-email').value = email;

    if (provider === 'google') {
        const badgeGoogle = document.getElementById('badge-google');
        badgeGoogle.innerText = 'Conectado';
        badgeGoogle.classList.add('pink');
    }

    // Obtener datos de la tabla 'perfiles'
    const { data: perfil } = await globalDb
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (perfil) {
        document.getElementById('perfil-nombre').value = perfil.nombre_completo || '';
        document.getElementById('perfil-tier').innerText = perfil.tier_actual === 'ninguno' ? 'Ninguno' : perfil.tier_actual;
        document.getElementById('perfil-estado').innerText = `Estado: ${perfil.estado_suscripcion}`;
    }

    // Manejar el guardado del formulario
    document.getElementById('form-perfil').addEventListener('submit', async () => {
        const nuevoNombre = document.getElementById('perfil-nombre').value;
        const btnGuardar = document.getElementById('btn-guardar-perfil');
        
        btnGuardar.innerText = 'Guardando...';

        const { error } = await globalDb
            .from('perfiles')
            .update({ nombre_completo: nuevoNombre })
            .eq('id', userId);

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            alert('Perfil actualizado correctamente.');
            window.location.reload(); // Recarga para que la Navbar muestre el nuevo nombre
        }
        
        btnGuardar.innerText = 'Guardar Cambios';
    });
}

document.addEventListener('DOMContentLoaded', cargarDatosPerfil);