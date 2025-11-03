/**
 * login.js
 * - Envia credenciales a /login
 * - Según la respuesta (userRole) carga el menú apropiado y el contenido
 * - Soporta sesión persistente consultando /api/user-session al cargar la página
 * - Maneja logout dinámico
 */

document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay sesión activa, carga menú y contenido según rol
    initSessionIfExists();
    // Attach al submit del formulario
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLoginSubmit);
    }
});

async function handleLoginSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const resp = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        // Si credenciales invalidas el servidor responde 401
        if (!resp.ok) {
            const text = await resp.text().catch(()=>null);
            throw new Error(resp.status === 401 ? 'Usuario o contraseña incorrectos' : `HTTP ${resp.status} ${text||''}`);
        }

        const data = await resp.json();
        console.log('Login response:', data);
        // Mostrar en consola el rol del usuario que acaba de iniciar sesión
        console.log('Rol del usuario que inició sesión:', data.userRole);

        if (!data.success) {
            alert(data.message || 'Credenciales incorrectas');
            return;
        }

        // Mostrar interfaz SPA: ocultar login y mostrar contenedores
        showAppContainers();

        // Cargar menú y contenido según rol (1 = admin, 2 = cliente)
        // Aceptar role como string o número, fallback a 2 (cliente)
        let role = Number(data.userRole);
        if (!Number.isInteger(role) || (role !== 1 && role !== 2)) {
            role = 2;
        }

        await loadMenu(role);
        await loadContent(role === 1 ? 'usuarios' : 'panel_control');
    } catch (err) {
        console.error('Error en login:', err);
        alert(err.message || 'Error al iniciar sesión');
    }
}

/**
 * Comprueba sesión activa al cargar la página.
 * Si hay sesión válida, muestra menú según userRole.
 */
async function initSessionIfExists() {
    try {
        const res = await fetch('/api/user-session');
        if (!res.ok) return;
        const sessionData = await res.json();
        // Mostrar en consola el rol cuando existe sesión activa
        console.log('Sesión activa - rol del usuario:', sessionData.userRole);

        if (sessionData && sessionData.success) {
            // Ocultar login y mostrar la app
            showAppContainers();
            // Normalizar rol y fallback a 2
            let role = Number(sessionData.userRole);
            if (!Number.isInteger(role) || (role !== 1 && role !== 2)) {
                role = 2;
            }
            // Cargar menú y contenido por defecto según rol
            await loadMenu(role);
            await loadContent(role === 1 ? 'usuarios' : 'panel_control');
        }
    } catch (err) {
        console.debug('No hay sesión activa:', err);
    }
}

function showAppContainers() {
    const loginSection = document.getElementById('login-section');
    const menuContainer = document.getElementById('menu-container');
    const contentContainer = document.getElementById('content-container');
    if (loginSection) loginSection.style.display = 'none';
    if (menuContainer) menuContainer.style.display = 'block';
    if (contentContainer) contentContainer.style.display = 'block';
}

/**
 * Carga el archivo HTML del menú según rol
 * Rutas esperadas:
 * - Admin menu:  /views/admin/menu_admin/index.html
 * - Cliente menu: /views/cliente/menu/index.html
 */
async function loadMenu(role) {
    try {
        // Asegurarse que role sea 1 o 2; si no, usar 2
        role = Number(role);
        if (!Number.isInteger(role) || (role !== 1 && role !== 2)) {
            console.warn('Rol inválido recibido en loadMenu, usando rol cliente (2).', role);
            role = 2;
        }

        const menuPath = role === 1
            ? '/views/admin/menu_admin/index.html'
            : '/views/cliente/menu/index.html';

        console.log('Cargando menú:', menuPath);
        const resp = await fetch(menuPath);
        if (!resp.ok) throw new Error(`No se pudo cargar el menú (${resp.status})`);

        const html = await resp.text();
        const menuContainer = document.getElementById('menu-container');
        if (!menuContainer) throw new Error('Contenedor de menú no encontrado');
        menuContainer.innerHTML = html;

        // Actualizar info de usuario desde sesión
        await updateUserInfo();

        // Configurar eventos en los enlaces del menú (delegación)
        setupMenuEvents(role);
        // Adjuntar handler de logout (menu inyectado)
        attachLogoutHandler();
    } catch (err) {
        console.error('Error loadMenu:', err);
        const content = document.getElementById('content-container');
        if (content) content.innerHTML = `<p>Error al cargar el menú: ${err.message}</p>`;
    }
}

