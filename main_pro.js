/**
 * EntropySolver PRO - JavaScript Principal
 * Solucionador Avanzado con Balance y Generación de Entropía
 */

// ============================================================================
// CONSTANTES Y VARIABLES GLOBALES
// ============================================================================

const CONSTANTES_GASES_PRO = {
    aire: { nombre: 'Aire', R: 0.287, cp: 1.005, cv: 0.718, gamma: 1.4 },
    nitrogeno: { nombre: 'Nitrógeno (N₂)', R: 0.2968, cp: 1.039, cv: 0.743, gamma: 1.40 },
    oxigeno: { nombre: 'Oxígeno (O₂)', R: 0.2598, cp: 0.918, cv: 0.658, gamma: 1.40 },
    argon: { nombre: 'Argón (Ar)', R: 0.2081, cp: 0.520, cv: 0.312, gamma: 1.67 },
    hidrogeno: { nombre: 'Hidrógeno (H₂)', R: 4.124, cp: 14.307, cv: 10.183, gamma: 1.405 },
    helio: { nombre: 'Helio (He)', R: 2.077, cp: 5.193, cv: 3.116, gamma: 1.667 },
    co2: { nombre: 'Dióxido de Carbono (CO₂)', R: 0.1889, cp: 0.846, cv: 0.657, gamma: 1.29 },
    h2o: { nombre: 'Vapor de Agua (H₂O)', R: 0.4615, cp: 1.872, cv: 1.410, gamma: 1.327 }
};

let ultimoResultado = null;

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    cambiarModoCalculo();
    actualizarConstantesPro();
});

// ============================================================================
// NAVEGACIÓN Y UI
// ============================================================================

function cambiarSeccion(seccion) {
    document.querySelectorAll('.seccion-pro').forEach(el => {
        el.classList.remove('activa');
    });
    
    const seccionEl = document.getElementById(seccion);
    if (seccionEl) {
        seccionEl.classList.add('activa');
        window.scrollTo(0, 0);
    }
}

function cambiarModoCalculo() {
    const modo = document.getElementById('modo_calculo').value;
    const contenedor = document.getElementById('campos-dinamicos-pro');
    contenedor.innerHTML = '';

    switch (modo) {
        case 'delta_s_tv':
            contenedor.innerHTML = `
                <div class="grupo-control-pro">
                    <label>T₁ (K):</label>
                    <input type="number" id="T1-pro" value="300" step="1" min="1">
                </div>
                <div class="grupo-control-pro">
                    <label>T₂ (K):</label>
                    <input type="number" id="T2-pro" value="500" step="1" min="1">
                </div>
                <div class="grupo-control-pro">
                    <label>v₁ (m³/kg):</label>
                    <input type="number" id="v1-pro" value="0.5" step="0.01" min="0.001">
                </div>
                <div class="grupo-control-pro">
                    <label>v₂ (m³/kg):</label>
                    <input type="number" id="v2-pro" value="1.0" step="0.01" min="0.001">
                </div>
            `;
            break;

        case 'delta_s_tp':
            contenedor.innerHTML = `
                <div class="grupo-control-pro">
                    <label>T₁ (K):</label>
                    <input type="number" id="T1-pro" value="300" step="1" min="1">
                </div>
                <div class="grupo-control-pro">
                    <label>T₂ (K):</label>
                    <input type="number" id="T2-pro" value="500" step="1" min="1">
                </div>
                <div class="grupo-control-pro">
                    <label>P₁ (kPa):</label>
                    <input type="number" id="P1-pro" value="100" step="1" min="0.1">
                </div>
                <div class="grupo-control-pro">
                    <label>P₂ (kPa):</label>
                    <input type="number" id="P2-pro" value="200" step="1" min="0.1">
                </div>
            `;
            break;

        case 'procesos_especiales':
            contenedor.innerHTML = `
                <div class="grupo-control-pro">
                    <label>Tipo de Proceso:</label>
                    <select id="tipo-especial">
                        <option value="isotermico">Isotérmico</option>
                        <option value="isobarico">Isobárico</option>
                        <option value="isocoro">Isocórico</option>
                        <option value="adiabatico">Adiabático Reversible</option>
                    </select>
                </div>
                <div id="campos-especiales"></div>
            `;
            document.getElementById('tipo-especial').addEventListener('change', actualizarCamposEspeciales);
            actualizarCamposEspeciales();
            break;

        case 'balance_entropia':
            contenedor.innerHTML = `
                <div style="background: rgba(76, 175, 80, 0.1); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                    <p style="color: #4CAF50; font-weight: 600;">
                        ΔS = Q/T + Sgen
                    </p>
                </div>
                <div class="grupo-control-pro">
                    <label>ΔS del Sistema (kJ/K):</label>
                    <input type="number" id="delta_S-pro" value="0" step="0.001">
                </div>
                <div class="grupo-control-pro">
                    <label>Q Transferido (kJ):</label>
                    <input type="number" id="Q-pro" value="100" step="1">
                </div>
                <div class="grupo-control-pro">
                    <label>T Ambiente (K):</label>
                    <input type="number" id="T_amb-pro" value="300" step="1" min="1">
                </div>
            `;
            break;

        case 'generacion_entropia':
            contenedor.innerHTML = `
                <div style="background: rgba(244, 67, 54, 0.1); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                    <p style="color: #FF9800; font-weight: 600;">
                        Sgen = ΔS - Q/T
                    </p>
                </div>
                <div class="grupo-control-pro">
                    <label>ΔS del Sistema (kJ/K):</label>
                    <input type="number" id="delta_S_gen-pro" value="0.5" step="0.001">
                </div>
                <div class="grupo-control-pro">
                    <label>Q Transferido (kJ):</label>
                    <input type="number" id="Q_gen-pro" value="100" step="1">
                </div>
                <div class="grupo-control-pro">
                    <label>T Ambiente (K):</label>
                    <input type="number" id="T_amb_gen-pro" value="300" step="1" min="1">
                </div>
            `;
            break;
    }
}

