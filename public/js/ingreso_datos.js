// ingreso_datos.js
(() => {
    console.log('[ingreso_datos.js] Evaluando script');

    if (typeof window.initIngresoDatos === 'function') {
        console.log('[ingreso_datos.js] initIngresoDatos ya definido');
        window.dispatchEvent(new Event('ingresoDatos:ready'));
        return;
    }

    // Configuración de variables y sus campos
    const VARIABLES_CONFIG = {
        usuarios: {
            tabla: 'suscriptores',  // ← Debe coincidir con el nombre de la tabla en BD
            idColumn: 'id_suscriptores',
            titulo: 'Suscriptores',
            noAA: true,        // ← bloquear servicio "aa"
            noYear: true,      // ← bloquear periodo "year"
            unico: true,       // ← bloquear duplicados
            campos: [
                { nombre: 'suscriptores', label: 'Número de Suscriptores', tipo: 'number' }
            ],
            columnas: ['ID', 'Vigencia', 'Mes', 'Servicio', 'Suscriptores', 'Acciones']
        },
        continuidad: {
            tabla: 'continuidad',  // ← IMPORTANTE: Debe ser el nombre exacto de la tabla
            idColumn: 'id_continuidad',
            titulo: 'Continuidad',
            soloAcueducto: true,
            noYear: true,      // ← bloquear periodo "year"
            unico: true,       // ← bloquear duplicados
            campos: [
                { nombre: 'h_suspension', label: 'Horas de Suspensión', tipo: 'number', step: '0.01' }
            ],
            columnas: ['ID', 'Vigencia', 'Mes', 'Servicio', 'Horas Suspensión', 'Acciones']
        },
        pqr: {
            tabla: 'pqr',
            idColumn: 'id_pqr',
            titulo: 'PQR',
            noAA: true,          // ← bloquear servicio "aa"
            noYear: true,        // ← bloquear periodo "year"
            unico: true,         // ← solo 1 registro por vigencia, mes, servicio, usuario
            campos: [
                { nombre: 'pqr_recibidas', label: 'PQR Recibidas', tipo: 'number' },
                { nombre: 'pqr_resueltas', label: 'PQR Resueltas', tipo: 'number' },
                { nombre: 'pqr_no_resueltas', label: 'PQR No Resueltas', tipo: 'number' }
            ],
            columnas: ['ID', 'Vigencia', 'Mes', 'Servicio', 'Recibidas', 'Resueltas', 'No Resueltas', 'Acciones']
        },
        micromedicion: {
            tabla: 'micromedicion',
            idColumn: 'id_mm',
            titulo: 'Micromedición',
            soloAcueducto: true,
            noYear: true,
            unico: true,
            campos: [
                { nombre: 'mm_total', label: 'Total Micromedidores', tipo: 'number' },
                { nombre: 'mm_funcionales', label: 'Funcionales', tipo: 'number' },
                { nombre: 'mm_no_funcionales', label: 'No Funcionales', tipo: 'number' }
            ],
            columnas: ['ID', 'Vigencia', 'Mes', 'Servicio', 'Total', 'Funcionales', 'No Funcionales', 'Acciones']
        },
        caudal: {
            tabla: 'caudal',
            idColumn: 'id_caudal',
            titulo: 'Caudal',
            soloAcueducto: true,
            noYear: true,
            unico: true,
            campos: [
                { nombre: 'q_otorgado', label: 'Caudal Otorgado (L/s)', tipo: 'number', step: '0.01' },
                { nombre: 'q_captado', label: 'Caudal Captado (L/s)', tipo: 'number', step: '0.01' },
                { nombre: 'total_m3_captado', label: 'Total m³ Captado', tipo: 'number', step: '0.01' },
                { nombre: 'total_m3_entregado_inter', label: 'Total m³ Entregado', tipo: 'number', step: '0.01' },
                { nombre: 'total_m3_producido', label: 'Total m³ Producido', tipo: 'number', step: '0.01' },
                { nombre: 'total_m3_facturado', label: 'Total m³ Facturado', tipo: 'number', step: '0.01' }
            ],
            columnas: ['ID', 'Vigencia', 'Mes', 'Servicio', 'Q Otorgado', 'Q Captado', 'm³ Captado', 'm³ Entregado', 'm³ Producido', 'm³ Facturado', 'Acciones']
        },
        vertimiento: {
            tabla: 'vertimiento',
            idColumn: 'id_vertimiento',
            titulo: 'Vertimiento',
            soloAlcantarillado: true,  // ← Solo alcantarillado
            noYear: true,
            unico: true,               // ← solo 1 registro por vigencia, mes, usuario
            campos: [
                { nombre: 'total_m3_vertido', label: 'Total m³ Vertido', tipo: 'number', step: '0.01' }
            ],
            columnas: ['ID', 'Vigencia', 'Mes', 'Servicio', 'm³ Vertido', 'Acciones']
        },
        lodos: {
            tabla: 'lodos',
            idColumn: 'id_lodos',
            titulo: 'Lodos',
            noAA: true,      // ← bloquear servicio "aa"
            noYear: true,    // ← bloquear periodo "year"
            unico: true,     // ← solo 1 registro por vigencia, mes, usuario
            campos: [
                { nombre: 'lodos_ingresados_kg', label: 'Lodos Ingresados (kg)', tipo: 'number', step: '0.01' },
                { nombre: 'lodos_salientes_kg', label: 'Lodos Salientes (kg)', tipo: 'number', step: '0.01' }
            ],
            columnas: ['ID', 'Vigencia', 'Mes', 'Servicio', 'Ingresados (kg)', 'Salientes (kg)', 'Acciones']
        },
        redacueducto: {
            tabla: 'redacueducto',
            idColumn: 'id_redAcueducto',
            titulo: 'Red de Acueducto',
            soloAcueducto: true,   // solo acueducto
            noAA: true,            // bloquear "aa"
            periodoAnual: true,    // solo periodo "year"
            unico: true,         // solo 1 registro por vigencia, usuario
            campos: [
                { nombre: 'longitud_aduccion', label: 'Longitud Aducción (km)', tipo: 'number', step: '0.01' },
                { nombre: 'fallas_aduccion', label: 'Fallas Aducción', tipo: 'number' },
                { nombre: 'longitud_condu_distri', label: 'Longitud Conducción/Distribución (km)', tipo: 'number', step: '0.01' },
                { nombre: 'fallas_condu_distri', label: 'Fallas Conducción/Distribución', tipo: 'number' }
            ],
            columnas: ['ID', 'Vigencia', 'Periodo', 'Servicio', 'Long. Aducción', 'Fallas Aducción', 'Long. Cond/Dist', 'Fallas Cond/Dist', 'Acciones']
        },
        redalcantarillado: {
            tabla: 'redalcantarillado',
            idColumn: 'id_red_alcantarillado',
            titulo: 'Red de Alcantarillado',
            soloAlcantarillado: true,   // ← solo alcantarillado
            noAA: true,                 // ← bloquear "aa"
            periodoAnual: true,         // ← solo periodo "year"
            unico: true,                // ← solo 1 registro por vigencia y usuario
            campos: [
                { nombre: 'longitud_km', label: 'Longitud (km)', tipo: 'number', step: '0.01' },
                { nombre: 'fallas', label: 'Fallas', tipo: 'number' }
            ],
            columnas: ['ID', 'Vigencia', 'Periodo', 'Servicio', 'Longitud (km)', 'Fallas', 'Acciones']
        },
        energia: {
            tabla: 'energia',
            idColumn: 'id_energia',
            titulo: 'Energía',
            noAA: true,                 // ← bloquear "aa"
            noYear: true,               // ← bloquear periodo "year"
            unico: true,                // ← solo 1 registro por vigencia, mes y usuario
            campos: [
                { nombre: 'kWh', label: 'Consumo (kWh)', tipo: 'number', step: '0.01' }
            ],
            columnas: ['ID', 'Vigencia', 'Mes', 'Servicio', 'kWh', 'Acciones']
        },
        personal: {
            tabla: 'personal',
            idColumn: 'id_personal',
            titulo: 'Personal',
            soloAA: true,           // ← solo servicio "aa" (Ambos)
            periodoAnual: true,     // ← solo periodo "year"
            unico: true,            // ← solo 1 registro por vigencia y usuario
            campos: [
                { nombre: 'total_directivos', label: 'Total Directivos', tipo: 'number', min: '0' },
                { nombre: 'cantidad_relevos', label: 'Cantidad Relevos', tipo: 'number', min: '0' },
                { nombre: 'total_administrativo', label: 'Total Administrativo', tipo: 'number', min: '0' },
                { nombre: 'total_operativo_acu', label: 'Total Operativo Acueducto', tipo: 'number', min: '0' },
                { nombre: 'total_operativo_alc', label: 'Total Operativo Alcantarillado', tipo: 'number', min: '0' }
            ],
            columnas: ['ID', 'Vigencia', 'Periodo', 'Servicio', 'Directivos', 'Relevos', 'Administrativo', 'Op. Acueducto', 'Op. Alcantarillado', 'Acciones']
        }
    };

    let datosActuales = [];
    let configActual = null;
    let contextActual = {};

    // Función para renderizar tabla
    window.renderTabla = function(datos, config, vigencia, mes, servicio) {
        const thead = document.getElementById('theadDatos');
        const tbody = document.getElementById('tbodyDatos');
        const titulo = document.getElementById('titulo-tabla');
        const btnNuevo = document.getElementById('btnNuevo');

        if (!thead || !tbody) {
            console.error('[renderTabla] Elementos no encontrados');
            return;
        }

        datosActuales = datos;
        configActual = config;
        contextActual = { vigencia, mes, servicio };

        // Actualizar título
        if (titulo) {
            titulo.textContent = config.titulo;
        }

        // Deshabilitar botón "Nuevo" si la variable tiene restricción única y ya existe registro
        if (btnNuevo) {
            if (config.unico && datos && datos.length > 0) {
                btnNuevo.disabled = true;
                btnNuevo.style.opacity = '0.5';
                btnNuevo.style.cursor = 'not-allowed';
                btnNuevo.title = 'Ya existe un registro. Use Editar.';
            } else {
                btnNuevo.disabled = false;
                btnNuevo.style.opacity = '1';
                btnNuevo.style.cursor = 'pointer';
                btnNuevo.title = 'Crear nuevo registro';
            }
        }

        // Generar encabezados
        thead.innerHTML = `
            <tr>
                ${config.columnas.map(col => `<th>${col}</th>`).join('')}
            </tr>
        `;

        // Generar filas
        if (!datos || datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${config.columnas.length}" class="no-data">No se encontraron registros</td></tr>`;
            return;
        }

        tbody.innerHTML = datos.map(d => {
            const id = d[config.idColumn];
            let celdas = [
                `<td>${id}</td>`,
                `<td>${vigencia}</td>`,
                `<td>${mes}</td>`
            ];

            // Agregar servicio si aplica
            if (!config.soloAA) {
                celdas.push(`<td>${servicio}</td>`);
            } else {
                celdas.push(`<td>Ambos</td>`);
            }

            // Agregar campos de datos
            config.campos.forEach(campo => {
                celdas.push(`<td>${d[campo.nombre] || 0}</td>`);
            });

            // Botón editar
            celdas.push(`<td><button class="btn-action btn-editar" data-id="${id}">Editar</button></td>`);

            return `<tr>${celdas.join('')}</tr>`;
        }).join('');

        // Agregar listeners a botones de editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editarRegistro(id);
            });
        });

        console.log('[renderTabla] Tabla actualizada con', datos.length, 'registros');
    };

    // Función para abrir modal nuevo registro
    window.abrirModalNuevo = function() {
        if (!configActual) {
            alert('Primero debe consultar datos');
            return;
        }

        const { vigencia, mes, servicio } = contextActual;

        if (!vigencia || !mes) {
            alert('Por favor complete Vigencia y Periodo');
            return;
        }

        // Validar servicio según configuración
        if (configActual.soloAcueducto && servicio !== 'acueducto') {
            alert('Esta variable solo aplica para Acueducto');
            return;
        }

        if (configActual.soloAlcantarillado && servicio !== 'alcantarillado') {
            alert('Esta variable solo aplica para Alcantarillado');
            return;
        }

        if (configActual.soloAA && servicio !== 'aa') {
            alert('Esta variable solo aplica para Ambos servicios');
            return;
        }

        if (!configActual.soloAA && !servicio) {
            alert('Por favor seleccione un Servicio');
            return;
        }

        // Validación para variables con restricción única (vertimiento y lodos)
        if (configActual.unico && datosActuales.length > 0) {
            alert(`Ya existe un registro de ${configActual.titulo} para esta vigencia y mes. Use la opción Editar.`);
            return;
        }

        console.log('[abrirModalNuevo] Configuración:', configActual);
        console.log('[abrirModalNuevo] Contexto:', contextActual);

        // Actualizar título y campos básicos
        const modalTitle = document.getElementById('modalTitle');
        const idRegistro = document.getElementById('id_registro');
        const modalVigencia = document.getElementById('modal_vigencia');
        const modalMes = document.getElementById('modal_mes');
        const modalServicio = document.getElementById('modal_servicio');
        const camposDinamicos = document.getElementById('campos-dinamicos');

        if (!modalTitle || !idRegistro || !modalVigencia || !modalMes || !modalServicio || !camposDinamicos) {
            console.error('[abrirModalNuevo] Elementos del modal no encontrados');
            alert('Error: Elementos del formulario no encontrados. Recargue la página.');
            return;
        }

        modalTitle.textContent = `Nuevo ${configActual.titulo}`;
        idRegistro.value = '';
        modalVigencia.value = vigencia;
        modalMes.value = mes;
        modalServicio.value = servicio || 'N/A';

        // Generar campos dinámicos
        camposDinamicos.innerHTML = configActual.campos.map(campo => `
            <div class="form-group">
                <label for="modal_${campo.nombre}">${campo.label}</label>
                <input 
                    type="${campo.tipo}" 
                    id="modal_${campo.nombre}" 
                    name="${campo.nombre}" 
                    ${campo.step ? `step="${campo.step}"` : ''}
                    min="0"
                    value="0"
                    required>
            </div>
        `).join('');

        console.log('[abrirModalNuevo] Campos generados:', configActual.campos.length);

        // Mostrar modal
        const modal = document.getElementById('modalDatos');
        if (modal) {
            modal.style.display = 'block';
            console.log('[abrirModalNuevo] Modal abierto');
        } else {
            console.error('[abrirModalNuevo] Modal no encontrado');
        }
    };

    // Función para editar registro
    function editarRegistro(id) {
        const dato = datosActuales.find(d => d[configActual.idColumn] == id);
        if (!dato) {
            alert('Registro no encontrado');
            return;
        }

        const { vigencia, mes, servicio } = contextActual;

        console.log('[editarRegistro] Dato:', dato);

        // Actualizar elementos del modal
        const modalTitle = document.getElementById('modalTitle');
        const idRegistro = document.getElementById('id_registro');
        const modalVigencia = document.getElementById('modal_vigencia');
        const modalMes = document.getElementById('modal_mes');
        const modalServicio = document.getElementById('modal_servicio');
        const camposDinamicos = document.getElementById('campos-dinamicos');

        if (!modalTitle || !idRegistro || !modalVigencia || !modalMes || !modalServicio || !camposDinamicos) {
            console.error('[editarRegistro] Elementos del modal no encontrados');
            alert('Error: Elementos del formulario no encontrados');
            return;
        }

        modalTitle.textContent = `Editar ${configActual.titulo}`;
        idRegistro.value = id;
        modalVigencia.value = vigencia;
        modalMes.value = mes;
        modalServicio.value = servicio || 'N/A';

        // Llenar campos dinámicos con valores
        camposDinamicos.innerHTML = configActual.campos.map(campo => `
            <div class="form-group">
                <label for="modal_${campo.nombre}">${campo.label}</label>
                <input 
                    type="${campo.tipo}" 
                    id="modal_${campo.nombre}" 
                    name="${campo.nombre}" 
                    ${campo.step ? `step="${campo.step}"` : ''}
                    min="0"
                    value="${dato[campo.nombre] || 0}"
                    required>
            </div>
        `).join('');

        console.log('[editarRegistro] Modal llenado con datos');

        // Mostrar modal
        const modal = document.getElementById('modalDatos');
        if (modal) {
            modal.style.display = 'block';
            console.log('[editarRegistro] Modal abierto');
        }
    }

    // Función para cerrar modal
    window.cerrarModal = function() {
        const modal = document.getElementById('modalDatos');
        if (modal) {
            modal.style.display = 'none';
            console.log('[cerrarModal] Modal cerrado');
        }
    };

    // Función para guardar datos
    window.guardarRegistro = async function(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const datos = {
            id: formData.get('id_registro') || null,
            vigencia: formData.get('vigencia'),
            mes: formData.get('mes'),
            servicio: formData.get('servicio')
        };

        // Agregar campos específicos
        configActual.campos.forEach(campo => {
            datos[campo.nombre] = Number(formData.get(campo.nombre)) || 0;
        });

        console.log('[guardarRegistro] Datos:', datos);
        console.log('[guardarRegistro] Tabla:', configActual.tabla);

        try {
            const method = datos.id ? 'PUT' : 'POST';
            const endpoint = datos.id 
                ? `/api/ingreso-datos/${configActual.tabla}/${datos.id}`
                : `/api/ingreso-datos/${configActual.tabla}`;

            console.log('[guardarRegistro] Endpoint:', endpoint);
            console.log('[guardarRegistro] Method:', method);

            const response = await fetch(endpoint, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(datos)
            });

            console.log('[guardarRegistro] Response status:', response.status);

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('[guardarRegistro] Respuesta no JSON:', text.substring(0, 200));
                throw new Error('El servidor no devolvió JSON');
            }

            const result = await response.json();
            console.log('[guardarRegistro] Resultado:', result);

            if (!result.success) {
                throw new Error(result.message || 'Error al guardar');
            }

            alert(datos.id ? 'Registro actualizado correctamente' : 'Registro creado correctamente');
            window.cerrarModal();

            // Recargar datos
            document.getElementById('btn-consultar').click();

        } catch (error) {
            console.error('[guardarRegistro] Error:', error);
            alert('Error: ' + error.message);
        }
    };

    // Inicialización principal
    window.initIngresoDatos = function initIngresoDatos() {
        console.log('[initIngresoDatos] Iniciando...');

        const btnConsultar = document.getElementById('btn-consultar');
        const selectVariable = document.getElementById('variable');
        const selectVigencia = document.getElementById('vigencia');
        const selectServicio = document.getElementById('servicio');
        const selectPeriodo = document.getElementById('periodo');
        const container = document.getElementById('content-input');

        if (!btnConsultar || !selectVariable || !container) {
            console.warn('[initIngresoDatos] Elementos faltantes, reintentando...');
            setTimeout(initIngresoDatos, 100);
            return;
        }

        console.log('[initIngresoDatos] Elementos encontrados');

        // Listener para cambio de variable
        selectVariable.addEventListener('change', () => {
            const variable = selectVariable.value;
            const config = VARIABLES_CONFIG[variable];

            if (!config) return;

            // Limpiar y resetear selects
            selectServicio.value = '';
            selectPeriodo.value = '';
            selectServicio.disabled = false;
            selectPeriodo.disabled = false;

            // NUEVO: Forzar valores para soloAA
            if (config.soloAA) {
                selectServicio.value = 'aa';
                selectServicio.disabled = true; // Deshabilitar para que no se cambie
            }

            // Forzar valores para periodoAnual
            if (config.periodoAnual) {
                selectPeriodo.value = 'anual';
                selectPeriodo.disabled = true;
                console.log('[selectVariable] Periodo forzado a "anual"');
            }

            // noYear: deshabilitar opción "anual" (mantener habilitado el select)
            if (config.noYear) {
                const optionYear = selectPeriodo.querySelector('option[value="anual"]');
                if (optionYear) {
                    optionYear.disabled = true;
                    optionYear.style.display = 'none';
                }
                // Si estaba seleccionado "anual", limpiar
                if (selectPeriodo.value === 'anual') {
                    selectPeriodo.value = '';
                }
                console.log('[selectVariable] Opción "anual" deshabilitada');
            } else {
                // Rehabilitar "anual" si no tiene restricción
                const optionYear = selectPeriodo.querySelector('option[value="anual"]');
                if (optionYear) {
                    optionYear.disabled = false;
                    optionYear.style.display = '';
                }
            }

            // Forzar valores para soloAcueducto
            if (config.soloAcueducto) {
                selectServicio.value = 'acueducto';
                selectServicio.disabled = true;
            }

            // Forzar valores para soloAlcantarillado
            if (config.soloAlcantarillado) {
                selectServicio.value = 'alcantarillado';
                selectServicio.disabled = true;
            }

            console.log('[selectVariable] Configuración aplicada:', config);
        });

        // Event listener del botón consultar
        btnConsultar.addEventListener('click', async () => {
            console.log('[btnConsultar] Click detectado');

            const variable = selectVariable.value;
            const vigencia = selectVigencia.value;
            let servicio = selectServicio.value;
            const periodo = selectPeriodo.value;

            console.log('[btnConsultar] Valores:', { variable, vigencia, servicio, periodo });

            if (!variable || !vigencia || !periodo) {
                alert('Por favor complete Variable, Vigencia y Periodo');
                return;
            }

            const config = VARIABLES_CONFIG[variable];
            if (!config) {
                alert('Variable no configurada');
                return;
            }

            // CORRECCIÓN: Forzar servicio si soloAA es true
            if (config.soloAA) {
                servicio = 'aa';
            }

            // Validaciones de servicio
            if (config.soloAcueducto && servicio !== 'acueducto') {
                alert('Esta variable solo aplica para Acueducto');
                return;
            }

            if (config.soloAlcantarillado && servicio !== 'alcantarillado') {
                alert('Esta variable solo aplica para Alcantarillado');
                return;
            }

            if (config.soloAA && servicio !== 'aa') {
                alert('Esta variable solo aplica para Ambos servicios');
                return;
            }

            // Validar servicio si no es soloAA
            if (!config.soloAA && !servicio) {
                alert('Por favor seleccione un Servicio');
                return;
            }

            // periodo anual
            if (config.periodoAnual && periodo !== 'anual') { 
                alert('Esta variable solo admite periodo Anual'); 
                return; 
            }
            if (config.noYear && periodo === 'anual') { 
                alert('Esta variable no admite periodo Anual'); 
                return; 
            }
            if (config.noAA && servicio === 'aa') { 
                alert('Esta variable no admite servicio "Ambos"'); 
                return; 
            }

            try {
                // Cargar HTML de la vista según la variable
                container.innerHTML = '<p style="padding:20px;text-align:center;">Cargando...</p>';

                // Determinar qué vista cargar
                let vistaHTML = '/views/cliente/ingreso_datos/continuidad.html';
                
                if (variable === 'pqr') {
                    vistaHTML = '/views/cliente/ingreso_datos/pqr.html';
                } else if (variable === 'micromedicion') {
                    vistaHTML = '/views/cliente/ingreso_datos/micromedicion.html';
                } else if (variable === 'caudal') {
                    vistaHTML = '/views/cliente/ingreso_datos/caudal.html';
                } else if (variable === 'vertimiento') {
                    vistaHTML = '/views/cliente/ingreso_datos/vertimiento.html';
                } else if (variable === 'lodos') {
                    vistaHTML = '/views/cliente/ingreso_datos/lodos.html';
                } else if (variable === 'redacueducto') {
                    vistaHTML = '/views/cliente/ingreso_datos/redacueducto.html';
                } else if (variable === 'redalcantarillado') {
                    vistaHTML = '/views/cliente/ingreso_datos/redalcantarillado.html';
                } else if (variable === 'energia') {
                    vistaHTML = '/views/cliente/ingreso_datos/energia.html';
                } else if (variable === 'personal') {
                    vistaHTML = '/views/cliente/ingreso_datos/personal.html';
                } else if (variable === 'continuidad') {
                    vistaHTML = '/views/cliente/ingreso_datos/continuidad.html';
                }

                console.log('[btnConsultar] Cargando vista:', vistaHTML);

                const resHtml = await fetch(vistaHTML, {
                    credentials: 'same-origin',
                    cache: 'no-store'
                });

                if (!resHtml.ok) {
                    throw new Error('Error al cargar la vista');
                }

                const html = await resHtml.text();
                container.innerHTML = html;

                console.log('[btnConsultar] Vista cargada, configurando eventos...');

                // Configurar eventos del modal
                setTimeout(() => {
                    const btnNuevo = document.getElementById('btnNuevo');
                    const closeModal = document.getElementById('closeModal');
                    const btnCancelar = document.getElementById('btnCancelar');
                    const formDatos = document.getElementById('formDatos');
                    const modal = document.getElementById('modalDatos');

                    console.log('[btnConsultar] Verificando elementos del modal:', {
                        btnNuevo: !!btnNuevo,
                        closeModal: !!closeModal,
                        btnCancelar: !!btnCancelar,
                        formDatos: !!formDatos,
                        modal: !!modal
                    });

                    if (btnNuevo) {
                        btnNuevo.addEventListener('click', window.abrirModalNuevo);
                        console.log('[btnConsultar] Evento btnNuevo configurado');
                    }
                    if (closeModal) {
                        closeModal.addEventListener('click', window.cerrarModal);
                        console.log('[btnConsultar] Evento closeModal configurado');
                    }
                    if (btnCancelar) {
                        btnCancelar.addEventListener('click', window.cerrarModal);
                        console.log('[btnConsultar] Evento btnCancelar configurado');
                    }
                    if (formDatos) {
                        formDatos.addEventListener('submit', window.guardarRegistro);
                        console.log('[btnConsultar] Evento formDatos configurado');
                    }

                    // Cerrar modal al hacer clic fuera
                    if (modal) {
                        window.addEventListener('click', function(event) {
                            if (event.target === modal) {
                                window.cerrarModal();
                            }
                        });
                    }

                    console.log('[btnConsultar] Eventos del modal configurados');
                }, 100);

                // Consultar datos
                const params = new URLSearchParams({
                    vigencia: vigencia,
                    mes: periodo,
                    servicio: servicio  // ← SIEMPRE enviar servicio
                });

                const endpoint = variable === 'usuarios' 
                    ? `/api/suscriptores?${params.toString()}`
                    : `/api/ingreso-datos/${config.tabla}?${params.toString()}`;

                console.log('[btnConsultar] Consultando:', endpoint);

                const resData = await fetch(endpoint, {
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' }
                });

                const contentType = resData.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await resData.text();
                    console.error('[btnConsultar] Respuesta no JSON:', text.substring(0, 200));
                    throw new Error('El servidor no devolvió JSON');
                }

                if (!resData.ok) {
                    const errorData = await resData.json();
                    throw new Error(errorData.message || `Error HTTP ${resData.status}`);
                }

                const data = await resData.json();
                console.log('[btnConsultar] Datos recibidos:', data);

                if (!data.success) {
                    throw new Error(data.message || 'Error al consultar datos');
                }

                // Renderizar tabla
                const datos = variable === 'usuarios' ? data.suscriptores : data.datos;
                window.renderTabla(datos || [], config, vigencia, periodo, servicio);

            } catch (error) {
                console.error('[btnConsultar] Error:', error);
                container.innerHTML = `<div style="color:#c00;padding:20px;">Error: ${error.message}</div>`;
            }
        });

        console.log('[initIngresoDatos] Configuración completada');
    };

    window.dispatchEvent(new Event('ingresoDatos:ready'));
    console.log('[ingreso_datos.js] Evento emitido');
})();