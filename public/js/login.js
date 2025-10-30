document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!data.success) {
            alert(data.message || 'Credenciales incorrectas');
            return;
        }

        // Mostrar menú y contenido
        document.getElementById('login-section').style.display = 'none';
        const menuContainer = document.getElementById('menu-container');
        const contentContainer = document.getElementById('content-container');
        menuContainer.style.display = 'block';
        contentContainer.style.display = 'block';

        await loadMenu();
        await loadContent('panel_control');
    } catch (error) {
        console.error('Error al autenticar:', error);
        alert('Error de conexión con el servidor');
    }
});

async function loadMenu() {
    try {
        const menuResponse = await fetch('/views/menu/index.html');
        const menuContainer = document.getElementById('menu-container');
        menuContainer.innerHTML = await menuResponse.text();

        // Actualizar datos del usuario en el menú
        const userSpan = document.getElementById('usuario-menu');
        const idSpan = document.getElementById('id-menu');
        
        if (userSpan && idSpan) {
            // Obtener datos de sesión
            const sessionResponse = await fetch('/api/user-session');
            const sessionData = await sessionResponse.json();
            
            if (sessionData.success) {
                userSpan.textContent = sessionData.userName;
                idSpan.textContent = `ID: ${sessionData.userId}`;
            }
        }

        // listeners para opciones del menú
        document.querySelectorAll('#menu a').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                await loadContent(section);
                setActiveMenuItem(e.target);
            });
        });

        // Attach logout handler for the newly injected menu
        attachLogoutHandler();
    } catch (error) {
        console.error('Error al cargar el menú:', error);
    }
}

async function loadContent(section) {
    try {
        const res = await fetch(`/views/${section}/index.html`);
        if (!res.ok) {
            document.getElementById('content-container').innerHTML = '<p>Sección no encontrada</p>';
            return;
        }
        const html = await res.text();
        document.getElementById('content-container').innerHTML = html;
        history.pushState({ section }, '', `/${section}`);
        // marcar activo según data-section
        const activeLink = document.querySelector(`#menu a[data-section="${section}"]`);
        if (activeLink) setActiveMenuItem(activeLink);
    } catch (error) {
        console.error(`Error cargando ${section}:`, error);
        document.getElementById('content-container').innerHTML = '<p>Error al cargar contenido</p>';
    }
}

function setActiveMenuItem(activeLink) {
    document.querySelectorAll('#menu a').forEach(link => link.classList.remove('active'));
    if (activeLink) activeLink.classList.add('active');
}

// Soporte para navegación con back/forward
window.addEventListener('popstate', (e) => {
    const section = (e.state && e.state.section) || 'panel_control';
    loadContent(section);
});

// Helper: función que realiza el logout en el servidor y redirige
async function performLogout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data && data.success) {
            // limpiar almacenamiento local / sessionStorage si usas
            try { sessionStorage.clear(); localStorage.clear(); } catch (e) {}
            // redirigir a inicio
            window.location.href = '/';
        } else {
            alert(data.message || 'Error al cerrar sesión');
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error de conexión. No se pudo cerrar sesión.');
    }
}

// Adjunta el handler al botón logout existente en el menú inyectado
function attachLogoutHandler() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    // Delegación: escucha clicks dentro del contenedor del menú
    // y responde cuando el target es el botón logout.
    // Esto cubre casos donde el botón se inyecta dinámicamente.
    menuContainer.addEventListener('click', function onMenuClick(e) {
        const target = e.target;
        if (target && (target.id === 'logout-btn' || target.matches('[data-action="logout"]'))) {
            e.preventDefault();
            performLogout();
        }
    }, { once: false });
}

// Si el menú ya estaba cargado al recargar la página, aún queremos
// asegurar que el logout funcione: attach cuando DOMContentLoaded.
document.addEventListener('DOMContentLoaded', () => {
    attachLogoutHandler();
});