function actualizarCamposEspeciales() {
    const tipo = document.getElementById('tipo-especial').value;
    const contenedor = document.getElementById('campos-especiales');

    if (tipo === 'isotermico') {
        contenedor.innerHTML = `
            <div class="grupo-control-pro">
                <label>T (K):</label>
                <input type="number" id="T-esp" value="300" step="1" min="1">
            </div>
            <div class="grupo-control-pro">
                <label>v₁ (m³/kg):</label>
                <input type="number" id="v1-esp" value="0.5" step="0.01">
            </div>
            <div class="grupo-control-pro">
                <label>v₂ (m³/kg):</label>
                <input type="number" id="v2-esp" value="1.0" step="0.01">
            </div>
        `;
    } else if (tipo === 'isobarico') {
        contenedor.innerHTML = `
            <div class="grupo-control-pro">
                <label>P (kPa):</label>
                <input type="number" id="P-esp" value="100" step="1">
            </div>
            <div class="grupo-control-pro">
                <label>T₁ (K):</label>
                <input type="number" id="T1-esp" value="300" step="1">
            </div>
            <div class="grupo-control-pro">
                <label>T₂ (K):</label>
                <input type="number" id="T2-esp" value="500" step="1">
            </div>
        `;
    }
}

function actualizarConstantesPro() {
    const gas = document.getElementById('gas-pro').value;
    const constantes = CONSTANTES_GASES_PRO[gas];

    if (constantes) {
        document.getElementById('const_R-pro').textContent = constantes.R.toFixed(4);
        document.getElementById('const_cp-pro').textContent = constantes.cp.toFixed(3);
        document.getElementById('const_cv-pro').textContent = constantes.cv.toFixed(3);
        document.getElementById('const_gamma-pro').textContent = constantes.gamma.toFixed(2);
    }
}

// ============================================================================
// CÁLCULOS
// ============================================================================

