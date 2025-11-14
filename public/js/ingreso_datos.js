// ingreso_datos.js
(() => {
    console.log('[ingreso_datos.js] Evaluando script');

    if (typeof window.initIngresoDatos === 'function') {
        console.log('[ingreso_datos.js] initIngresoDatos ya definido, emitiendo evento');
        window.dispatchEvent(new Event('ingresoDatos:ready'));
        return;
    }

    // Función para renderizar suscriptores (definida globalmente)
    window.renderSuscriptores = function(suscriptores, vigencia, mes) {
        const tbody = document.getElementById('tbodySuscriptores');
        if (!tbody) {
            console.error('[renderSuscriptores] tbody no encontrado');
            return;
        }

        tbody.innerHTML = '';

        if (!suscriptores || suscriptores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No se encontraron registros</td></tr>';
            return;
        }

        suscriptores.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.id_suscriptores}</td>
                <td>${vigencia || s.id_vigenciaFK}</td>
                <td>${mes || s.mes}</td>
                <td>${s.servicio}</td>
                <td>${s.suscriptores || 0}</td>
                <td>
                    <button class="btn-action btn-editar" data-id="${s.id_suscriptores}">Editar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Agregar listeners a botones de editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const suscriptor = suscriptores.find(su => su.id_suscriptores == id);
                if (suscriptor) {
                    window.editarSuscriptor(suscriptor, vigencia, mes);
                }
            });
        });

        console.log('[renderSuscriptores] Tabla actualizada con', suscriptores.length, 'registros');
    };

    // Función para abrir modal de nuevo registro
    window.abrirModalNuevo = function() {
        const vigencia = document.getElementById('vigencia')?.value;
        const mes = document.getElementById('periodo')?.value;
        const servicio = document.getElementById('servicio')?.value;

        if (!vigencia || !mes || !servicio) {
            alert('Por favor complete Vigencia, Periodo y Servicio antes de crear un registro');
            return;
        }

        document.getElementById('modalTitle').textContent = 'Nuevo Suscriptor';
        document.getElementById('id_suscriptor').value = '';
        document.getElementById('modal_vigencia').value = vigencia;
        document.getElementById('modal_mes').value = mes;
        document.getElementById('modal_servicio').value = servicio;
        document.getElementById('modal_suscriptores').value = '';
        
        document.getElementById('modalSuscriptor').style.display = 'block';
    };

    // Función para editar suscriptor
    window.editarSuscriptor = function(suscriptor, vigencia, mes) {
        document.getElementById('modalTitle').textContent = 'Editar Suscriptor';
        document.getElementById('id_suscriptor').value = suscriptor.id_suscriptores;
        document.getElementById('modal_vigencia').value = vigencia || suscriptor.id_vigenciaFK;
        document.getElementById('modal_mes').value = mes || suscriptor.mes;
        document.getElementById('modal_servicio').value = suscriptor.servicio;
        document.getElementById('modal_suscriptores').value = suscriptor.suscriptores || '';
        document.getElementById('modalSuscriptor').style.display = 'block';
    };

    // Función para cerrar modal
    window.cerrarModal = function() {
        document.getElementById('modalSuscriptor').style.display = 'none';
    };

    // Función para guardar suscriptor
    window.guardarSuscriptor = async function(e) {
        e.preventDefault();

        const formData = {
            id_suscriptor: document.getElementById('id_suscriptor').value,
            vigencia: document.getElementById('modal_vigencia').value,
            mes: document.getElementById('modal_mes').value,
            servicio: document.getElementById('modal_servicio').value,
            suscriptores: document.getElementById('modal_suscriptores').value
        };

        try {
            const method = formData.id_suscriptor ? 'PUT' : 'POST';
            const url = formData.id_suscriptor 
                ? '/api/suscriptores/' + formData.id_suscriptor 
                : '/api/suscriptores';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            alert(formData.id_suscriptor ? 'Registro actualizado' : 'Registro creado');
            window.cerrarModal();
            document.getElementById('btn-consultar')?.click();
        } catch (err) {
            console.error('[guardarSuscriptor] Error:', err);
            alert('Error: ' + err.message);
        }
    };

    window.initIngresoDatos = function initIngresoDatos() {
        console.log('[ingreso_datos.js] initIngresoDatos: inicio');

        const btnConsultar = document.getElementById('btn-consultar');
        const selectVariable = document.getElementById('variable');
        const selectVigencia = document.getElementById('vigencia');
        const selectServicio = document.getElementById('servicio');
        const selectPeriodo = document.getElementById('periodo');
        const container = document.getElementById('content-input');

        if (!btnConsultar || !selectVariable || !container) {
            console.warn('[ingreso_datos.js] Elementos faltantes. Reintento en 120ms');
            setTimeout(initIngresoDatos, 120);
            return;
        }

        console.log('[ingreso_datos.js] Elementos OK');

        const loadSuscriptores = async () => {
            console.log('[ingreso_datos.js] loadSuscriptores: iniciando');

            // Validar campos
            const variable = selectVariable.value;
            const vigencia = selectVigencia.value;
            const servicio = selectServicio.value;
            const periodo = selectPeriodo.value;

            if (!variable || !vigencia || !servicio || !periodo) {
                container.innerHTML = '<div style="padding:12px;color:#c00;">Por favor complete todos los campos antes de consultar.</div>';
                return;
            }

            if (variable !== 'usuarios') {
                container.innerHTML = '<div style="padding:12px;color:#666;">Seleccione "Suscriptores" en Variables.</div>';
                return;
            }

            container.innerHTML = '<div style="padding:12px;text-align:center;">Cargando datos...</div>';

            try {
                // Cargar el HTML de la vista
                const resHtml = await fetch('/views/cliente/ingreso_datos/usuarios.html', {
                    credentials: 'same-origin',
                    cache: 'no-store'
                });

                if (!resHtml.ok) throw new Error('Error cargando vista: ' + resHtml.status);

                const html = await resHtml.text();
                container.innerHTML = html;

                console.log('[ingreso_datos.js] Vista cargada, configurando eventos...');

                // Configurar eventos del modal después de cargar el HTML
                setTimeout(() => {
                    const btnNuevo = document.getElementById('btnNuevo');
                    const closeModal = document.getElementById('closeModal');
                    const btnCancelar = document.getElementById('btnCancelar');
                    const formSuscriptor = document.getElementById('formSuscriptor');

                    if (btnNuevo) {
                        btnNuevo.addEventListener('click', window.abrirModalNuevo);
                    }
                    if (closeModal) {
                        closeModal.addEventListener('click', window.cerrarModal);
                    }
                    if (btnCancelar) {
                        btnCancelar.addEventListener('click', window.cerrarModal);
                    }
                    if (formSuscriptor) {
                        formSuscriptor.addEventListener('submit', window.guardarSuscriptor);
                    }

                    console.log('[ingreso_datos.js] Eventos del modal configurados');
                }, 100);

                // Cargar datos desde el servidor
                const params = new URLSearchParams({
                    vigencia: vigencia,
                    mes: periodo,
                    servicio: servicio
                });

                const resData = await fetch('/api/suscriptores?' + params.toString(), {
                    credentials: 'same-origin'
                });

                if (!resData.ok) {
                    throw new Error('Error consultando suscriptores: ' + resData.status);
                }

                const data = await resData.json();
                console.log('[ingreso_datos.js] Datos recibidos:', data);

                // Renderizar los datos en la tabla
                window.renderSuscriptores(data.suscriptores || [], vigencia, periodo);

            } catch (err) {
                console.error('[ingreso_datos.js] Error:', err);
                container.innerHTML = '<div style="color:#c00;padding:12px;">Error: ' + err.message + '</div>';
            }
        };

        // Event listener del botón consultar
        if (btnConsultar._consultarListener) {
            btnConsultar.removeEventListener('click', btnConsultar._consultarListener);
        }
        btnConsultar._consultarListener = loadSuscriptores;
        btnConsultar.addEventListener('click', loadSuscriptores);

        console.log('[ingreso_datos.js] initIngresoDatos: listo');
    };

    window.dispatchEvent(new Event('ingresoDatos:ready'));
    console.log('[ingreso_datos.js] Evento ingresoDatos:ready emitido');
})();