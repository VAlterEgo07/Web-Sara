/* =========================================================================
   1. GESTIÓN DE AUTENTICACIÓN Y PERFILES (NAVBAR)
   ========================================================================= */
async function verificarEstadoGlobal() {
    globalDb.auth.onAuthStateChange(async (event, session) => {
        const authContainer = document.getElementById('auth-container');
        const rutaActual = window.location.pathname;

        if (session) {
            if (rutaActual.includes('auth.html')) {
                window.location.href = 'index.html';
                return;
            }

            let { data: perfil, error } = await globalDb
                .from('perfiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (error) {
                console.error("Error al consultar el perfil:", error.message);
            }

            if (!perfil) {
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
                        correo: session.user.email,
                        direccion_postal: null,     
                        fecha_inicio: null,         
                        fecha_expiracion: null      
                    }])
                    .select()
                    .single();

                if (insertError) {
                    console.error("Error crítico al crear perfil desde JS:", insertError.message);
                } else {
                    perfil = nuevoPerfil; 
                }
            }

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

                const trigger = document.getElementById('profile-trigger');
                const menu = document.getElementById('dropdown-menu');

                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menu.classList.toggle('show');
                });

                document.addEventListener('click', () => {
                    if (menu) menu.classList.remove('show');
                });

                document.getElementById('btn-logout').addEventListener('click', async (e) => {
                    e.preventDefault();
                    await globalDb.auth.signOut();
                    window.location.href = 'index.html';
                });
            }

        } else {
            if (rutaActual.includes('profile.html') || rutaActual.includes('sub.html')) {
                window.location.href = 'auth.html';
            }
        }
    });
}

/* =========================================================================
   2. DESCARGA Y RENDERIZADO DEL CATÁLOGO DE PRODUCTOS (LA VITRINA)
   ========================================================================= */
async function cargarProductos() {
    const contenedorCatalogo = document.getElementById('catalogo-completo');
    if (!contenedorCatalogo) return;

    // CORRECCIÓN: Pedimos explícitamente 'imagen_url' para que coincida con tu base de datos
    const { data: productos, error } = await globalDb
        .from('productos')
        .select('id, nombre, precio, categoria, imagen_url, creado_en, tamanos_disponibles, kofi_url')
        .order('creado_en', { ascending: false }); 

    if (error) {
        console.error("Error al cargar productos:", error.message);
        contenedorCatalogo.innerHTML = `<p style="color: red; text-align: center; font-weight: 600; width: 100%;">Fallo en la base de datos: ${error.message}</p>`;
        return;
    }

    todosLosProductos = productos;
    renderizarProductos(todosLosProductos); 
    inicializarFiltros(); 
}

function renderizarProductos(productosMostrados) {
    const contenedorCatalogo = document.getElementById('catalogo-completo');
    if (!contenedorCatalogo) return;
    contenedorCatalogo.innerHTML = ''; 

    if (productosMostrados.length === 0) {
        contenedorCatalogo.innerHTML = `<p style="text-align: center; width: 100%; color: var(--color-text-muted); margin-top: 20px;">No hay objetos mágicos en esta categoría aún.</p>`;
        return;
    }

    productosMostrados.forEach(producto => {
        // CORRECCIÓN: Usamos producto.imagen_url para mostrar la foto
        const imagenDiv = producto.imagen_url 
            ? `<img src="${producto.imagen_url}" alt="${producto.nombre}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
            : `<div class="img-placeholder" style="width: 100%; padding-bottom: 100%; background: #e5e7eb; border-radius: 8px;"></div>`;

        const precioFormateado = parseFloat(producto.precio).toFixed(2);

        let selectorTamañoHTML = '';
        if (producto.tamanos_disponibles) {
            const listaTamanos = producto.tamanos_disponibles.split(',').map(t => t.trim());
            const opcionesHTML = listaTamanos.map(tamano => `<option value="${tamano}">${tamano}</option>`).join('');

            selectorTamañoHTML = `
                <div class="selector-tamaño-container" style="margin: 12px 0 4px 0; text-align: left;">
                    <label for="size-${producto.id}" style="font-size: 0.85rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Opciones disponibles:</label>
                    <select id="size-${producto.id}" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background-color: #fff; font-family: inherit; font-size: 0.9rem; color: var(--color-text-main); cursor: pointer;">
                        ${opcionesHTML}
                    </select>
                </div>
            `;
        }

        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-producto';
        const tieneTamanos = producto.tamanos_disponibles ? 'true' : 'false';

        tarjeta.innerHTML = `
            <div class="img-container">${imagenDiv}</div>
            <span class="category-tag">${producto.categoria}</span>
            <h3>${producto.nombre}</h3>
            
            ${selectorTamañoHTML} 
            <p class="precio">${precioFormateado} €</p>
            
            <button class="btn-buy" onclick="redirigirAKofi('${producto.kofi_url}', ${producto.id}, ${tieneTamanos})">
                Comprar en Ko-fi ➔
            </button>
        `;

        contenedorCatalogo.appendChild(tarjeta);
    });
}

function renderizarProductos(productosMostrados) {
    const contenedorCatalogo = document.getElementById('catalogo-completo');
    if (!contenedorCatalogo) return;
    contenedorCatalogo.innerHTML = ''; 

    if (productosMostrados.length === 0) {
        contenedorCatalogo.innerHTML = `<p style="text-align: center; width: 100%; color: var(--color-text-muted); margin-top: 20px;">No hay objetos mágicos en esta categoría aún.</p>`;
        return;
    }

    productosMostrados.forEach(producto => {
        const imagenDiv = producto.imagen 
            ? `<img src="${producto.imagen}" alt="${producto.nombre}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
            : `<div class="img-placeholder" style="width: 100%; padding-bottom: 100%; background: #e5e7eb; border-radius: 8px;"></div>`;

        const precioFormateado = parseFloat(producto.precio).toFixed(2);

        let selectorTamañoHTML = '';
        if (producto.tamanos_disponibles) {
            const listaTamanos = producto.tamanos_disponibles.split(',').map(t => t.trim());
            const opcionesHTML = listaTamanos.map(tamano => `<option value="${tamano}">${tamano}</option>`).join('');

            selectorTamañoHTML = `
                <div class="selector-tamaño-container" style="margin: 12px 0 4px 0; text-align: left;">
                    <label for="size-${producto.id}" style="font-size: 0.85rem; color: var(--color-text-muted); display: block; margin-bottom: 4px;">Opciones disponibles:</label>
                    <select id="size-${producto.id}" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; background-color: #fff; font-family: inherit; font-size: 0.9rem; color: var(--color-text-main); cursor: pointer;">
                        ${opcionesHTML}
                    </select>
                </div>
            `;
        }

        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-producto';
        const tieneTamanos = producto.tamanos_disponibles ? 'true' : 'false';

        tarjeta.innerHTML = `
            <div class="img-container">${imagenDiv}</div>
            <span class="category-tag">${producto.categoria}</span>
            <h3>${producto.nombre}</h3>
            
            ${selectorTamañoHTML} 
            <p class="precio">${precioFormateado} €</p>
            
            <button class="btn-buy" onclick="redirigirAKofi('${producto.kofi_url}', ${producto.id}, ${tieneTamanos})">
                Comprar en Ko-fi ➔
            </button>
        `;

        contenedorCatalogo.appendChild(tarjeta);
    });
}