async function realizarCalculoPro() {
    const modo = document.getElementById('modo_calculo').value;
    const gas = document.getElementById('gas-pro').value;
    const masa = parseFloat(document.getElementById('masa-pro').value);
    const errorDiv = document.getElementById('mensaje-error-pro');

    errorDiv.style.display = 'none';

    try {
        const datos = { gas, masa, tipo_calculo: modo };

        if (modo === 'delta_s_tv') {
            datos.T1 = parseFloat(document.getElementById('T1-pro').value);
            datos.T2 = parseFloat(document.getElementById('T2-pro').value);
            datos.v1 = parseFloat(document.getElementById('v1-pro').value);
            datos.v2 = parseFloat(document.getElementById('v2-pro').value);

            if (datos.T1 <= 0 || datos.T2 <= 0) {
                throw new Error('Las temperaturas deben ser positivas');
            }
        } else if (modo === 'delta_s_tp') {
            datos.T1 = parseFloat(document.getElementById('T1-pro').value);
            datos.T2 = parseFloat(document.getElementById('T2-pro').value);
            datos.P1 = parseFloat(document.getElementById('P1-pro').value);
            datos.P2 = parseFloat(document.getElementById('P2-pro').value);
        } else if (modo === 'balance_entropia') {
            datos.delta_S = parseFloat(document.getElementById('delta_S-pro').value);
            datos.Q = parseFloat(document.getElementById('Q-pro').value);
            datos.T_amb = parseFloat(document.getElementById('T_amb-pro').value);
        } else if (modo === 'generacion_entropia') {
            datos.delta_S = parseFloat(document.getElementById('delta_S_gen-pro').value);
            datos.Q = parseFloat(document.getElementById('Q_gen-pro').value);
            datos.T_amb = parseFloat(document.getElementById('T_amb_gen-pro').value);
        }

        const respuesta = await fetch('/api/calcular-avanzado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.error || 'Error en el servidor');
        }

        const resultado = await respuesta.json();
        ultimoResultado = resultado;

        mostrarResultadosPro(resultado);
        generarGraficosPro(resultado);

    } catch (error) {
        errorDiv.textContent = '❌ ' + error.message;
        errorDiv.style.display = 'block';
    }
}

function mostrarResultadosPro(resultado) {
    document.getElementById('mensaje-inicial-pro').style.display = 'none';
    document.getElementById('resultado-container-pro').style.display = 'block';

    // Fórmula
    const formulaMarkup = resultado.formula ? `\\[${resultado.formula.replace(/\*/g, '')}\\]` : 'N/A';
    document.getElementById('formula-display-pro').innerHTML = `<strong>${formulaMarkup}</strong>`;
    if (window.MathJax) {
        window.MathJax.typesetPromise().catch(() => {});
    }

    // Resultados principales
    document.getElementById('result_delta_s-pro').textContent = 
        (resultado.delta_s !== undefined) ? resultado.delta_s.toFixed(6) : '-';
    document.getElementById('result_delta_S-pro').textContent = 
        (resultado.delta_S !== undefined) ? resultado.delta_S.toFixed(6) : '-';

    // Generación de entropía
    if (resultado.Sgen !== undefined) {
        document.getElementById('resultados-sgen-pro').style.display = 'block';
        document.getElementById('result_Sgen-pro').textContent = resultado.Sgen.toFixed(6);
        
        const reversibilidadEl = document.getElementById('result_reversibilidad-pro');
        reversibilidadEl.textContent = resultado.reversibilidad;
        
        if (resultado.estado === 'reversible') {
            reversibilidadEl.style.color = '#4CAF50';
        } else if (resultado.estado === 'irreversible') {
            reversibilidadEl.style.color = '#FF9800';
        } else {
            reversibilidadEl.style.color = '#F44336';
        }
    } else {
        document.getElementById('resultados-sgen-pro').style.display = 'none';
    }

    // Procedimiento
    document.getElementById('procedimiento-display-pro').textContent = 
        generarProcedimientoPro(resultado);

    // Interpretación
    document.getElementById('interpretacion-display-pro').textContent = 
        generarInterpretacionPro(resultado);
}

