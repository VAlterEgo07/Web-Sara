// --- tienda.js ---

// Referencias a los elementos del DOM
const contenedorCatalogo = document.getElementById('catalogo-completo');
const botonesFiltro = document.querySelectorAll('.btn-filter');

let todosLosProductos = []; // Almacenamiento local de los productos descargados

// 1. Descargar los productos de Supabase
async function cargarProductos() {
    const { data: productos, error } = await globalDb
        .from('productos')
        .select('*')
        .order('creado_en', { ascending: false }); // Ordena del más nuevo al más antiguo

    if (error) {
        console.error("Error al cargar productos:", error.message);
        contenedorCatalogo.innerHTML = `<p style="color: red; text-align: center;">Error al cargar la vitrina. Inténtalo de nuevo más tarde.</p>`;
        return;
    }

    todosLosProductos = productos;
    renderizarProductos(todosLosProductos); // Mostrar todos al iniciar
}

// 2. Pintar los productos en la pantalla
function renderizarProductos(productosMostrados) {
    contenedorCatalogo.innerHTML = ''; // Limpiar catálogo actual

    if (productosMostrados.length === 0) {
        contenedorCatalogo.innerHTML = `<p style="text-align: center; width: 100%; color: #888;">No hay objetos mágicos en esta categoría aún.</p>`;
        return;
    }

    productosMostrados.forEach(producto => {
        // Renderizar imagen o placeholder
        const imagenDiv = producto.imagen_url 
            ? `<img src="${producto.imagen_url}" alt="${producto.nombre}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`
            : `<div class="img-placeholder" style="width: 100%; padding-bottom: 100%; background: #e5e7eb; border-radius: 8px;"></div>`;

        // Formatear precio a dos decimales
        const precioFormateado = parseFloat(producto.precio).toFixed(2);

        // Lógica del selector dinámico basado en la columna 'tamanos_disponibles'
        let selectorTamañoHTML = '';
        if (producto.tamanos_disponibles) {
            // Dividir el texto por comas y limpiar espacios ("A5, A4" -> ["A5", "A4"])
            const listaTamanos = producto.tamanos_disponibles.split(',').map(t => t.trim());
            
            // Generar las opciones del desplegable
            const opcionesHTML = listaTamanos.map(tamano => `<option value="${tamano}">${tamano}</option>`).join('');

            selectorTamañoHTML = `
                <div class="selector-tamaño-container" style="margin: 12px 0 4px 0; text-align: left;">
                    <label for="size-${producto.id}" style="font-size: 0.85rem; color: #6b7280; display: block; margin-bottom: 4px;">Opciones disponibles:</label>
                    <select id="size-${producto.id}" style="width: 100%; padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px; background-color: #fff; font-family: inherit; font-size: 0.9rem; color: #374151; cursor: pointer;">
                        ${opcionesHTML}
                    </select>
                </div>
            `;
        }

        // Crear y estructurar la tarjeta del producto
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-producto';
        
        // Pasamos "true" o "false" a la función comprar dependiendo de si tiene desplegable
        const tieneTamanos = producto.tamanos_disponibles ? 'true' : 'false';

        tarjeta.innerHTML = `
            <div class="img-container">${imagenDiv}</div>
            <span class="category-tag">${producto.categoria}</span>
            <h3>${producto.nombre}</h3>
            
            ${selectorTamañoHTML} <p class="precio">${precioFormateado} €</p>
            <button class="btn-buy" onclick="añadirAlCarrito(${producto.id}, ${tieneTamanos})">Comprar ahora</button>
        `;

        contenedorCatalogo.appendChild(tarjeta);
    });
}

// 3. Sistema de filtros al hacer clic en las categorías
botonesFiltro.forEach(boton => {
    boton.addEventListener('click', (e) => {
        // Quitar estado activo de todos y ponerlo al presionado
        botonesFiltro.forEach(b => b.classList.remove('active'));
        const botonClicado = e.target;
        botonClicado.classList.add('active');

        // Leer atributo data-categoria
        const { categoria: categoriaSeleccionada } = botonClicado.dataset;

        // Mostrar productos según categoría
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

// 4. Lógica de captura de compra
function añadirAlCarrito(idProducto, tieneTamanos) {
    let detalleVariante = '';

    // Si el producto tenía desplegable, capturamos el valor exacto que eligió el usuario
    if (tieneTamanos) {
        const selectTamaño = document.getElementById(`size-${idProducto}`);
        if (selectTamaño) {
            detalleVariante = ` en variante: ${selectTamaño.value}`;
        }
    }

    alert(`¡Has seleccionado el objeto mágico con ID: ${idProducto}${detalleVariante}! El carrito se forjará pronto.`);
}

// Iniciar la descarga de datos al cargar la página
document.addEventListener('DOMContentLoaded', cargarProductos);