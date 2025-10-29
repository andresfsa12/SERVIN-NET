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
        const res = await fetch('/views/menu/index.html');
        if (!res.ok) throw new Error('No se pudo cargar el menú');
        const html = await res.text();
        const menuContainer = document.getElementById('menu-container');
        menuContainer.innerHTML = html;

        // listeners para opciones del menú
        document.querySelectorAll('#menu a').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                await loadContent(section);
                setActiveMenuItem(e.target);
            });
        });
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

// Cerrar sesión
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-btn');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                });

                const data = await response.json();
                if (data.success) {
                    // Redirigir a la página de inicio o login
                    window.location.href = '/';
                } else {
                    alert('Error al cerrar sesión');
                }
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                alert('Error de conexión. No se pudo cerrar sesión.');
            }
        });
    }
});