function generarProcedimientoPro(resultado) {
    let proc = `CÁLCULO DE ENTROPÍA - PROCEDIMIENTO\n`;
    proc += `${'='.repeat(60)}\n\n`;
    proc += `Gas: ${resultado.gas}\n`;
    proc += `Masa: ${resultado.constantes ? 'dato' : 'N/A'} kg\n\n`;

    if (resultado.delta_s !== undefined) {
        proc += `MÉTODO: Cambio de Entropía Específica\n`;
        proc += `Ecuación: ${resultado.formula}\n\n`;
        proc += `Δs = ${resultado.delta_s.toFixed(6)} kJ/(kg·K)\n`;
        proc += `ΔS = ${resultado.delta_S.toFixed(6)} kJ/K\n`;
    }

    if (resultado.Sgen !== undefined) {
        proc += `\n${'='.repeat(60)}\n`;
        proc += `ANÁLISIS DE REVERSIBILIDAD\n`;
        proc += `Sgen = ΔS - Q/T\n`;
        proc += `Sgen = ${resultado.Sgen.toFixed(6)} kJ/K\n`;
        proc += `Tipo: ${resultado.reversibilidad}\n`;
    }

    return proc;
}

function generarInterpretacionPro(resultado) {
    let interp = '';

    if (resultado.delta_s !== undefined) {
        if (resultado.delta_S > 0) {
            interp = `La entropía aumentó en ${resultado.delta_S.toFixed(4)} kJ/K. `;
            interp += `El proceso generó desorden molecular aumentando la irreversibilidad.`;
        } else if (resultado.delta_S < 0) {
            interp = `La entropía disminuyó en ${Math.abs(resultado.delta_S).toFixed(4)} kJ/K. `;
            interp += `Se requirió trabajo externo para ordenar el sistema.`;
        } else {
            interp = `La entropía no cambió. El proceso fue perfectamente reversible.`;
        }
    }

    if (resultado.Sgen !== undefined) {
        if (resultado.estado === 'reversible') {
            interp += `\n\n✅ PROCESO REVERSIBLE: Sgen = 0. Máxima eficiencia teórica.`;
        } else if (resultado.estado === 'irreversible') {
            interp += `\n\n⚠️ PROCESO IRREVERSIBLE: Sgen > 0. Proceso posible pero con pérdidas.`;
        } else {
            interp += `\n\n❌ PROCESO IMPOSIBLE: Sgen < 0. Violaría la Segunda Ley.`;
        }
    }

    return interp;
}

// ============================================================================
// GRÁFICOS
// ============================================================================

function generarGraficosPro(resultado) {
    generarGraficoTSPro(resultado);
    generarGraficoPVPro(resultado);
    generarGraficoEntropiaVolumenPro(resultado);
    generarGraficoEntropiaTemperaturaPro(resultado);
}

function generarGraficoTSPro(resultado) {
    const puntos = generarPuntosTSPro(resultado);

    const traceLinea = {
        x: puntos.x,
        y: puntos.y,
        mode: 'lines',
        name: 'Proceso',
        line: { color: '#4CAF50', width: 3 }
    };

    const traceEstado1 = {
        x: [puntos.x[0]],
        y: [puntos.y[0]],
        mode: 'markers+text',
        name: 'Estado 1',
        marker: { color: '#1B5E20', size: 12 },
        text: ['1'],
        textposition: 'top center'
    };

    const traceEstado2 = {
        x: [puntos.x[puntos.x.length - 1]],
        y: [puntos.y[puntos.y.length - 1]],
        mode: 'markers+text',
        name: 'Estado 2',
        marker: { color: '#FF6F00', size: 12 },
        text: ['2'],
        textposition: 'top center'
    };

    const layout = {
        title: { text: 'Diagrama T-s', font: { color: '#E6E6E6' } },
        xaxis: { title: 'Entropía s [kJ/(kg·K)]', gridcolor: '#30363D' },
        yaxis: { title: 'Temperatura T [K]', gridcolor: '#30363D' },
        plot_bgcolor: '#161B22',
        paper_bgcolor: '#0D1117',
        font: { color: '#E6E6E6' },
        margin: { l: 60, r: 40, t: 50, b: 50 }
    };

    Plotly.newPlot('diagrama-ts-pro', [traceLinea, traceEstado1, traceEstado2], layout, {
        responsive: true
    });
}