// Nueva función aislada para arrancar los filtros de forma segura
function inicializarFiltros() {
    const botonesFiltro = document.querySelectorAll('.btn-filter');
    if (botonesFiltro.length === 0) return;

    botonesFiltro.forEach(boton => {
        // Clonamos el nodo para limpiar cualquier listener viejo acumulado
        const nuevoBoton = boton.cloneNode(true);
        boton.parentNode.replaceChild(nuevoBoton, boton);

        nuevoBoton.addEventListener('click', (e) => {
            const botonesActuales = document.querySelectorAll('.btn-filter');
            botonesActuales.forEach(b => b.classList.remove('active'));
            
            const botonClicado = e.target;
            botonClicado.classList.add('active');

            const { categoria: categoriaSeleccionada } = botonClicado.dataset;

            if (categoriaSeleccionada === 'Todos') {
                renderizarProductos(todosLosProductos);
            } else {
                const productosFiltrados = todosLosProductos.filter(
                    producto => producto.categoria === categoriaSeleccionada
                );
                renderizarProductos(productosFiltrados);
            }
        });
    });
}

function redirigirAKofi(urlKofi, idProducto, tieneTamanos) {
    let varianteElegida = '';
    if (tieneTamanos) {
        const selectTamaño = document.getElementById(`size-${idProducto}`);
        if (selectTamaño) {
            varianteElegida = selectTamaño.value;
        }
    }

    if (urlKofi && urlKofi !== 'null' && urlKofi !== '') {
        window.open(urlKofi, '_blank');
    } else {
        alert("Este objeto mágico se está indexando en Ko-fi. ¡Vuelve a intentarlo en unos minutos!");
    }
}

/* =========================================================================
   3. SECCIÓN SEGUIMIENTO DE OBJETIVOS (BARRA DE METAS)
   ========================================================================= */
async function cargarMetaRecaudacion() {
    try {
        const { data, error } = await globalDb
            .from('metas_club')
            .select('nombre, recaudado, objetivo')
            .eq('id', 1) 
            .single();

        if (error) throw error;

        if (data) {
            const { nombre, recaudado, objetivo } = data;
            const porcentaje = Math.min((recaudado / objetivo) * 100, 100).toFixed(1);

            const domTitle = document.getElementById('goal-title');
            const domBar = document.getElementById('goal-progress-bar');
            const domText = document.getElementById('goal-progress-text');
            const domCurrent = document.getElementById('goal-current');
            const domTarget = document.getElementById('goal-target');

            if (domTitle) domTitle.textContent = nombre;
            if (domCurrent) domCurrent.textContent = `Recaudado: ${parseFloat(recaudado).toFixed(2)} €`;
            if (domTarget) domTarget.textContent = `Objetivo: ${parseFloat(objetivo).toFixed(2)} €`;
            if (domText) domText.textContent = `${porcentaje}% Completado`;
            
            setTimeout(() => {
                if (domBar) domBar.style.width = `${porcentaje}%`;
            }, 200);
        }
    } catch (err) {
        console.error('Error al obtener la meta de recaudación:', err.message);
        const domText = document.getElementById('goal-progress-text');
        if (domText) domText.textContent = "Meta temporalmente no disponible";
    }
}

/* =========================================================================
   4. INICIALIZACIÓN COMPLETA DEL DOM
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    verificarEstadoGlobal();
    cargarProductos();
    cargarMetaRecaudacion();
});