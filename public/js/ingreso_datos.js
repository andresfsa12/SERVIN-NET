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
            columnas: ['ID', 'Vigencia', 'Mes', 'Servicio', 'kWh', 'Acciones'
            ]
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
        },

        financiero: {
        tabla: 'financiero',
        idColumn: 'id_financiero',
        titulo: 'Financiero',
        soloAA: true,
        periodoAnual: true,
        unico: true,
        formatearMiles: true,  // ← AGREGAR ESTA LÍNEA
        campos: [
            { nombre: 'cggs', label: 'CGGS (Costos y gastos para gestión social)', tipo: 'number', step: '0.01' },
            { nombre: 'goa_aa', label: 'Costos operativos y gastos administrativos AA', tipo: 'number', step: '0.01' },
            { nombre: 'g_acu', label: 'Gastos anuales del personal administrativo acueducto', tipo: 'number', step: '0.01' },
            { nombre: 'g_alc', label: 'Gastos anuales del personal administrativo alcantarillado', tipo: 'number', step: '0.01' },
            { nombre: 'c_operativos', label: 'Costos Operativos', tipo: 'number', step: '0.01' },
            { nombre: 'activos_c', label: 'Activos Corrientes', tipo: 'number', step: '0.01' },
            { nombre: 'pasivos_c', label: 'Pasivos Corrientes', tipo: 'number', step: '0.01' },
            { nombre: 'poscf', label: 'Pasivos operativos sin costos financieros', tipo: 'number', step: '0.01' },
            { nombre: 'pasivo_t', label: 'Pasivo Total', tipo: 'number', step: '0.01' },
            { nombre: 'patrimonio', label: 'Patrimonio', tipo: 'number', step: '0.01' },
            { nombre: 'wacc', label: 'WACC', tipo: 'number', step: '0.0001' },
            { nombre: 'tasa_impuestos', label: 'Tasa de Impuestos', tipo: 'number', step: '0.0001' },
            { nombre: 'cxc', label: 'Cuentas por Cobrar por Servicios públicos', tipo: 'number', step: '0.01' },
            { nombre: 'recaudo_aaa', label: 'Recaudo por Acueducto, Alcantarillado y Aseo', tipo: 'number', step: '0.01' },
            { nombre: 'ingresos', label: 'Ingresos de actividades ordinarias', tipo: 'number', step: '0.01' },
            { nombre: 'utilidad', label: 'Utilidad Operacional', tipo: 'number', step: '0.01' }
        ],
        columnas: [
            'ID','Vigencia','Periodo','Servicio',
            'CGGS','GOA AA','G. Adm. Acu','G. Adm. Alc',
            'Costos Oper','Activos C','Pasivos C','POSCF','Pasivo T',
            'Patrimonio','WACC','Tasa Imp.','CxC','Recaudo AAA','Ingresos','Utilidad','Acciones'
        ]
    },
        eventos_climaticos: {
            tabla: 'eventos_climaticos',
            idColumn: 'id_eventos_c',
            titulo: 'Eventos Climáticos',
            soloAA: true,
            periodoAnual: true,
            unico: true,
            campos: [
                { nombre: 'eventos', label: 'Número de Eventos', tipo: 'number', min: '0' },
                { nombre: 'horas_eventos', label: 'Horas de Eventos', tipo: 'number', min: '0' },
                { nombre: 'suscriptores_afectados_e', label: 'Suscriptores Afectados', tipo: 'number', min: '0' }
            ],
            columnas: ['ID','Vigencia','Periodo','Servicio','Eventos','Horas','Suscriptores Afectados','Acciones']
        },
        poir: {
            tabla: 'poir',
            idColumn: 'id_poir',
            titulo: 'POIR',
            soloAA: true,
            periodoAnual: true,
            unico: true,
            campos: [
                { nombre: 'reportado_sui', label: 'Reportado SUI', tipo: 'select', opciones: [
                    { value: 'SI', label: 'SI' },
                    { value: 'NO', label: 'NO' }
                ]},
                { nombre: 'inv_proy_acu', label: 'Inversión Proyectada Acueducto', tipo: 'number', step: '0.01', min: '0' },
                { nombre: 'inv_ejec_acu', label: 'Inversión Ejecutada Acueducto', tipo: 'number', step: '0.01', min: '0' },
                { nombre: 'inv_proy_alc', label: 'Inversión Proyectada Alcantarillado', tipo: 'number', step: '0.01', min: '0' },
                { nombre: 'inv_ejec_alc', label: 'Inversión Ejecutada Alcantarillado', tipo: 'number', step: '0.01', min: '0' }
            ],
            columnas: [
                'ID','Vigencia','Periodo','Servicio',
                'Reportado SUI','Inv. Proy. Acu','Inv. Ejec. Acu','Inv. Proy. Alc','Inv. Ejec. Alc','% Ejec. Acu','% Ejec. Alc','Acciones'
            ]
        },
        tarifa_acu: {
            tabla: 'tarifa_acu',
            idColumn: 'id_tarifas_acu',
            titulo: 'Tarifa Acueducto',
            soloAcueducto: true,      // Solo servicio acueducto
            periodoAnual: true,       // Solo periodo Anual
            unico: true,              // Un solo registro por vigencia/periodo/usuario
            campos: [
                { nombre: 'tarifa_cf_aprob', label: 'Tarifa Cargo Fijo Aprobada', tipo: 'number', step: '0.01' },
                { nombre: 'tarifa_cf_fact', label: 'Tarifa Cargo Fijo Facturada', tipo: 'number', step: '0.01' },
                { nombre: 'tarifa_cc_aprob', label: 'Tarifa Cargo Consumo Aprobada', tipo: 'number', step: '0.01' },
                { nombre: 'tarifa_cc_fact', label: 'Tarifa Cargo Consumo Facturada', tipo: 'number', step: '0.01' }
            ],
            columnas: ['ID','Vigencia','Periodo','Servicio','CF Aprob','CF Fact','CC Aprob','CC Fact','Acciones']
        },
        tarifa_alc: {
            tabla: 'tarifa_alc',
            idColumn: 'id_tarifas_alc',
            titulo: 'Tarifa Alcantarillado',
            soloAlcantarillado: true,      
            periodoAnual: true,       // soloYear: true
            unico: true,
            campos: [
                { nombre: 'tarifa_cf_aprob', label: 'Tarifa Cargo Fijo Aprobada', tipo: 'number', step: '0.01' },
                { nombre: 'tarifa_cf_fact', label: 'Tarifa Cargo Fijo Facturada', tipo: 'number', step: '0.01' },
                { nombre: 'tarifa_cc_aprob', label: 'Tarifa Cargo Consumo Aprobada', tipo: 'number', step: '0.01' },
                { nombre: 'tarifa_cc_fact', label: 'Tarifa Cargo Consumo Facturada', tipo: 'number', step: '0.01' }
            ],
            columnas: ['ID','Vigencia','Periodo','Servicio','CF Aprob','CF Fact','CC Aprob','CC Fact','Acciones']
        }
    };

    let datosActuales = [];
    let configActual = null;
    let contextActual = {};

    // Helper para formatear miles
    const formatMiles = (v, dec = 2) => {
        if (v === null || v === undefined || v === '') return '0';
        const n = Number(v);
        if (Number.isNaN(n)) return '0';
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: dec,
            maximumFractionDigits: dec
        }).format(n);
    };

    // Función para renderizar tabla
    window.renderTabla = function renderTabla(datos, config, vigencia, periodo, servicio) {
        console.log('[renderTabla] Datos:', datos);
        console.log('[renderTabla] Config:', config);

        const thead = document.getElementById('theadDatos');
        const tbody = document.getElementById('tbodyDatos');
        const btnNuevo = document.getElementById('btnNuevo');

        if (!thead || !tbody) {
            console.error('[renderTabla] Elementos de tabla no encontrados');
            return;
        }

        // Guardar contexto global - IMPORTANTE
        window.currentConfig = config;
        window.currentVigencia = vigencia;
        window.currentPeriodo = periodo;
        window.currentServicio = servicio;

        console.log('[renderTabla] Context guardado:', {
            config: !!window.currentConfig,
            vigencia: window.currentVigencia,
            periodo: window.currentPeriodo,
            servicio: window.currentServicio
        });

        // TABLA FINANCIERO: Formato vertical (transpuesto)
        if (config.tabla === 'financiero') {
            // Encabezado: una columna por registro (sin columna de acciones)
            thead.innerHTML = `
                <tr>
                    <th>Concepto</th>
                    ${datos.map((d, idx) => `<th>Registro ${idx + 1}</th>`).join('')}
                </tr>
            `;

            if (!datos || datos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="2" class="no-data">No hay datos</td></tr>`;
                if (btnNuevo) {
                    btnNuevo.disabled = false;
                    btnNuevo.title = '';
                }
                return;
            }

            // Verificar si es tabla única
            if (config.unico && datos.length > 0 && btnNuevo) {
                btnNuevo.disabled = true;
                btnNuevo.title = 'Ya existe un registro. Use Editar.';
            } else if (btnNuevo) {
                btnNuevo.disabled = false;
                btnNuevo.title = '';
            }

            // Construir filas: una por campo
            const filas = [];

            // Fila: ID
            filas.push(`
                <tr>
                    <td class="fin-label"><strong>ID</strong></td>
                    ${datos.map(d => `<td class="num">${d[config.idColumn]}</td>`).join('')}
                </tr>
            `);

            // Fila: Vigencia
            filas.push(`
                <tr>
                    <td class="fin-label"><strong>Vigencia</strong></td>
                    ${datos.map(d => `<td>${d.id_vigenciaFK}</td>`).join('')}
                </tr>
            `);

            // Fila: Periodo
            filas.push(`
                <tr>
                    <td class="fin-label"><strong>Periodo</strong></td>
                    ${datos.map(d => `<td>${d.periodo}</td>`).join('')}
                </tr>
            `);

            // Fila: Servicio
            filas.push(`
                <tr>
                    <td class="fin-label"><strong>Servicio</strong></td>
                    ${datos.map(d => `<td>${d.servicio}</td>`).join('')}
                </tr>
            `);

            // Filas: Campos dinámicos
            config.campos.forEach(campo => {
                const celdas = datos.map(d => {
                    const valor = d[campo.nombre];
                    const debeFormatear = config.formatearMiles || (campo.step && parseFloat(campo.step) < 1);
                    const mostrar = debeFormatear
                        ? formatMiles(valor, campo.step === '0.0001' ? 4 : (campo.step === '0.01' ? 2 : 0))
                        : (valor ?? 0);
                    return `<td class="num">${mostrar}</td>`;
                }).join('');

                filas.push(`
                    <tr>
                        <td class="fin-label"><strong>${campo.label}</strong></td>
                        ${celdas}
                    </tr>
                `);
            });

            // Fila: Acciones (al final de cada COLUMNA de datos)
            filas.push(`
                <tr class="fin-actions-row">
                    <td class="fin-label"><strong>Acciones</strong></td>
                    ${datos.map(d => `
                        <td>
                            <div class="fin-actions-vertical">
                                <button class="btn-action btn-edit" data-action="edit" data-id="${d[config.idColumn]}">Editar</button>
                                <button class="btn-action btn-delete" data-action="delete" data-id="${d[config.idColumn]}">Eliminar</button>
                            </div>
                        </td>
                    `).join('')}
                </tr>
            `);

            tbody.innerHTML = filas.join('');

            // Event delegation
            tbody.addEventListener('click', function(e) {
                const btn = e.target.closest('.btn-action');
                if (!btn) return;
                
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                
                console.log('[tbody click] Action:', action, 'ID:', id);
                
                if (action === 'edit') {
                    window.editarRegistro(id);
                } else if (action === 'delete') {
                    window.eliminarRegistro(id);
                }
            });

            console.log('[renderTabla] Tabla Financiero (vertical) renderizada');
            return; // Salir aquí
        }

        // RESTO DE TABLAS: Formato horizontal normal
        const headers = config.columnas;

        // Renderizar encabezados
        thead.innerHTML = `<tr>${headers.map(c => `<th>${c}</th>`).join('')}</tr>`;

        // Renderizar datos
        if (!datos || datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${headers.length}" class="no-data">No hay datos</td></tr>`;
            if (btnNuevo) {
                btnNuevo.disabled = false;
                btnNuevo.title = '';
            }
            return;
        }

        // Verificar si es tabla única
        if (config.unico && datos.length > 0) {
            if (btnNuevo) {
                btnNuevo.disabled = true;
                btnNuevo.title = 'Ya existe un registro. Use Editar.';
            }
        } else {
            if (btnNuevo) {
                btnNuevo.disabled = false;
                btnNuevo.title = '';
            }
        }

        tbody.innerHTML = datos.map(d => {
            let colIndex = 0;
            const td = (val, cls = '') => {
                const h = headers[colIndex++] || '';
                return `<td class="${cls}" data-th="${h}">${val}</td>`;
            };

            const celdas = [];
            celdas.push(td(d[config.idColumn]));

            // Vigencia y periodo/mes
            if (config.tabla === 'personal' || config.tabla === 'eventos_climaticos' || config.tabla === 'poir') {
                celdas.push(td(d.id_vigenciaFK));
                celdas.push(td(d.periodo));
            } else {
                celdas.push(td(d.id_vigenciaFK));
                // --- Ajuste en renderTabla para evitar "undefined" en Periodo ---
                // Reemplazar donde agregas la celda de periodo/mes
                const periodoValor = (d.periodo ?? d.mes ?? '');
                celdas.push(`<td>${periodoValor}</td>`);
            }

            celdas.push(td(d.servicio));

            // Campos dinámicos
            config.campos.forEach(campo => {
                const valor = d[campo.nombre];
                const debeFormatear = config.formatearMiles || (campo.step && parseFloat(campo.step) < 1);
                const mostrar = debeFormatear
                    ? formatMiles(valor, campo.step === '0.0001' ? 4 : (campo.step === '0.01' ? 2 : 0))
                    : (valor ?? 0);
                const cls = campo.tipo === 'number' ? 'num' : '';
                celdas.push(td(mostrar, cls));
            });

            // Porcentajes POIR
            if (config.tabla === 'poir') {
                const porcAcu = d.inv_proy_acu > 0 ? ((d.inv_ejec_acu / d.inv_proy_acu) * 100).toFixed(2) + '%' : '0%';
                const porcAlc = d.inv_proy_alc > 0 ? ((d.inv_ejec_alc / d.inv_proy_alc) * 100).toFixed(2) + '%' : '0%';
                celdas.push(td(porcAcu, 'num'));
                celdas.push(td(porcAlc, 'num')); // ← corregido (antes: celds.push)
            }

            // Acciones
            celdas.push(td(`
                <div>
                    <button class="btn-action btn-edit" data-action="edit" data-id="${d[config.idColumn]}">Editar</button>
                    <button class="btn-action btn-delete" data-action="delete" data-id="${d[config.idColumn]}">Eliminar</button>
                </div>
            `));

            return `<tr>${celdas.join('')}</tr>`;
        }).join('');

        // Event delegation
        const oldTbody = tbody.cloneNode(true);
        tbody.parentNode.replaceChild(oldTbody, tbody);
        
        oldTbody.addEventListener('click', function(e) {
            const btn = e.target.closest('.btn-action');
            if (!btn) return;
            
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            
            console.log('[tbody click] Action:', action, 'ID:', id);
            
            if (action === 'edit') {
                window.editarRegistro(id);
            } else if (action === 'delete') {
                window.eliminarRegistro(id);
            }
        });

        console.log('[renderTabla] Tabla renderizada con', datos.length, 'registros');
    };

    // Función para abrir modal nuevo registro
    window.abrirModalNuevo = function abrirModalNuevo() {
        console.log('[abrirModalNuevo] Iniciando...');
        console.log('[abrirModalNuevo] currentConfig disponible:', !!window.currentConfig);
        
        if (!window.currentConfig) {
            console.error('[abrirModalNuevo] currentConfig es null');
            alert('Error: No hay configuración cargada. Realice primero una consulta.');
            return;
        }

        const modalTitle = document.getElementById('modalTitle');
        const idRegistro = document.getElementById('id_registro');
        const modalVigencia = document.getElementById('modal_vigencia');
        const modalMes = document.getElementById('modal_mes');
        const modalServicio = document.getElementById('modal_servicio');
        const camposDinamicos = document.getElementById('campos-dinamicos');
        const formDatos = document.getElementById('formDatos');

        if (!modalTitle || !idRegistro || !modalVigencia || !modalMes || !modalServicio || !camposDinamicos) {
            console.error('[abrirModalNuevo] Elementos del modal no encontrados');
            return;
        }

        // Limpiar
        modalTitle.textContent = 'Nuevo Registro';
        idRegistro.value = '';
        modalVigencia.value = window.currentVigencia || '';
        modalMes.value = window.currentPeriodo || '';
        modalServicio.value = window.currentServicio || '';
        
        // IMPORTANTE: Cambiar el atributo 'name' para que coincida con FormData
        modalVigencia.name = 'vigencia';
        modalMes.name = 'mes';
        modalServicio.name = 'servicio';
        
        camposDinamicos.innerHTML = '';

        console.log('[abrirModalNuevo] Valores asignados:', {
            vigencia: modalVigencia.value,
            mes: modalMes.value,
            servicio: modalServicio.value
        });

        // Generar campos dinámicos
        const config = window.currentConfig;
        if (config && config.campos) {  // ← corregido
            config.campos.forEach(campo => {
                const div = document.createElement('div');
                div.className = 'form-group';
                const label = document.createElement('label');
                label.textContent = campo.label;
                label.setAttribute('for', campo.nombre);
                div.appendChild(label);
                let input;
                if (campo.tipo === 'select' && campo.opciones) {
                    input = document.createElement('select');
                    input.id = campo.nombre;
                    input.name = campo.nombre;
                    input.required = true;
                    const optionPlaceholder = document.createElement('option');
                    optionPlaceholder.value = '';
                    optionPlaceholder.textContent = 'Seleccione...';
                    optionPlaceholder.disabled = true;
                    optionPlaceholder.selected = true;
                    input.appendChild(optionPlaceholder);
                    campo.opciones.forEach(opcion => {
                        const option = document.createElement('option');
                        option.value = opcion.value;
                        option.textContent = opcion.label;
                        input.appendChild(option);
                    });
                } else {
                    input = document.createElement('input');
                    input.type = campo.tipo || 'text';
                    input.id = campo.nombre;
                    input.name = campo.nombre;
                    input.required = true;
                    if (campo.min !== undefined) input.min = campo.min;
                    if (campo.max !== undefined) input.max = campo.max;
                    if (campo.step !== undefined) input.step = campo.step;
                    if (campo.placeholder) input.placeholder = campo.placeholder;
                }
                div.appendChild(input);
                camposDinamicos.appendChild(div);
            });
        }

        // Resetear y mostrar modal
        if (formDatos) {
            formDatos.reset();
            // Re-asignar valores después del reset
            modalVigencia.value = window.currentVigencia || '';
            modalMes.value = window.currentPeriodo || '';
            modalServicio.value = window.currentServicio || '';
        }

        const modal = document.getElementById('modalDatos');
        if (modal) {
            modal.style.display = 'block';
            console.log('[abrirModalNuevo] Modal mostrado');
        }
    }; // ← VERIFICAR que este punto y coma esté presente

    // Función para guardar datos
    window.guardarRegistro = async function(e) {
        e.preventDefault();
        
        console.log('[guardarRegistro] Iniciando...');
        console.log('[guardarRegistro] currentConfig disponible:', !!window.currentConfig);

        // Verificar que existe la configuración
        if (!window.currentConfig) {
            console.error('[guardarRegistro] currentConfig es null');
            alert('Error: No hay configuración cargada. Realice primero una consulta.');
            return;
        }

        const config = window.currentConfig;
        console.log('[guardarRegistro] Config:', config);

        const formData = new FormData(e.target);
        
        // CORREGIR: Obtener valores de los campos correctos
        const datos = {
            id: formData.get('id_registro') || null,
            vigencia: window.currentVigencia || formData.get('vigencia'),  // Usar variable global
            mes: window.currentPeriodo || formData.get('mes'),             // Usar variable global
            servicio: window.currentServicio || formData.get('servicio')   // Usar variable global
        };

        // Log para debug
        console.log('[guardarRegistro] Vigencia capturada:', datos.vigencia);
        console.log('[guardarRegistro] Mes capturado:', datos.mes);
        console.log('[guardarRegistro] Servicio capturado:', datos.servicio);

        // Validar que los campos requeridos no estén vacíos
        if (!datos.vigencia || !datos.mes || !datos.servicio) {
            alert('Error: Faltan datos requeridos (vigencia, periodo o servicio)');
            console.error('[guardarRegistro] Datos faltantes:', datos);
            return;
        }

        // Agregar campos específicos
        config.campos.forEach(campo => {
            const valor = formData.get(campo.nombre);
            console.log(`[guardarRegistro] Campo ${campo.nombre}:`, valor);
            
            // No convertir a número si es select
            if (campo.tipo === 'select') {
                datos[campo.nombre] = valor;
            } else if (campo.tipo === 'number') {
                datos[campo.nombre] = valor ? Number(valor) : 0;
            } else {
                datos[campo.nombre] = valor || '';
            }
        });

        console.log('[guardarRegistro] Datos finales:', datos);
        console.log('[guardarRegistro] Tabla:', config.tabla);

        try {
            const method = datos.id ? 'PUT' : 'POST';
            const endpoint = datos.id 
                ? `/api/ingreso-datos/${config.tabla}/${datos.id}`
                : `/api/ingreso-datos/${config.tabla}`;

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
            const btnConsultar = document.getElementById('btn-consultar');
            if (btnConsultar) {
                btnConsultar.click();
            }

        } catch (error) {
            console.error('[guardarRegistro] Error:', error);
            alert('Error: ' + error.message);
        }
    };

    // Función para editar registro
    window.editarRegistro = async function(id) {
        // CORRECCIÓN: Usar window.currentConfig
        const config = window.currentConfig;
        
        if (!config) {
            console.error('[editarRegistro] Config no disponible');
            alert('Error: Configuración no disponible');
            return;
        }

        // Buscar el registro en la tabla actual
        const tbody = document.getElementById('tbodyDatos');
        if (!tbody) {
            alert('Error: Tabla no encontrada');
            return;
        }

        // Obtener datos del registro desde el endpoint
        try {
            const vigencia = window.currentVigencia;
            const periodo = window.currentPeriodo;
            const servicio = window.currentServicio;

            const params = new URLSearchParams({
                vigencia: vigencia,
                mes: periodo,
                servicio: servicio
            });

            const endpoint = `/api/ingreso-datos/${config.tabla}?${params.toString()}`;
            const response = await fetch(endpoint, {
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Error al obtener datos');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Error al obtener datos');
            }

            const dato = result.datos.find(d => d[config.idColumn] == id);
            if (!dato) {
                alert('Registro no encontrado');
                return;
            }

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

            modalTitle.textContent = `Editar ${config.titulo}`;
            idRegistro.value = id;
            modalVigencia.value = vigencia;
            modalMes.value = periodo;
            modalServicio.value = servicio || 'N/A';

            // Limpiar campos dinámicos
            camposDinamicos.innerHTML = '';

            // Llenar campos dinámicos con valores
            config.campos.forEach(campo => {
                const div = document.createElement('div');
                div.className = 'form-group';
                
                const label = document.createElement('label');
                label.textContent = campo.label;
                label.setAttribute('for', campo.nombre);
                div.appendChild(label);

                let input;
                
                // Manejo de campo tipo select
                if (campo.tipo === 'select' && campo.opciones) {
                    input = document.createElement('select');
                    input.id = campo.nombre;
                    input.name = campo.nombre;
                    input.required = true;
                    
                    campo.opciones.forEach(opcion => {
                        const option = document.createElement('option');
                        option.value = opcion.value;
                        option.textContent = opcion.label;
                        if (dato[campo.nombre] === opcion.value) {
                            option.selected = true;
                        }
                        input.appendChild(option);
                    });
                } else {
                    // Campos normales
                    input = document.createElement('input');
                    input.type = campo.tipo || 'text';
                    input.id = campo.nombre;
                    input.name = campo.nombre;
                    input.required = true;
                    input.value = dato[campo.nombre] || 0;
                    
                    if (campo.min !== undefined) input.min = campo.min;
                    if (campo.max !== undefined) input.max = campo.max;
                    if (campo.step !== undefined) input.step = campo.step;
                }
                
                div.appendChild(input);
                camposDinamicos.appendChild(div);
            });

            console.log('[editarRegistro] Modal llenado con datos');

            // Mostrar modal
            const modal = document.getElementById('modalDatos');
            if (modal) {
                modal.style.display = 'block';
                console.log('[editarRegistro] Modal abierto');
            }

        } catch (error) {
            console.error('[editarRegistro] Error:', error);
            alert('Error al cargar datos: ' + error.message);
        }
    };

    // Función para cerrar modal
    window.cerrarModal = function() {
        const modal = document.getElementById('modalDatos');
        if (modal) {
            modal.style.display = 'none';
            console.log('[cerrarModal] Modal cerrado');
        }
    };

    // Función para eliminar registro
    window.eliminarRegistro = async function(id) {
        console.log('[eliminarRegistro] ID:', id);
        console.log('[eliminarRegistro] currentConfig disponible:', !!window.currentConfig);

        if (!window.currentConfig) {
            console.error('[eliminarRegistro] currentConfig es null');
            alert('Error: No hay configuración cargada');
            return;
        }

        if (!confirm('¿Está seguro de eliminar este registro?')) {
            console.log('[eliminarRegistro] Eliminación cancelada por usuario');
            return;
        }

        const config = window.currentConfig;

        try {
            const endpoint = `/api/ingreso-datos/${config.tabla}/${id}`;
            console.log('[eliminarRegistro] Endpoint:', endpoint);

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });

            console.log('[eliminarRegistro] Response status:', response.status);

            // Verificar tipo de contenido
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('[eliminarRegistro] Respuesta no JSON:', text.substring(0, 200));
                throw new Error('El servidor no devolvió JSON. Posible error 404 - ruta no encontrada.');
            }

            const result = await response.json();
            console.log('[eliminarRegistro] Resultado:', result);

            if (!result.success) {
                throw new Error(result.message || 'Error al eliminar');
            }

            alert('Registro eliminado correctamente');

            // Recargar datos
            const btnConsultar = document.getElementById('btn-consultar');
            if (btnConsultar) {
                btnConsultar.click();
            }

        } catch (error) {
            console.error('[eliminarRegistro] Error:', error);
            alert('Error al eliminar: ' + error.message);
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
                selectPeriodo.value = 'Anual';
                selectPeriodo.disabled = true;
                console.log('[selectVariable] Periodo forzado a "Anual"');
            }

            // noYear: deshabilitar opción "Anual"
            if (config.noYear) {
                const optionYear = selectPeriodo.querySelector('option[value="Anual"]');
                if (optionYear) {
                    optionYear.disabled = true;
                    optionYear.style.display = 'none';
                }
                // Si estaba seleccionado "Anual", limpiar
                if (selectPeriodo.value === 'Anual') {
                    selectPeriodo.value = '';
                }
                console.log('[selectVariable] Opción "Anual" deshabilitada');
            } else {
                // Rehabilitar "Anual" si no tiene restricción
                const optionYear = selectPeriodo.querySelector('option[value="Anual"]');
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
            if (config.periodoAnual && periodo !== 'Anual') { 
                alert('Esta variable solo admite periodo Anual'); 
                return; 
            }
            if (config.noYear && periodo === 'Anual') { 
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
                } else if (variable === 'financiero') {
                    vistaHTML = '/views/cliente/ingreso_datos/financiero.html';
                } else if (variable === 'eventos_climaticos') {
                    vistaHTML = '/views/cliente/ingreso_datos/eventos_climaticos.html';
                } else if (variable === 'poir') {
                    vistaHTML = '/views/cliente/ingreso_datos/poir.html';
                } else if (variable === 'continuidad') {
                    vistaHTML = '/views/cliente/ingreso_datos/continuidad.html';
                } else if (variable === 'tarifa_acu') {
                    vistaHTML = '/views/cliente/ingreso_datos/tarifa_acu.html';
                } else if (variable === 'tarifa_alc') {
                    vistaHTML = '/views/cliente/ingreso_datos/tarifa_alc.html';
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

    // ELIMINAR ESTAS LÍNEAS (están causando el error):
    // Event delegation para botones de acción
    // tbody.addEventListener('click', function(e) {
    //     const btn = e.target.closest('.btn-action');
    //     if (!btn) return;
    //     
    //     const action = btn.dataset.action;
    //     const id = btn.dataset.id;
    //     
    //     if (action === 'edit') {
    //         window.editarRegistro(id);
    //     } else if (action === 'delete') {
    //         window.eliminarRegistro(id);
    //     }
    // });
})();