function generarGraficoPVPro(resultado) {
    // Generar puntos P-v
    const puntos = generarPuntosPVPro(resultado);

    const trace = {
        x: puntos.v,
        y: puntos.P,
        mode: 'lines',
        name: 'Proceso',
        line: { color: '#FF6F00', width: 3 },
        fill: 'tozeroy',
        fillcolor: 'rgba(255, 111, 0, 0.2)'
    };

    const marker = {
        x: [puntos.v[0]],
        y: [puntos.P[0]],
        mode: 'markers',
        name: 'Estado 1',
        marker: { color: '#1B5E20', size: 10 }
    };

    const layout = {
        title: { text: 'Diagrama P-v', font: { color: '#E6E6E6' } },
        xaxis: { title: 'Volumen Específico v [m³/kg]', gridcolor: '#30363D' },
        yaxis: { title: 'Presión P [kPa]', gridcolor: '#30363D' },
        plot_bgcolor: '#161B22',
        paper_bgcolor: '#0D1117',
        font: { color: '#E6E6E6' },
        margin: { l: 60, r: 40, t: 50, b: 50 }
    };

    Plotly.newPlot('diagrama-pv-pro', [trace, marker], layout, {
        responsive: true
    });
}

function generarPuntosTSPro(resultado) {
    const puntos = { x: [], y: [] };
    const numPuntos = 50;

    if (resultado.datos && resultado.datos.T1) {
        const T1 = resultado.datos.T1;
        const T2 = resultado.datos.T2;

        for (let i = 0; i < numPuntos; i++) {
            const factor = i / (numPuntos - 1);
            const T = T1 + factor * (T2 - T1);
            
            let s = 0;
            if (resultado.datos.v1) {
                const cv = resultado.constantes?.cv || 0.718;
                const R = resultado.constantes?.R || 0.287;
                const v = resultado.datos.v1 + factor * (resultado.datos.v2 - resultado.datos.v1);
                s = cv * Math.log(T / T1) + R * Math.log(v / resultado.datos.v1);
            }

            puntos.x.push(s);
            puntos.y.push(T);
        }
    }

    return puntos;
}

function generarPuntosPVPro(resultado) {
    const puntos = { P: [], v: [] };
    const numPuntos = 50;

    if (resultado.datos) {
        const v1 = resultado.datos.v1 || resultado.datos.v2 || 0.5;
        const v2 = resultado.datos.v2 || v1;

        for (let i = 0; i < numPuntos; i++) {
            const factor = i / (numPuntos - 1);
            const v = v1 + factor * (v2 - v1);
            const P = 100 * Math.exp(-factor); // Curve representativa

            puntos.v.push(v);
            puntos.P.push(P);
        }
    }

    return puntos;
}

/**
 * Genera gráfico paramétrico de Entropía vs. Volumen Final
 */
