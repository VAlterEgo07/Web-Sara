// --- tienda.js ---

// Referencias a los elementos del DOM
const contenedorCatalogo = document.getElementById('catalogo-completo');
const botonesFiltro = document.querySelectorAll('.btn-filter');

let todosLosProductos = []; // Almacenamiento local de los productos descargados

// 1. Descargar los productos de Supabase
async function cargarProductos() {
    // CORRECCIÓN: Nos aseguramos de pedir explícitamente 'imagen' y 'kofi_url' de tu tabla real
    const { data: productos, error } = await globalDb
        .from('productos')
        .select('id, nombre, precio, categoria, imagen, creado_en, tamanos_disponibles, kofi_url')
        .order('creado_en', { ascending: false }); 

    if (error) {
        console.error("Error al cargar productos:", error.message);
        contenedorCatalogo.innerHTML = `<p style="color: red; text-align: center; font-weight: 600;">Error al cargar la vitrina. Inténtalo de nuevo más tarde.</p>`;
        return;
    }

    todosLosProductos = productos;
    renderizarProductos(todosLosProductos); // Mostrar todos al iniciar
}

// 2. Pintar los productos en la pantalla
function renderizarProductos(productosMostrados) {
    if (!contenedorCatalogo) return;
    contenedorCatalogo.innerHTML = ''; // Limpiar catálogo actual

    if (productosMostrados.length === 0) {
        contenedorCatalogo.innerHTML = `<p style="text-align: center; width: 100%; color: var(--color-text-muted);">No hay objetos mágicos en esta categoría aún.</p>`;
        return;
    }

    productosMostrados.forEach(producto => {
        // CORRECCIÓN: Adaptado a tu columna real 'imagen'
        const imagenDiv = producto.imagen 
            ? `<img src="${producto.imagen}" alt="${producto.nombre}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
            : `<div class="img-placeholder" style="width: 100%; padding-bottom: 100%; background: #e5e7eb; border-radius: 8px;"></div>`;

        const precioFormateado = parseFloat(producto.precio).toFixed(2);

        // Lógica del selector dinámico basado en la columna 'tamanos_disponibles'
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

        // Crear y estructurar la tarjeta del producto
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-producto';
        
        const tieneTamanos = producto.tamanos_disponibles ? 'true' : 'false';

        // Pasamos el kofi_url dinámico de la base de datos al botón
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

// 3. Sistema de filtros al hacer clic en las categorías
botonesFiltro.forEach(boton => {
    boton.addEventListener('click', (e) => {
        botonesFiltro.forEach(b => b.classList.remove('active'));
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

// 4. Lógica de Redirección Real a Ko-fi
function redirigirAKofi(urlKofi, idProducto, tieneTamanos) {
    let varianteElegida = '';

    if (tieneTamanos) {
        const selectTamaño = document.getElementById(`size-${idProducto}`);
        if (selectTamaño) {
            varianteElegida = selectTamaño.value;
        }
    }

    // Si guardas enlaces directos separados por comas en kofi_url para cada variante, 
    // podrías indexarlo aquí. Si es un link único general, abrimos ese link directo:
    if (urlKofi && urlKofi !== 'null' && urlKofi !== '') {
        // Abrimos la página del producto en Ko-fi en una nueva pestaña
        window.open(urlKofi, '_blank');
    } else {
        alert("Este objeto mágico se está indexando en Ko-fi. ¡Vuelve a intentarlo en unos minutos!");
    }
}

// Iniciar la descarga de datos al cargar la página
document.addEventListener('DOMContentLoaded', cargarProductos);