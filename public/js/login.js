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
            credentials: 'same-origin', // <- necesario para que el navegador almacene/mande la cookie de sesión
            body: JSON.stringify({ username, password })
        });
        console.log('Respuesta /login status:', resp.status, 'headers:', [...resp.headers.entries()]);

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
        const res = await fetch('/api/user-session', {
            credentials: 'same-origin' 
        }); 
        
        if (!res.ok)
            console.debug('Servidor respondió:', res.status, 'No hay sesión activa.');
            return  ; // Si devuelve 401 (no hay sesión), simplemente retorna y el login queda visible
        
                
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

          // Llamar init del dashboard después de insertar el HTML
  if (window.DashboardPanel && typeof window.DashboardPanel.init === 'function') {
    window.DashboardPanel.init();
  }


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

        // Inicializar scripts específicos de cada sección
        if (section === 'usuarios') {
            await ensureUsuariosScriptLoaded();
            window.initUsuarios();
        } else if (section === 'registrar') {
            await ensureScriptLoaded('/js/registrar.js', 'initRegistrar', 'registrar:ready');
            if (typeof window.initRegistrar === 'function') {
                window.initRegistrar();
            }
        } else if (section === 'ingreso_datos') {
            console.log('[loadContent] Cargando ingreso_datos...');
            await loadExternalScript('/js/ingreso_datos.js?v=' + Date.now());
            
            // Esperar a que se emita el evento de ready
            await new Promise((resolve) => {
                if (typeof window.initIngresoDatos === 'function') {
                    console.log('[loadContent] initIngresoDatos ya disponible');
                    resolve();
                } else {
                    window.addEventListener('ingresoDatos:ready', () => {
                        console.log('[loadContent] Evento ingresoDatos:ready recibido');
                        resolve();
                    }, { once: true });
                }
            });

            console.log('[loadContent] Ejecutando initIngresoDatos...');
            if (typeof window.initIngresoDatos === 'function') {
                window.initIngresoDatos();
            } else {
                console.error('[loadContent] initIngresoDatos no está definido');
            }
        }

    } catch (err) {
        console.error('Error loadContent:', err);
        document.getElementById('content-container').innerHTML = 
            '<p style="color:red;padding:20px;">Error al cargar el contenido</p>';
    }
}

// Función genérica para cargar scripts
async function ensureScriptLoaded(scriptPath, functionName, eventName) {
    console.log('[loader] ensureScriptLoaded:', { scriptPath, functionName });

    // Ya disponible
    if (typeof window[functionName] === 'function') {
        console.log('[loader] función ya disponible:', functionName);
        return;
    }

    // Normalizar nombre base para detectar duplicados
    const baseName = scriptPath.split('?')[0].split('/').pop();
    const already = Array.from(document.scripts).find(s => s.src && s.src.includes(baseName));
    if (already) {
        console.log('[loader] script tag ya existe, esperando evaluación...');
    } else {
        await loadExternalScript(scriptPath.includes('?') ? scriptPath : (scriptPath + '?v=' + Date.now()));
    }

    // Esperar evento o función
    let ready = false;
    const onReady = () => {
        console.log('[loader] evento recibido:', eventName);
        ready = true;
    };
    window.addEventListener(eventName, onReady, { once: true });

    const t0 = performance.now();
    while (!ready && typeof window[functionName] !== 'function' && performance.now() - t0 < 3000) {
        await new Promise(r => setTimeout(r, 60));
    }
    window.removeEventListener(eventName, onReady);

    if (typeof window[functionName] !== 'function') {
        console.error('[loader] fallo al cargar:', functionName);
        console.error('[loader] scripts actuales:', Array.from(document.scripts).map(s => s.src));
        throw new Error(functionName + ' no disponible');
    }

    console.log('[loader] función cargada:', functionName);
}

function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
        console.log('[loader] insertando script:', src);
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => {
            console.log('[loader] script onload:', src);
            // Pequeño delay para evaluación
            setTimeout(resolve, 50);
        };
        s.onerror = (e) => {
            console.error('[loader] error script:', src, e);
            reject(new Error('No se pudo cargar ' + src));
        };
        document.body.appendChild(s);
    });
}

async function ensureUsuariosScriptLoaded() {
    return ensureScriptLoaded('/js/usuarios.js', 'initUsuarios', 'usuarios:ready');
}

function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
        console.log('loadExternalScript: Verificando si existe:', src);
        
        const srcBase = src.split('?')[0];
        const exists = Array.from(document.scripts).some(s => {
            return s.src && s.src.includes(srcBase.split('/').pop());
        });
        
        if (exists) {
            console.log('loadExternalScript: Script ya existe en el DOM');
        }

        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => {
            console.log('loadExternalScript: Script cargado exitosamente:', src);
            // Dar un pequeño delay para que el script se evalúe
            setTimeout(() => resolve(), 50);
        };
        s.onerror = (err) => {
            console.error('loadExternalScript: Error al cargar script:', src, err);
            reject(new Error(`No se pudo cargar ${src}`));
        };
        
        console.log('loadExternalScript: Añadiendo script al DOM');
        document.body.appendChild(s);
    });
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
        const resp = await fetch('/api/user-session', {
             // AÑADIR ESTO: Garantiza que la cookie de sesión se adjunte
            credentials: 'same-origin'
        });
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