function generarGraficoEntropiaVolumenPro(resultado) {
    const modo = document.getElementById('modo_calculo').value;
    
    // Solo generar si hay datos T-V o T-P
    if (!resultado.datos || !resultado.datos.T1) {
        return;
    }

    const datosX = [];
    const datosY = [];
    const v1 = resultado.datos.v1 || 0.5;
    const numPuntos = 50;
    const v_min = v1 * 0.5;
    const v_max = v1 * 3.0;
    
    const cv = resultado.constantes?.cv || 0.718;
    const R = resultado.constantes?.R || 0.287;

    for (let i = 0; i < numPuntos; i++) {
        const v2 = v_min + (i / (numPuntos - 1)) * (v_max - v_min);
        let delta_s = 0;

        if (modo === 'delta_s_tv') {
            // Δs = cv·ln(T₂/T₁) + R·ln(v₂/v₁)
            const termino_T = cv * Math.log(resultado.datos.T2 / resultado.datos.T1);
            const termino_V = R * Math.log(v2 / v1);
            delta_s = termino_T + termino_V;
        } else if (modo === 'delta_s_tp') {
            // Para T-P, parametrizamos con volumen también
            const termino_T = cv * Math.log(resultado.datos.T2 / resultado.datos.T1);
            const termino_V = R * Math.log(v2 / v1);
            delta_s = termino_T + termino_V;
        }

        datosX.push(v2);
        datosY.push(delta_s);
    }

    const trace = {
        x: datosX,
        y: datosY,
        mode: 'lines',
        name: 'Δs vs v₂',
        line: {
            color: '#4CAF50',
            width: 3
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(76, 175, 80, 0.2)'
    };

    const puntoActual = {
        x: [resultado.datos.v2 || v1],
        y: [resultado.delta_s || 0],
        mode: 'markers',
        name: 'Punto Actual',
        marker: {
            color: '#FF6F00',
            size: 12,
            symbol: 'diamond'
        }
    };

    const layout = {
        title: {
            text: 'Cambio de Entropía (Δs) vs. Volumen Final (v₂)',
            font: { color: '#E6E6E6', size: 14 }
        },
        xaxis: {
            title: 'Volumen Específico Final v₂ [m³/kg]',
            gridcolor: '#30363D',
            tickfont: { color: '#8B949E' },
            titlefont: { color: '#E6E6E6' }
        },
        yaxis: {
            title: 'Cambio de Entropía Δs [kJ/(kg·K)]',
            gridcolor: '#30363D',
            tickfont: { color: '#8B949E' },
            titlefont: { color: '#E6E6E6' }
        },
        plot_bgcolor: '#161B22',
        paper_bgcolor: '#0D1117',
        font: { color: '#E6E6E6' },
        hovermode: 'closest',
        showlegend: true,
        margin: { l: 60, r: 40, t: 50, b: 50 }
    };

    try {
        Plotly.newPlot('grafico-entropia-volumen-pro', [trace, puntoActual], layout, {
            responsive: true,
            displayModeBar: true
        });
    } catch(e) {
        console.log('Gráfico de entropía-volumen no disponible');
    }
}

/**
 * Genera gráfico paramétrico de Entropía vs. Temperatura Final
 */
function generarGraficoEntropiaTemperaturaPro(resultado) {
    const modo = document.getElementById('modo_calculo').value;
    
    // Solo generar si hay datos T-V o T-P
    if (!resultado.datos || !resultado.datos.T1) {
        return;
    }

    const datosX = [];
    const datosY = [];
    const T1 = resultado.datos.T1;
    const numPuntos = 50;
    const T_min = T1 * 0.5;
    const T_max = T1 * 3.0;
    
    const cp = resultado.constantes?.cp || 1.005;
    const cv = resultado.constantes?.cv || 0.718;
    const R = resultado.constantes?.R || 0.287;

    for (let i = 0; i < numPuntos; i++) {
        const T2 = T_min + (i / (numPuntos - 1)) * (T_max - T_min);
        let delta_s = 0;

        if (modo === 'delta_s_tv') {
            // Δs = cv·ln(T₂/T₁) + R·ln(v₂/v₁)
            const termino_T = cv * Math.log(T2 / T1);
            const termino_V = resultado.datos.v2 ? R * Math.log(resultado.datos.v2 / (resultado.datos.v1 || 0.5)) : 0;
            delta_s = termino_T + termino_V;
        } else if (modo === 'delta_s_tp') {
            // Δs = cp·ln(T₂/T₁) - R·ln(P₂/P₁)
            const termino_T = cp * Math.log(T2 / T1);
            const termino_P = resultado.datos.P2 ? R * Math.log(resultado.datos.P2 / (resultado.datos.P1 || 100)) : 0;
            delta_s = termino_T - termino_P;
        }

        datosX.push(T2);
        datosY.push(delta_s);
    }

    const trace = {
        x: datosX,
        y: datosY,
        mode: 'lines',
        name: 'Δs vs T₂',
        line: {
            color: '#66BB6A',
            width: 3
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(102, 187, 106, 0.2)'
    };

    const puntoActual = {
        x: [resultado.datos.T2 || T1],
        y: [resultado.delta_s || 0],
        mode: 'markers',
        name: 'Punto Actual',
        marker: {
            color: '#FF6F00',
            size: 12,
            symbol: 'diamond'
        }
    };

    const layout = {
        title: {
            text: 'Cambio de Entropía (Δs) vs. Temperatura Final (T₂)',
            font: { color: '#E6E6E6', size: 14 }
        },
        xaxis: {
            title: 'Temperatura Final T₂ [K]',
            gridcolor: '#30363D',
            tickfont: { color: '#8B949E' },
            titlefont: { color: '#E6E6E6' }
        },
        yaxis: {
            title: 'Cambio de Entropía Δs [kJ/(kg·K)]',
            gridcolor: '#30363D',
            tickfont: { color: '#8B949E' },
            titlefont: { color: '#E6E6E6' }
        },
        plot_bgcolor: '#161B22',
        paper_bgcolor: '#0D1117',
        font: { color: '#E6E6E6' },
        hovermode: 'closest',
        showlegend: true,
        margin: { l: 60, r: 40, t: 50, b: 50 }
    };

    try {
        Plotly.newPlot('grafico-entropia-temperatura-pro', [trace, puntoActual], layout, {
            responsive: true,
            displayModeBar: true
        });
    } catch(e) {
        console.log('Gráfico de entropía-temperatura no disponible');
    }
}

// ============================================================================
// EXPORTACIÓN A PDF
// ============================================================================

async function explicarProcedimiento() {
    const gas = document.getElementById('gas-pro').value;
    const masa = parseFloat(document.getElementById('masa-pro').value) || 1.0;

    const datos = {
        gas,
        masa,
        tipo_calculo: document.getElementById('modo_calculo').value,
        T1: parseFloat(document.getElementById('T1-pro')?.value),
        T2: parseFloat(document.getElementById('T2-pro')?.value),
        P1: parseFloat(document.getElementById('P1-pro')?.value),
        P2: parseFloat(document.getElementById('P2-pro')?.value),
        v1: parseFloat(document.getElementById('v1-pro')?.value),
        v2: parseFloat(document.getElementById('v2-pro')?.value),
        process_type: document.getElementById('tipo-especial')?.value || 'auto'
    };

    try {
        const respuesta = await fetch('/api/procedimiento-detallado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const resultado = await respuesta.json();
        document.getElementById('resultado-verificacion-pro').innerHTML = resultado.procedimiento || resultado.error || 'No se pudo generar la explicación.';
    } catch (error) {
        document.getElementById('resultado-verificacion-pro').textContent = 'No se pudo generar la explicación.';
    }
}

async function generarEjercicioAleatorio() {
    try {
        const respuesta = await fetch('/api/ejercicio-aleatorio');
        const ejercicio = await respuesta.json();
        const contenedor = document.getElementById('ejercicio-aleatorio-pro');
        contenedor.innerHTML = `
            <strong>Ejercicio propuesto:</strong><br>
            ${ejercicio.statement || ''}<br><br>
            <strong>Pista:</strong> ${ejercicio.expected_hint || ''}
        `;
    } catch (error) {
        document.getElementById('ejercicio-aleatorio-pro').textContent = 'No se pudo generar un ejercicio.';
    }
}

async function verificarRespuestaEstudiante() {
    const respuesta = document.getElementById('respuesta-estudiante-pro').value;
    if (!ultimoResultado || ultimoResultado.delta_S === undefined || ultimoResultado.delta_S === null) {
        document.getElementById('resultado-verificacion-pro').textContent = 'Primero realiza un cálculo para comparar una respuesta.';
        return;
    }

    try {
        const respuestaServidor = await fetch('/api/verificar-respuesta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ respuesta, esperado: ultimoResultado.delta_S })
        });
        const resultado = await respuestaServidor.json();
        document.getElementById('resultado-verificacion-pro').innerHTML = `<strong>${resultado.status.toUpperCase()}:</strong> ${resultado.message}`;
    } catch (error) {
        document.getElementById('resultado-verificacion-pro').textContent = 'No se pudo verificar la respuesta.';
    }
}

function exportarPDF() {
    if (!ultimoResultado) {
        alert('Por favor realiza un cálculo primero');
        return;
    }

    const datosExportar = {
        ...ultimoResultado,
        procedimiento: document.getElementById('procedimiento-display-pro').textContent,
        datos_entrada: JSON.stringify(ultimoResultado.datos || {})
    };

    fetch('/api/exportar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosExportar)
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `entropysolver_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
    })
    .catch(error => console.error('Error:', error));
}
