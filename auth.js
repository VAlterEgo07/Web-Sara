// --- auth.js ---
const SUPABASE_URL = 'https://asohirfqptahznnbvrxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzb2hpcmZxcHRhaHpubmJ2cnhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODQ0ODEsImV4cCI6MjA5NjA2MDQ4MX0.GOymweYwuKDOkHIB9UnTIkMwdiCqPWBGe2xbDefzpWg';

// Inicializar cliente
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Capturar elementos del DOM
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnSubmit = document.getElementById('btn-submit-auth');
const btnGoogle = document.getElementById('btn-google-auth');
const authTitle = document.getElementById('auth-title');
const toggleText = document.getElementById('toggle-text');

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
        } else {
            authMode = 'login';
            authTitle.innerText = 'Comenzar tu aventura';
            btnSubmit.innerText = 'Ingresar';
            toggleText.innerHTML = '¿No tienes cuenta? <a href="#" id="auth-toggle-link">Regístrate aquí</a>';
        }
        setupToggle(); // Volver a vincular el evento al nuevo enlace
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
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) alert('Error: ' + error.message);
        else {
            alert('¡Registro exitoso! Ya puedes iniciar sesión.');
            window.location.href = 'index.html';
        }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) alert('Error: Correo o contraseña incorrectos.');
        else window.location.href = 'index.html'; // Redirige a la tienda al entrar
    }
    btnSubmit.innerText = authMode === 'signup' ? 'Registrarse' : 'Ingresar';
});

// Botón de Google OAuth
btnGoogle.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // URL a la que volver tras loguearse (Ajusta esto en producción por tu dominio de Netlify)
            redirectTo: window.location.origin + '/index.html'
        }
    });
    if (error) alert('Error con Google: ' + error.message);
});