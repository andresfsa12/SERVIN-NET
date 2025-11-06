console.log('usuarios.js evaluado');

// Inicializador público para la vista de usuarios
window.initUsuarios = async function initUsuarios() {
    try {
        let tries = 0;
        while (!document.getElementById('usuariosTableBody') && tries < 20) {
            await new Promise(r => setTimeout(r, 50));
            tries++;
        }
        const tbody = document.getElementById('usuariosTableBody');
        if (!tbody) {
            console.error('initUsuarios: tbody no encontrado en el DOM');
            return;
        }

        const sessionResp = await fetch('/api/user-session', { credentials: 'same-origin' });
        if (!sessionResp.ok) {
            tbody.innerHTML = '<tr><td colspan="10">No hay sesión activa. Inicie sesión.</td></tr>';
            return;
        }

        await cargarUsuarios();
        
        // Configurar event listeners del modal
        setupModalEventListeners();
        
    } catch (e) {
        console.error('initUsuarios error:', e);
        const tbody = document.getElementById('usuariosTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="10">Error inicializando usuarios: ${e.message}</td></tr>`;
        }
    }
};

window.dispatchEvent(new Event('usuarios:ready'));

async function cargarUsuarios() {
    console.log('usuarios.js: GET /api/usuarios');
    const resp = await fetch('/api/usuarios', { credentials: 'same-origin' });
    if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(resp.status === 401 ? 'No autorizado' : `HTTP ${resp.status} ${txt}`);
    }
    const data = await resp.json();
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) throw new Error('Elemento usuariosTableBody no encontrado');

    tbody.innerHTML = '';
    (data.usuarios || []).forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.id_usuario ?? '-'}</td>
            <td>${u.nombre ?? '-'}</td>
            <td>${u.estado ?? '-'}</td>
            <td>${Number(u.rol_fk) === 1 ? 'Administrador' : 'Cliente'}</td>
            <td>${u.segmento_fk ?? '-'}</td>
            <td>${u.cod_sui ?? '-'}</td>
            <td>${u.cod_dane ?? '-'}</td>
            <td>${u.email ?? '-'}</td>
            <td>${u.username ?? '-'}</td>
            <td>
                <button class="btn-action btn-edit" data-id="${u.id_usuario}">
                    Modificar
                </button>
                <button class="btn-action btn-toggle" data-id="${u.id_usuario}" data-estado="${u.estado}">
                    ${u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Agregar event listeners a los botones
    setupTableEventListeners();
}

// Configurar event listeners de la tabla
function setupTableEventListeners() {
    // Botones de editar
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editarUsuario(id);
        });
    });
    
    // Botones de toggle estado
    document.querySelectorAll('.btn-toggle').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const estado = this.getAttribute('data-estado');
            toggleEstadoUsuario(id, estado);
        });
    });
}

// Configurar event listeners del modal
function setupModalEventListeners() {
    // Botón cerrar (X)
    const closeBtn = document.querySelector('#modalEditarUsuario .close');
    if (closeBtn) {
        closeBtn.addEventListener('click', cerrarModalEditar);
    }
    
    // Botón cancelar
    const cancelBtn = document.querySelector('.btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cerrarModalEditar);
    }
    
    // Formulario de edición
    const form = document.getElementById('formEditarUsuario');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarCambiosUsuario();
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('modalEditarUsuario');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarModalEditar();
            }
        });
    }
}

// Función para abrir el modal y cargar datos del usuario
async function editarUsuario(id) {
    try {
        console.log('Editando usuario:', id);
        
        const resp = await fetch(`/api/usuarios/${id}`, { credentials: 'same-origin' });
        if (!resp.ok) throw new Error('Error al obtener datos del usuario');
        
        const data = await resp.json();
        if (!data.success) throw new Error(data.message);
        
        const usuario = data.usuario;
        
        // Llenar el formulario
        document.getElementById('edit_id_usuario').value = usuario.id_usuario;
        document.getElementById('edit_nombre').value = usuario.nombre || '';
        document.getElementById('edit_rol_fk').value = usuario.rol_fk || '2';
        document.getElementById('edit_segmento_fk').value = usuario.segmento_fk || '';
        document.getElementById('edit_cod_sui').value = usuario.cod_sui || '';
        document.getElementById('edit_cod_dane').value = usuario.cod_dane || '';
        document.getElementById('edit_email').value = usuario.email || '';
        document.getElementById('edit_username').value = usuario.username || '';
        
        // Mostrar modal
        document.getElementById('modalEditarUsuario').style.display = 'block';
        
    } catch (error) {
        console.error('Error al editar usuario:', error);
        alert('Error al cargar datos del usuario: ' + error.message);
    }
}

// Función para cerrar el modal
function cerrarModalEditar() {
    document.getElementById('modalEditarUsuario').style.display = 'none';
}

// Función para guardar cambios
async function guardarCambiosUsuario() {
    try {
        const formData = {
            id_usuario: document.getElementById('edit_id_usuario').value,
            nombre: document.getElementById('edit_nombre').value,
            rol_fk: document.getElementById('edit_rol_fk').value,
            segmento_fk: document.getElementById('edit_segmento_fk').value,
            cod_sui: document.getElementById('edit_cod_sui').value,
            cod_dane: document.getElementById('edit_cod_dane').value,
            email: document.getElementById('edit_email').value,
            username: document.getElementById('edit_username').value
        };
        
        const resp = await fetch('/api/usuarios/actualizar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(formData)
        });
        
        const data = await resp.json();
        
        if (!data.success) throw new Error(data.message);
        
        alert('Usuario actualizado correctamente');
        cerrarModalEditar();
        await cargarUsuarios();
        
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        alert('Error al guardar cambios: ' + error.message);
    }
}

// Función para activar/desactivar usuario
async function toggleEstadoUsuario(id, estadoActual) {
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
    const confirmar = confirm(`¿Está seguro que desea ${nuevoEstado === 'Inactivo' ? 'desactivar' : 'activar'} este usuario?`);
    
    if (!confirmar) return;
    
    try {
        const resp = await fetch('/api/usuarios/estado', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ id_usuario: id, estado: nuevoEstado })
        });
        
        const data = await resp.json();
        if (!data.success) throw new Error(data.message);
        
        alert(`Usuario ${nuevoEstado === 'Inactivo' ? 'desactivado' : 'activado'} correctamente`);
        await cargarUsuarios();
        
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar estado: ' + error.message);
    }
}
