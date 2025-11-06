console.log('usuarios.js evaluado');

// Inicializador público para la vista de usuarios
window.initUsuarios = async function initUsuarios() {
    try {
        // Esperar a que el tbody exista (la vista ya fue insertada)
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

        // Verificar sesión
        const sessionResp = await fetch('/api/user-session', { credentials: 'same-origin' });
        if (!sessionResp.ok) {
            tbody.innerHTML = '<tr><td colspan="10">No hay sesión activa. Inicie sesión.</td></tr>';
            return;
        }

        await cargarUsuarios();
    } catch (e) {
        console.error('initUsuarios error:', e);
        const tbody = document.getElementById('usuariosTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="10">Error inicializando usuarios: ${e.message}</td></tr>`;
        }
    }
};

// Señalizar que el script fue evaluado
window.dispatchEvent(new Event('usuarios:ready'));

// Solo funciones utilitarias, sin tocar el DOM si no existe la vista
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
            <td></td>
        `;
        tbody.appendChild(tr);
    });
}
