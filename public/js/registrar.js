console.log('registrar.js evaluado');

window.initRegistrar = function initRegistrar() {
    const form = document.getElementById('formRegistrarUsuario');
    const msg = document.getElementById('reg_msg');
    if (!form) {
        console.warn('initRegistrar: no se encontró el formulario, reintentando...');
        setTimeout(initRegistrar, 100);
        return;
    }

    const setMsg = (text, ok = false) => {
        if (!msg) return;
        msg.textContent = text;
        msg.style.color = ok ? '#2e7d32' : '#c62828';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setMsg('');

        const payload = {
            id_usuario: form.reg_id_usuario?.value?.trim() || null,
            nombre: form.reg_nombre.value.trim(),
            estado: form.reg_estado.value,
            rol_fk: Number(form.reg_rol_fk.value),
            segmento_fk: form.reg_segmento_fk.value.trim() || null,
            cod_sui: form.reg_cod_sui.value.trim() || null,
            cod_dane: form.reg_cod_dane.value.trim() || null,
            email: form.reg_email.value.trim(),
            username: form.reg_username.value.trim(),
            password: form.reg_password.value
        };

        // Validaciones básicas
        if (!payload.nombre || !payload.username || !payload.password || !payload.email) {
            setMsg('Por favor complete los campos requeridos.');
            return;
        }
        if (payload.password.length < 8) {
            setMsg('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        try {
            const res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                throw new Error(data.message || `Error HTTP ${res.status}`);
            }

            setMsg('Usuario registrado correctamente.', true);
            form.reset();
        } catch (err) {
            console.error('Error registrando usuario:', err);
            setMsg(err.message || 'Error registrando usuario.');
        }
    });
};

// Señal para loaders dinámicos
window.dispatchEvent(new Event('registrar:ready'));