/**
 * Carga el contenido de una sección.

 */
async function loadContent(section) {
    try {
        if (!section) return;
        

        const adminMap = {
            'usuarios': 'usuarios',
            'registrar': 'registrar',
            'modificar': 'modificar',
            'desactivar': 'desactivar'
        };

        const clientMap = {
            'panel_control': 'panel_control',
            'informes_sui': 'informes_sui',
            'ingreso_datos': 'ingreso_datos'
        };

        // Verificar si es una sección de admin basado en el mapeo
        const isAdmin = Object.keys(adminMap).includes(section);

        let basePath = isAdmin ? '/views/admin/' : '/views/cliente/';
        let mapped = isAdmin ? (adminMap[section] || section) : (clientMap[section] || section);
        const fullPath = `${basePath}${mapped}/index.html`;

        console.log('Cargando contenido:', fullPath);
        const resp = await fetch(fullPath);
        if (!resp.ok) {
            document.getElementById('content-container').innerHTML = `<p>Sección no encontrada: ${fullPath}</p>`;
            return;
        }

        const html = await resp.text();
        document.getElementById('content-container').innerHTML = html;

        // Actualizar historial y marcar activo
        history.pushState({ section }, '', `/${section}`);
        const activeLink = document.querySelector(`#menu a[data-section="${section}"]`);
        if (activeLink) setActiveMenuItem(activeLink);
    } catch (err) {
        console.error('Error loadContent:', err);
        document.getElementById('content-container').innerHTML = `<p>Error al cargar contenido: ${err.message}</p>`;
    }
}

/**
 * Configura los eventos click de los enlaces del menú.
 * Usa delegación por si el menú se reinyecta.
 */
function setupMenuEvents(role) {
    const menu = document.getElementById('menu');
    if (!menu) return;

    // Remover handlers previos para evitar duplicados
    menu.removeEventListener('click', menu._listener);
    menu._listener = async function (e) {
        const a = e.target.closest('a[data-section]');
        if (!a) return;
        e.preventDefault();
        const section = a.dataset.section;
        await loadContent(section);
        setActiveMenuItem(a);
    };
    menu.addEventListener('click', menu._listener);
}

function setActiveMenuItem(activeLink) {
    document.querySelectorAll('#menu a').forEach(l => l.classList.remove('active'));
    if (activeLink) activeLink.classList.add('active');
}

/**
 * Consulta /api/user-session y actualiza #usuario-menu y #id-menu si existen.
 * Endpoint /api/user-session debe devolver { success:true, userId, userName, userRole }
 */
async function updateUserInfo() {
    try {
        const resp = await fetch('/api/user-session');
        if (!resp.ok) return;
        const data = await resp.json();
        if (!data.success) return;

        const userSpan = document.getElementById('usuario-menu');
        const idSpan = document.getElementById('id-menu');
        if (userSpan) userSpan.textContent = data.userName || '';
        if (idSpan) idSpan.textContent = `ID: ${data.userId || ''}`;
    } catch (err) {
        console.error('Error updateUserInfo:', err);
    }
}

/**
 * Logout: POST /logout, limpia almacenamiento y redirige a inicio
 */
async function performLogout() {
    try {
        const resp = await fetch('/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }});
        const data = await resp.json();
        if (data && data.success) {
            try { sessionStorage.clear(); localStorage.clear(); } catch(e){}
            window.location.href = '/';
        } else {
            alert(data.message || 'No se pudo cerrar sesión');
        }
    } catch (err) {
        console.error('Error performLogout:', err);
        alert('Error al cerrar sesión');
    }
}

/**
 * Adjunta handler al botón logout dentro del menú inyectado.
 * Usa delegación sobre #menu-container para garantizar que funcione cuando el menú se inyecta dinámicamente.
 */
function attachLogoutHandler() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    // Remover listener previo si existe
    container.removeEventListener('click', container._logoutListener);
    container._logoutListener = function (e) {
        const btn = e.target.closest('#logout-btn, [data-action="logout"]');
        if (!btn) return;
        e.preventDefault();
        performLogout();
    };
    container.addEventListener('click', container._logoutListener);
}

// Soporte navegación atrás/adelante
window.addEventListener('popstate', (e) => {
    const section = (e.state && e.state.section) || (document.querySelector('#menu a.active')?.dataset.section) || 'panel_control';
    loadContent(section);
});