// --- auth.js ---
// ¡IMPORTANTE! Ya NO inicializamos Supabase aquí. 
// Asumimos que 'supabaseClient' ya existe gracias al archivo 'config.js'.

// Capturar elementos del DOM
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnSubmit = document.getElementById('btn-submit-auth');
const btnGoogle = document.getElementById('btn-google-auth');
const authTitle = document.getElementById('auth-title');
const toggleText = document.getElementById('toggle-text');

// Intentamos capturar los campos del nombre (por si usas el HTML actualizado)
const groupNombre = document.getElementById('group-nombre');
const nombreInput = document.getElementById('nombre');

let authMode = 'login'; // Estado inicial

// Alternar entre Login y Registro
function setupToggle() {
    document.getElementById('auth-toggle-link').addEventListener('click', (e) => {
        e.preventDefault();
        if (authMode === 'login') {
            authMode = 'signup';
            authTitle.innerText = 'Crear una cuenta';
            btnSubmit.innerText = 'Registrarse';
            toggleText.innerHTML = '¿Ya tienes cuenta? <a href="#" id="auth-toggle-link">Inicia sesión aquí</a>';
            
            // Mostrar el campo de nombre si existe en el HTML
            if (groupNombre) groupNombre.style.display = 'block';
            if (nombreInput) nombreInput.setAttribute('required', 'required');
        } else {
            authMode = 'login';
            authTitle.innerText = 'Comenzar tu aventura';
            btnSubmit.innerText = 'Ingresar';
            toggleText.innerHTML = '¿No tienes cuenta? <a href="#" id="auth-toggle-link">Regístrate aquí</a>';
            
            // Ocultar el campo de nombre
            if (groupNombre) groupNombre.style.display = 'none';
            if (nombreInput) nombreInput.removeAttribute('required');
        }
        setupToggle(); // Volver a vincular el evento al nuevo enlace generado
    });
}
setupToggle();

// Formulario de Email/Contraseña
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    btnSubmit.innerText = 'Cargando...';

    if (authMode === 'signup') {
        // Recoger el nombre si el input existe, si no, enviar en blanco
        const nombre = nombreInput ? nombreInput.value : '';
        
        const { error } = await supabaseClient.auth.signUp({ 
            email: email, 
            password: password,
            options: {
                data: {
                    full_name: nombre // Esto se guarda en Supabase para el perfil
                }
            }
        });
        
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('¡Registro exitoso! Ya puedes iniciar sesión.');
            // Forzar la vista a login o redirigir a inicio directamente
            window.location.href = 'index.html'; 
        }
    } else {
        // Inicio de sesión normal
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            alert('Error: Correo o contraseña incorrectos.');
        } else {
            // Si el login es correcto, 'main.js' detectará el cambio y hará el resto
            window.location.href = 'index.html'; 
        }
    }
    btnSubmit.innerText = authMode === 'signup' ? 'Registrarse' : 'Ingresar';
});

// Botón de Google OAuth
btnGoogle.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // URL a la que volver tras loguearse (Debe coincidir con la de Google Cloud)
            redirectTo: window.location.origin + '/index.html'
        }
    });
    if (error) alert('Error con Google: ' + error.message);
});