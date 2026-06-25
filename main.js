/**
 * EntropySolver Web - JavaScript Principal
 * Lógica de interactividad, validaciones y gráficos
 */

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

const CONSTANTES_GASES = {
    aire: { R: 0.287, cp: 1.005, cv: 0.718, gamma: 1.4 },
    nitrogeno: { R: 0.2968, cp: 1.039, cv: 0.743, gamma: 1.40 },
    oxigeno: { R: 0.2598, cp: 0.918, cv: 0.658, gamma: 1.40 },
    argon: { R: 0.2081, cp: 0.520, cv: 0.312, gamma: 1.67 },
    hidrogeno: { R: 4.124, cp: 14.307, cv: 10.183, gamma: 1.405 }
};

let ultimoResultado = null;

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    actualizarCampos();
    actualizarConstantes();
});

// ============================================================================
// FUNCIONES DE NAVEGACIÓN Y UI
// ============================================================================

/**
 * Cambia entre secciones (Calculadora, Teoría, Ayuda)
 */
function cambiarSeccion(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(el => {
        el.classList.remove('activa');
    });

    // Mostrar sección seleccionada
    const seccionEl = document.getElementById(seccion);
    if (seccionEl) {
        seccionEl.classList.add('activa');
        window.scrollTo(0, 0);
    }
}

/**
 * Actualiza los campos de entrada según el tipo de proceso seleccionado
 */
function actualizarCampos() {
    const tipo = document.getElementById('tipo_proceso').value;
    const contenedor = document.getElementById('campos-dinamicos');
    contenedor.innerHTML = '';

    switch (tipo) {
        case 'tv':
            contenedor.innerHTML = `
                <div class="grupo-control">
                    <label for="T1">Temperatura Inicial T₁ (K):</label>
                    <input type="number" id="T1" value="300" step="1" min="1">
                </div>
                <div class="grupo-control">
                    <label for="T2">Temperatura Final T₂ (K):</label>
                    <input type="number" id="T2" value="500" step="1" min="1">
                </div>
                <div class="grupo-control">
                    <label for="v1">Volumen Específico Inicial v₁ (m³/kg):</label>
                    <input type="number" id="v1" value="0.5" step="0.01" min="0.001">
                </div>
                <div class="grupo-control">
                    <label for="v2">Volumen Específico Final v₂ (m³/kg):</label>
                    <input type="number" id="v2" value="1.0" step="0.01" min="0.001">
                </div>
            `;
            break;

        case 'tp':
            contenedor.innerHTML = `
                <div class="grupo-control">
                    <label for="T1">Temperatura Inicial T₁ (K):</label>
                    <input type="number" id="T1" value="300" step="1" min="1">
                </div>
                <div class="grupo-control">
                    <label for="T2">Temperatura Final T₂ (K):</label>
                    <input type="number" id="T2" value="500" step="1" min="1">
                </div>
                <div class="grupo-control">
                    <label for="P1">Presión Inicial P₁ (kPa):</label>
                    <input type="number" id="P1" value="100" step="1" min="0.1">
                </div>
                <div class="grupo-control">
                    <label for="P2">Presión Final P₂ (kPa):</label>
                    <input type="number" id="P2" value="200" step="1" min="0.1">
                </div>
            `;
            break;

        case 'isotermico':
            contenedor.innerHTML = `
                <div class="grupo-control">
                    <label for="T">Temperatura (K):</label>
                    <input type="number" id="T" value="300" step="1" min="1">
                </div>
                <div class="grupo-control">
                    <label>Modo de Cálculo:</label>
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                        <label style="display: flex; align-items: center; margin: 0; cursor: pointer;">
                            <input type="radio" name="modo_isotermico" value="volumen" checked style="margin-right: 0.5rem;">
                            Por Volumen
                        </label>
                        <label style="display: flex; align-items: center; margin: 0; cursor: pointer;">
                            <input type="radio" name="modo_isotermico" value="presion" style="margin-right: 0.5rem;">
                            Por Presión
                        </label>
                    </div>
                </div>
                <div id="campos-isotermico-dinamicos"></div>
            `;
            actualizarCamposIsotermico();
            document.querySelectorAll('input[name="modo_isotermico"]').forEach(radio => {
                radio.addEventListener('change', actualizarCamposIsotermico);
            });
            break;

        case 'isobarico':
            contenedor.innerHTML = `
                <div class="grupo-control">
                    <label for="P">Presión (kPa):</label>
                    <input type="number" id="P" value="100" step="1" min="0.1">
                </div>
                <div class="grupo-control">
                    <label for="T1">Temperatura Inicial T₁ (K):</label>
                    <input type="number" id="T1" value="300" step="1" min="1">
                </div>
                <div class="grupo-control">
                    <label for="T2">Temperatura Final T₂ (K):</label>
                    <input type="number" id="T2" value="500" step="1" min="1">
                </div>
            `;
            break;

        case 'isocoro':
            contenedor.innerHTML = `
                <div class="grupo-control">
                    <label for="V">Volumen (m³):</label>
                    <input type="number" id="V" value="1.0" step="0.1" min="0.1">
                </div>
                <div class="grupo-control">
                    <label for="T1">Temperatura Inicial T₁ (K):</label>
                    <input type="number" id="T1" value="300" step="1" min="1">
                </div>
                <div class="grupo-control">
                    <label for="T2">Temperatura Final T₂ (K):</label>
                    <input type="number" id="T2" value="500" step="1" min="1">
                </div>
            `;
            break;

        case 'politropico':
            contenedor.innerHTML = `
                <div class="grupo-control">
                    <label for="n">Índice Politrópico (n):</label>
                    <input type="number" id="n" value="1.3" step="0.01" min="0.1">
                </div>
                <div class="grupo-control">
                    <label for="T1">Temperatura Inicial T₁ (K):</label>
                    <input type="number" id="T1" value="300" step="1" min="1">
                </div>
                <div class="grupo-control">
                    <label for="T2">Temperatura Final T₂ (K):</label>
                    <input type="number" id="T2" value="500" step="1" min="1">
                </div>
            `;
            break;
    }
}

/**
 * Actualiza los campos específicos para proceso isotérmico
 */
function actualizarCamposIsotermico() {
    const modo = document.querySelector('input[name="modo_isotermico"]:checked').value;
    const contenedor = document.getElementById('campos-isotermico-dinamicos');

    if (modo === 'volumen') {
        contenedor.innerHTML = `
            <div class="grupo-control">
                <label for="v1">Volumen Específico Inicial v₁ (m³/kg):</label>
                <input type="number" id="v1" value="0.5" step="0.01" min="0.001">
            </div>
            <div class="grupo-control">
                <label for="v2">Volumen Específico Final v₂ (m³/kg):</label>
                <input type="number" id="v2" value="1.0" step="0.01" min="0.001">
            </div>
        `;
    } else {
        contenedor.innerHTML = `
            <div class="grupo-control">
                <label for="P1">Presión Inicial P₁ (kPa):</label>
                <input type="number" id="P1" value="100" step="1" min="0.1">
            </div>
            <div class="grupo-control">
                <label for="P2">Presión Final P₂ (kPa):</label>
                <input type="number" id="P2" value="200" step="1" min="0.1">
            </div>
        `;
    }
}

/**
 * Actualiza las constantes del gas mostradas
 */
function actualizarConstantes() {
    const gas = document.getElementById('gas').value;
    const constantes = CONSTANTES_GASES[gas];

    if (constantes) {
        document.getElementById('const_R').textContent = constantes.R.toFixed(4);
        document.getElementById('const_cp').textContent = constantes.cp.toFixed(3);
        document.getElementById('const_cv').textContent = constantes.cv.toFixed(3);
        document.getElementById('const_gamma').textContent = constantes.gamma.toFixed(2);
    }
}

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Valida un número ingresado
 */
function validarNumero(valor, nombreCampo, minimo = null, maximo = null) {
    if (!valor && valor !== 0) {
        return { valido: false, error: `${nombreCampo} es requerido` };
    }

    const numero = parseFloat(valor);
    if (isNaN(numero)) {
        return { valido: false, error: `${nombreCampo} debe ser un número` };
    }

    if (minimo !== null && numero <= minimo) {
        return { valido: false, error: `${nombreCampo} debe ser mayor a ${minimo}` };
    }

    if (maximo !== null && numero >= maximo) {
        return { valido: false, error: `${nombreCampo} debe ser menor a ${maximo}` };
    }

    return { valido: true, valor: numero };
}

/**
 * Recopila y valida los datos del formulario
 */
function recopilarDatos() {
    const tipo = document.getElementById('tipo_proceso').value;
    const gas = document.getElementById('gas').value;
    const datos = { tipo_proceso: tipo, gas: gas };

    // Validar masa
    const masaVal = validarNumero(
        document.getElementById('masa').value,
        'Masa',
        0
    );
    if (!masaVal.valido) {
        throw new Error(masaVal.error);
    }
    datos.masa = masaVal.valor;

    // Validar según tipo de proceso
    switch (tipo) {
        case 'tv':
            const T1_val = validarNumero(document.getElementById('T1').value, 'T₁', 0);
            const T2_val = validarNumero(document.getElementById('T2').value, 'T₂', 0);
            const v1_val = validarNumero(document.getElementById('v1').value, 'v₁', 0);
            const v2_val = validarNumero(document.getElementById('v2').value, 'v₂', 0);

            if (!T1_val.valido) throw new Error(T1_val.error);
            if (!T2_val.valido) throw new Error(T2_val.error);
            if (!v1_val.valido) throw new Error(v1_val.error);
            if (!v2_val.valido) throw new Error(v2_val.error);

            Object.assign(datos, {
                T1: T1_val.valor,
                T2: T2_val.valor,
                v1: v1_val.valor,
                v2: v2_val.valor
            });
            break;

        case 'tp':
            const T1tp = validarNumero(document.getElementById('T1').value, 'T₁', 0);
            const T2tp = validarNumero(document.getElementById('T2').value, 'T₂', 0);
            const P1_val = validarNumero(document.getElementById('P1').value, 'P₁', 0);
            const P2_val = validarNumero(document.getElementById('P2').value, 'P₂', 0);

            if (!T1tp.valido) throw new Error(T1tp.error);
            if (!T2tp.valido) throw new Error(T2tp.error);
            if (!P1_val.valido) throw new Error(P1_val.error);
            if (!P2_val.valido) throw new Error(P2_val.error);

            Object.assign(datos, {
                T1: T1tp.valor,
                T2: T2tp.valor,
                P1: P1_val.valor,
                P2: P2_val.valor
            });
            break;

        case 'isotermico':
            const Tiso = validarNumero(document.getElementById('T').value, 'T', 0);
            if (!Tiso.valido) throw new Error(Tiso.error);
            datos.T = Tiso.valor;
            datos.modo_isotermico = document.querySelector('input[name="modo_isotermico"]:checked').value;

            if (datos.modo_isotermico === 'volumen') {
                const v1iso = validarNumero(document.getElementById('v1').value, 'v₁', 0);
                const v2iso = validarNumero(document.getElementById('v2').value, 'v₂', 0);
                if (!v1iso.valido) throw new Error(v1iso.error);
                if (!v2iso.valido) throw new Error(v2iso.error);
                Object.assign(datos, { v1: v1iso.valor, v2: v2iso.valor });
            } else {
                const P1iso = validarNumero(document.getElementById('P1').value, 'P₁', 0);
                const P2iso = validarNumero(document.getElementById('P2').value, 'P₂', 0);
                if (!P1iso.valido) throw new Error(P1iso.error);
                if (!P2iso.valido) throw new Error(P2iso.error);
                Object.assign(datos, { P1: P1iso.valor, P2: P2iso.valor });
            }
            break;

        case 'isobarico':
            const Piso = validarNumero(document.getElementById('P').value, 'P', 0);
            const T1iso = validarNumero(document.getElementById('T1').value, 'T₁', 0);
            const T2iso = validarNumero(document.getElementById('T2').value, 'T₂', 0);

            if (!Piso.valido) throw new Error(Piso.error);
            if (!T1iso.valido) throw new Error(T1iso.error);
            if (!T2iso.valido) throw new Error(T2iso.error);

            Object.assign(datos, {
                P: Piso.valor,
                T1: T1iso.valor,
                T2: T2iso.valor
            });
            break;

        case 'isocoro':
            const Viso = validarNumero(document.getElementById('V').value, 'V', 0);
            const T1isoc = validarNumero(document.getElementById('T1').value, 'T₁', 0);
            const T2isoc = validarNumero(document.getElementById('T2').value, 'T₂', 0);

            if (!Viso.valido) throw new Error(Viso.error);
            if (!T1isoc.valido) throw new Error(T1isoc.error);
            if (!T2isoc.valido) throw new Error(T2isoc.error);

            Object.assign(datos, {
                V: Viso.valor,
                T1: T1isoc.valor,
                T2: T2isoc.valor
            });
            break;

        case 'politropico':
            const n_val = validarNumero(document.getElementById('n').value, 'n', 0);
            const T1pol = validarNumero(document.getElementById('T1').value, 'T₁', 0);
            const T2pol = validarNumero(document.getElementById('T2').value, 'T₂', 0);

            if (!n_val.valido) throw new Error(n_val.error);
            if (!T1pol.valido) throw new Error(T1pol.error);
            if (!T2pol.valido) throw new Error(T2pol.error);

            Object.assign(datos, {
                n: n_val.valor,
                T1: T1pol.valor,
                T2: T2pol.valor
            });
            break;
    }

    return datos;
}

// ============================================================================
// LLAMADAS A API
// ============================================================================

/**
 * Realiza el cálculo mediante Fetch API
 */
async function realizarCalculo() {
    const contenedorError = document.getElementById('mensaje-error');
    contenedorError.style.display = 'none';

    try {
        // Recopilar y validar datos
        const datos = recopilarDatos();

        // Enviar al servidor
        const respuesta = await fetch('/api/calcular', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.error || 'Error desconocido en el servidor');
        }

        const resultado = await respuesta.json();
        ultimoResultado = resultado;

        // Mostrar resultados
        mostrarResultados(resultado);

        // Generar gráfico
        generarGraficoTS(resultado);

    } catch (error) {
        contenedorError.textContent = '❌ ' + error.message;
        contenedorError.style.display = 'block';
        console.error('Error:', error);
    }
}

// ============================================================================
// VISUALIZACIÓN DE RESULTADOS
// ============================================================================

/**
 * Muestra los resultados del cálculo en la interfaz
 */
function mostrarResultados(resultado) {
    // Ocultar mensaje inicial y mostrar contenedor de resultados
    document.getElementById('mensaje-inicial').style.display = 'none';
    document.getElementById('resultado-container').style.display = 'block';

    // Fórmula
    const formulaDisplay = document.getElementById('formula-display');
    formulaDisplay.innerHTML = `<strong>Δs = ${resultado.formula}</strong>`;

    // Procedimiento
    const procedimientoDisplay = document.getElementById('procedimiento-display');
    procedimientoDisplay.textContent = generarProcedimiento(resultado);

    // Resultados finales
    document.getElementById('result_delta_s').textContent = resultado.delta_s.toFixed(6);
    document.getElementById('result_delta_S').textContent = resultado.delta_S.toFixed(6);

    // Interpretación física
    document.getElementById('interpretacion-display').textContent = resultado.interpretacion_fisica;

    // Generar gráficos paramétricos
    generarGraficoEntropiaVolumen(resultado);
    generarGraficoEntropiaTemperatura(resultado);
}

/**
 * Genera el procedimiento matemático paso a paso
 */
function generarProcedimiento(resultado) {
    let procedimiento = `CÁLCULO DEL CAMBIO DE ENTROPÍA\n`;
    procedimiento += `${'='.repeat(60)}\n\n`;

    procedimiento += `DATOS INICIALES:\n`;
    procedimiento += `-----------------\n`;
    procedimiento += `Gas: ${resultado.gas.toUpperCase()}\n`;
    procedimiento += `Tipo de proceso: ${resultado.tipo_proceso}\n`;

    switch (resultado.tipo_proceso) {
        case 'T-V (Temperatura y Volumen)':
            procedimiento += `\nT₁ = ${resultado.T1} K\n`;
            procedimiento += `T₂ = ${resultado.T2} K\n`;
            procedimiento += `v₁ = ${resultado.v1} m³/kg\n`;
            procedimiento += `v₂ = ${resultado.v2} m³/kg\n`;
            procedimiento += `m = ${resultado.m} kg\n`;
            procedimiento += `cv = ${resultado.cv} kJ/(kg·K)\n`;
            procedimiento += `R = ${resultado.R} kJ/(kg·K)\n`;

            procedimiento += `\nPROCEDIMIENTO:\n`;
            procedimiento += `${'-'.repeat(60)}\n`;
            procedimiento += `Δs = cv·ln(T₂/T₁) + R·ln(v₂/v₁)\n\n`;

            procedimiento += `Término 1: cv·ln(T₂/T₁)\n`;
            procedimiento += `  Razón de temperaturas: T₂/T₁ = ${resultado.T2}/${resultado.T1} = ${resultado.razon_temperaturas.toFixed(4)}\n`;
            procedimiento += `  ln(${resultado.razon_temperaturas.toFixed(4)}) = ${resultado.ln_T.toFixed(4)}\n`;
            procedimiento += `  ${resultado.cv} × ${resultado.ln_T.toFixed(4)} = ${resultado.termino1.toFixed(6)} kJ/(kg·K)\n\n`;

            procedimiento += `Término 2: R·ln(v₂/v₁)\n`;
            procedimiento += `  Razón de volúmenes: v₂/v₁ = ${resultado.v2}/${resultado.v1} = ${resultado.razon_volumenes.toFixed(4)}\n`;
            procedimiento += `  ln(${resultado.razon_volumenes.toFixed(4)}) = ${resultado.ln_v.toFixed(4)}\n`;
            procedimiento += `  ${resultado.R} × ${resultado.ln_v.toFixed(4)} = ${resultado.termino2.toFixed(6)} kJ/(kg·K)\n\n`;

            procedimiento += `CAMBIO DE ENTROPÍA ESPECÍFICA:\n`;
            procedimiento += `Δs = ${resultado.termino1.toFixed(6)} + ${resultado.termino2.toFixed(6)}\n`;
            procedimiento += `Δs = ${resultado.delta_s.toFixed(6)} kJ/(kg·K)\n\n`;

            procedimiento += `CAMBIO DE ENTROPÍA TOTAL:\n`;
            procedimiento += `ΔS = m × Δs = ${resultado.m} × ${resultado.delta_s.toFixed(6)}\n`;
            procedimiento += `ΔS = ${resultado.delta_S.toFixed(6)} kJ/K\n`;
            break;

        case 'T-P (Temperatura y Presión)':
            procedimiento += `\nT₁ = ${resultado.T1} K\n`;
            procedimiento += `T₂ = ${resultado.T2} K\n`;
            procedimiento += `P₁ = ${resultado.P1} kPa\n`;
            procedimiento += `P₂ = ${resultado.P2} kPa\n`;
            procedimiento += `m = ${resultado.m} kg\n`;
            procedimiento += `cp = ${resultado.cp} kJ/(kg·K)\n`;
            procedimiento += `R = ${resultado.R} kJ/(kg·K)\n`;

            procedimiento += `\nPROCEDIMIENTO:\n`;
            procedimiento += `${'-'.repeat(60)}\n`;
            procedimiento += `Δs = cp·ln(T₂/T₁) - R·ln(P₂/P₁)\n\n`;

            procedimiento += `Término 1: cp·ln(T₂/T₁)\n`;
            procedimiento += `  Razón de temperaturas: T₂/T₁ = ${resultado.T2}/${resultado.T1} = ${resultado.razon_temperaturas.toFixed(4)}\n`;
            procedimiento += `  ln(${resultado.razon_temperaturas.toFixed(4)}) = ${resultado.ln_T.toFixed(4)}\n`;
            procedimiento += `  ${resultado.cp} × ${resultado.ln_T.toFixed(4)} = ${resultado.termino1.toFixed(6)} kJ/(kg·K)\n\n`;

            procedimiento += `Término 2: -R·ln(P₂/P₁)\n`;
            procedimiento += `  Razón de presiones: P₂/P₁ = ${resultado.P2}/${resultado.P1} = ${resultado.razon_presiones.toFixed(4)}\n`;
            procedimiento += `  ln(${resultado.razon_presiones.toFixed(4)}) = ${resultado.ln_P.toFixed(4)}\n`;
            procedimiento += `  -${resultado.R} × ${resultado.ln_P.toFixed(4)} = ${resultado.termino2.toFixed(6)} kJ/(kg·K)\n\n`;

            procedimiento += `CAMBIO DE ENTROPÍA ESPECÍFICA:\n`;
            procedimiento += `Δs = ${resultado.termino1.toFixed(6)} + (${resultado.termino2.toFixed(6)})\n`;
            procedimiento += `Δs = ${resultado.delta_s.toFixed(6)} kJ/(kg·K)\n\n`;

            procedimiento += `CAMBIO DE ENTROPÍA TOTAL:\n`;
            procedimiento += `ΔS = m × Δs = ${resultado.m} × ${resultado.delta_s.toFixed(6)}\n`;
            procedimiento += `ΔS = ${resultado.delta_S.toFixed(6)} kJ/K\n`;
            break;

        case 'Isotérmico (T = constante)':
            procedimiento += `\nT = ${resultado.T} K (constante)\n`;
            procedimiento += `m = ${resultado.m} kg\n`;
            procedimiento += `R = ${resultado.R} kJ/(kg·K)\n`;

            if (resultado.modo === 'volumen') {
                procedimiento += `v₁ = ${resultado.v1} m³/kg\n`;
                procedimiento += `v₂ = ${resultado.v2} m³/kg\n`;
                procedimiento += `\nFórmula para proceso isotérmico (volumen):\n`;
                procedimiento += `Δs = R·ln(v₂/v₁)\n\n`;
                procedimiento += `Razón de volúmenes: v₂/v₁ = ${resultado.v2}/${resultado.v1} = ${(resultado.v2/resultado.v1).toFixed(4)}\n`;
                procedimiento += `ln(${(resultado.v2/resultado.v1).toFixed(4)}) = ${Math.log(resultado.v2/resultado.v1).toFixed(4)}\n`;
                procedimiento += `Δs = ${resultado.R} × ${Math.log(resultado.v2/resultado.v1).toFixed(4)} = ${resultado.delta_s.toFixed(6)} kJ/(kg·K)\n`;
            } else {
                procedimiento += `P₁ = ${resultado.P1} kPa\n`;
                procedimiento += `P₂ = ${resultado.P2} kPa\n`;
                procedimiento += `\nFórmula para proceso isotérmico (presión):\n`;
                procedimiento += `Δs = -R·ln(P₂/P₁)\n\n`;
                procedimiento += `Razón de presiones: P₂/P₁ = ${resultado.P2}/${resultado.P1} = ${(resultado.P2/resultado.P1).toFixed(4)}\n`;
                procedimiento += `ln(${(resultado.P2/resultado.P1).toFixed(4)}) = ${Math.log(resultado.P2/resultado.P1).toFixed(4)}\n`;
                procedimiento += `Δs = -${resultado.R} × ${Math.log(resultado.P2/resultado.P1).toFixed(4)} = ${resultado.delta_s.toFixed(6)} kJ/(kg·K)\n`;
            }

            procedimiento += `\nCambio de entropía total:\n`;
            procedimiento += `ΔS = m × Δs = ${resultado.m} × ${resultado.delta_s.toFixed(6)} = ${resultado.delta_S.toFixed(6)} kJ/K\n`;
            break;

        case 'Isobárico (P = constante)':
            procedimiento += `\nP = ${resultado.P} kPa (constante)\n`;
            procedimiento += `T₁ = ${resultado.T1} K\n`;
            procedimiento += `T₂ = ${resultado.T2} K\n`;
            procedimiento += `m = ${resultado.m} kg\n`;
            procedimiento += `cp = ${resultado.cp} kJ/(kg·K)\n`;

            procedimiento += `\nFórmula para proceso isobárico:\n`;
            procedimiento += `Δs = cp·ln(T₂/T₁)\n\n`;

            procedimiento += `Razón de temperaturas: T₂/T₁ = ${resultado.T2}/${resultado.T1} = ${resultado.razon_temperaturas.toFixed(4)}\n`;
            procedimiento += `ln(${resultado.razon_temperaturas.toFixed(4)}) = ${resultado.ln_T.toFixed(4)}\n`;
            procedimiento += `Δs = ${resultado.cp} × ${resultado.ln_T.toFixed(4)} = ${resultado.delta_s.toFixed(6)} kJ/(kg·K)\n\n`;

            procedimiento += `Cambio de entropía total:\n`;
            procedimiento += `ΔS = m × Δs = ${resultado.m} × ${resultado.delta_s.toFixed(6)} = ${resultado.delta_S.toFixed(6)} kJ/K\n`;
            break;

        case 'Isocórico (V = constante)':
            procedimiento += `\nV = ${resultado.V} m³ (constante)\n`;
            procedimiento += `T₁ = ${resultado.T1} K\n`;
            procedimiento += `T₂ = ${resultado.T2} K\n`;
            procedimiento += `m = ${resultado.m} kg\n`;
            procedimiento += `cv = ${resultado.cv} kJ/(kg·K)\n`;

            procedimiento += `\nFórmula para proceso isocórico:\n`;
            procedimiento += `Δs = cv·ln(T₂/T₁)\n\n`;

            procedimiento += `Razón de temperaturas: T₂/T₁ = ${resultado.T2}/${resultado.T1} = ${resultado.razon_temperaturas.toFixed(4)}\n`;
            procedimiento += `ln(${resultado.razon_temperaturas.toFixed(4)}) = ${resultado.ln_T.toFixed(4)}\n`;
            procedimiento += `Δs = ${resultado.cv} × ${resultado.ln_T.toFixed(4)} = ${resultado.delta_s.toFixed(6)} kJ/(kg·K)\n\n`;

            procedimiento += `Cambio de entropía total:\n`;
            procedimiento += `ΔS = m × Δs = ${resultado.m} × ${resultado.delta_s.toFixed(6)} = ${resultado.delta_S.toFixed(6)} kJ/K\n`;
            break;

        case 'Politrópico (n = ' + resultado.n + ')':
        case resultado.tipo_proceso:
            if (resultado.tipo_proceso.includes('Politrópico')) {
                procedimiento += `\nn = ${resultado.n} (índice politrópico)\n`;
                procedimiento += `T₁ = ${resultado.T1} K\n`;
                procedimiento += `T₂ = ${resultado.T2} K\n`;
                procedimiento += `m = ${resultado.m} kg\n`;
                procedimiento += `cv = ${resultado.cv} kJ/(kg·K)\n`;
                procedimiento += `R = ${resultado.R} kJ/(kg·K)\n`;

                procedimiento += `\nFórmula para proceso politrópico:\n`;
                procedimiento += `Δs = [cv + R/(n-1)]·ln(T₂/T₁)\n\n`;

                procedimiento += `Coeficiente: cv + R/(n-1)\n`;
                procedimiento += `  = ${resultado.cv} + ${resultado.R}/(${resultado.n}-1)\n`;
                procedimiento += `  = ${resultado.cv} + ${(resultado.R/(resultado.n-1)).toFixed(4)}\n`;
                procedimiento += `  = ${resultado.coeficiente.toFixed(4)} kJ/(kg·K)\n\n`;

                procedimiento += `Razón de temperaturas: T₂/T₁ = ${resultado.T2}/${resultado.T1} = ${resultado.razon_temperaturas.toFixed(4)}\n`;
                procedimiento += `ln(${resultado.razon_temperaturas.toFixed(4)}) = ${resultado.ln_T.toFixed(4)}\n\n`;

                procedimiento += `Δs = ${resultado.coeficiente.toFixed(4)} × ${resultado.ln_T.toFixed(4)} = ${resultado.delta_s.toFixed(6)} kJ/(kg·K)\n\n`;

                procedimiento += `Cambio de entropía total:\n`;
                procedimiento += `ΔS = m × Δs = ${resultado.m} × ${resultado.delta_s.toFixed(6)} = ${resultado.delta_S.toFixed(6)} kJ/K\n`;
            }
            break;
    }

    return procedimiento;
}

// ============================================================================
// GRÁFICOS
// ============================================================================

/**
 * Genera el diagrama T-s (Temperatura-Entropía)
 */
function generarGraficoTS(resultado) {
    // Generar puntos para la curva del proceso
    const puntos = generarPuntosProceso(resultado);

    // Datos para Plotly
    const traceLinea = {
        x: puntos.x,
        y: puntos.y,
        mode: 'lines',
        name: 'Proceso',
        line: {
            color: '#42a5f5',
            width: 3
        }
    };

    const traceEstado1 = {
        x: [puntos.x[0]],
        y: [puntos.y[0]],
        mode: 'markers+text',
        name: 'Estado 1',
        marker: {
            color: '#4CAF50',
            size: 12,
            symbol: 'circle'
        },
        text: ['1'],
        textposition: 'top center',
        textfont: { color: '#4CAF50', size: 12 }
    };

    const traceEstado2 = {
        x: [puntos.x[puntos.x.length - 1]],
        y: [puntos.y[puntos.y.length - 1]],
        mode: 'markers+text',
        name: 'Estado 2',
        marker: {
            color: '#F44336',
            size: 12,
            symbol: 'circle'
        },
        text: ['2'],
        textposition: 'top center',
        textfont: { color: '#F44336', size: 12 }
    };

    const layout = {
        title: {
            text: `Diagrama T-s: ${resultado.tipo_proceso}`,
            font: { color: '#e0e0e0', size: 18 }
        },
        xaxis: {
            title: 'Entropía específica s [kJ/(kg·K)]',
            gridcolor: '#404040',
            tickfont: { color: '#b0b0b0' },
            titlefont: { color: '#e0e0e0' }
        },
        yaxis: {
            title: 'Temperatura T [K]',
            gridcolor: '#404040',
            tickfont: { color: '#b0b0b0' },
            titlefont: { color: '#e0e0e0' }
        },
        plot_bgcolor: '#1a1a1a',
        paper_bgcolor: '#0f0f0f',
        font: { color: '#e0e0e0' },
        hovermode: 'closest',
        showlegend: true,
        legend: {
            bgcolor: 'rgba(0,0,0,0.5)',
            bordercolor: '#404040',
            borderwidth: 1
        }
    };

    Plotly.newPlot('diagrama-ts', [traceLinea, traceEstado1, traceEstado2], layout, {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    });
}

/**
 * Genera los puntos para el diagrama T-s según el tipo de proceso
 */
function generarPuntosProceso(resultado) {
    const puntos = { x: [], y: [] };
    const numPuntos = 50;

    switch (resultado.tipo_proceso) {
        case 'T-V (Temperatura y Volumen)':
            // Interpolar entre estado 1 y 2
            for (let i = 0; i < numPuntos; i++) {
                const factor = i / (numPuntos - 1);
                const T = resultado.T1 + factor * (resultado.T2 - resultado.T1);
                const v = resultado.v1 + factor * (resultado.v2 - resultado.v1);

                // Calcular entropía para este punto
                const s = resultado.cv * Math.log(T / resultado.T1) + resultado.R * Math.log(v / resultado.v1);
                puntos.x.push(s);
                puntos.y.push(T);
            }
            break;

        case 'T-P (Temperatura y Presión)':
            for (let i = 0; i < numPuntos; i++) {
                const factor = i / (numPuntos - 1);
                const T = resultado.T1 + factor * (resultado.T2 - resultado.T1);
                const P = resultado.P1 + factor * (resultado.P2 - resultado.P1);

                const s = resultado.cp * Math.log(T / resultado.T1) - resultado.R * Math.log(P / resultado.P1);
                puntos.x.push(s);
                puntos.y.push(T);
            }
            break;

        case 'Isotérmico (T = constante)':
            const T_iso = resultado.T;
            if (resultado.modo === 'volumen') {
                for (let i = 0; i < numPuntos; i++) {
                    const factor = i / (numPuntos - 1);
                    const v = resultado.v1 + factor * (resultado.v2 - resultado.v1);
                    const s = resultado.R * Math.log(v / resultado.v1);
                    puntos.x.push(s);
                    puntos.y.push(T_iso);
                }
            } else {
                for (let i = 0; i < numPuntos; i++) {
                    const factor = i / (numPuntos - 1);
                    const P = resultado.P1 + factor * (resultado.P2 - resultado.P1);
                    const s = -resultado.R * Math.log(P / resultado.P1);
                    puntos.x.push(s);
                    puntos.y.push(T_iso);
                }
            }
            break;

        case 'Isobárico (P = constante)':
            for (let i = 0; i < numPuntos; i++) {
                const factor = i / (numPuntos - 1);
                const T = resultado.T1 + factor * (resultado.T2 - resultado.T1);
                const s = resultado.cp * Math.log(T / resultado.T1);
                puntos.x.push(s);
                puntos.y.push(T);
            }
            break;

        case 'Isocórico (V = constante)':
            for (let i = 0; i < numPuntos; i++) {
                const factor = i / (numPuntos - 1);
                const T = resultado.T1 + factor * (resultado.T2 - resultado.T1);
                const s = resultado.cv * Math.log(T / resultado.T1);
                puntos.x.push(s);
                puntos.y.push(T);
            }
            break;

        default:
            if (resultado.tipo_proceso.includes('Politrópico')) {
                for (let i = 0; i < numPuntos; i++) {
                    const factor = i / (numPuntos - 1);
                    const T = resultado.T1 + factor * (resultado.T2 - resultado.T1);
                    const s = resultado.coeficiente * Math.log(T / resultado.T1);
                    puntos.x.push(s);
                    puntos.y.push(T);
                }
            }
    }

    return puntos;
}

/**
 * Genera gráfico de Entropía vs. Volumen Final
 */
function generarGraficoEntropiaVolumen(resultado) {
    const tipo = resultado.tipo_proceso;
    
    // Solo para procesos T-V o Isotérmico por volumen
    if (!tipo.includes('T-V') && !(tipo.includes('Isotérmico') && resultado.modo === 'volumen')) {
        // Para otros procesos, mostrar un gráfico paramétrico genérico
        generarGraficoParametricoGenerico(resultado, 'volumen');
        return;
    }

    const datosX = [];
    const datosY = [];
    const v1 = resultado.v1;
    const numPuntos = 50;
    const v_min = v1 * 0.5;
    const v_max = v1 * 3.0;

    for (let i = 0; i < numPuntos; i++) {
        const v2 = v_min + (i / (numPuntos - 1)) * (v_max - v_min);
        let delta_s = 0;

        if (tipo.includes('T-V')) {
            // Δs = cv·ln(T₂/T₁) + R·ln(v₂/v₁)
            const termino_T = resultado.cv * Math.log(resultado.T2 / resultado.T1);
            const termino_V = resultado.R * Math.log(v2 / v1);
            delta_s = termino_T + termino_V;
        } else if (tipo.includes('Isotérmico') && resultado.modo === 'volumen') {
            // Δs = R·ln(v₂/v₁)
            delta_s = resultado.R * Math.log(v2 / v1);
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
            color: '#42a5f5',
            width: 3
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(66, 165, 245, 0.2)'
    };

    const puntoActual = {
        x: [resultado.v2],
        y: [resultado.delta_s],
        mode: 'markers',
        name: 'Punto Actual',
        marker: {
            color: '#FF9800',
            size: 10,
            symbol: 'diamond'
        }
    };

    const layout = {
        title: {
            text: `Entropía Específica vs. Volumen Final (v₂)`,
            font: { color: '#e0e0e0', size: 16 }
        },
        xaxis: {
            title: 'Volumen Específico Final v₂ [m³/kg]',
            gridcolor: '#404040',
            tickfont: { color: '#b0b0b0' },
            titlefont: { color: '#e0e0e0' }
        },
        yaxis: {
            title: 'Cambio de Entropía Δs [kJ/(kg·K)]',
            gridcolor: '#404040',
            tickfont: { color: '#b0b0b0' },
            titlefont: { color: '#e0e0e0' }
        },
        plot_bgcolor: '#1a1a1a',
        paper_bgcolor: '#0f0f0f',
        font: { color: '#e0e0e0' },
        hovermode: 'closest',
        showlegend: true,
        margin: { l: 60, r: 40, t: 50, b: 50 }
    };

    Plotly.newPlot('grafico-entropia-volumen', [trace, puntoActual], layout, {
        responsive: true,
        displayModeBar: true
    });
}

/**
 * Genera gráfico de Entropía vs. Temperatura Final
 */
function generarGraficoEntropiaTemperatura(resultado) {
    const tipo = resultado.tipo_proceso;
    
    const datosX = [];
    const datosY = [];
    const T1 = resultado.T1;
    const numPuntos = 50;
    const T_min = T1 * 0.5;
    const T_max = T1 * 3.0;

    for (let i = 0; i < numPuntos; i++) {
        const T2 = T_min + (i / (numPuntos - 1)) * (T_max - T_min);
        let delta_s = 0;

        if (tipo.includes('T-V')) {
            // Δs = cv·ln(T₂/T₁) + R·ln(v₂/v₁)
            const termino_T = resultado.cv * Math.log(T2 / T1);
            const termino_V = resultado.R * Math.log(resultado.v2 / resultado.v1);
            delta_s = termino_T + termino_V;
        } else if (tipo.includes('T-P')) {
            // Δs = cp·ln(T₂/T₁) - R·ln(P₂/P₁)
            const termino_T = resultado.cp * Math.log(T2 / T1);
            const termino_P = -resultado.R * Math.log(resultado.P2 / resultado.P1);
            delta_s = termino_T + termino_P;
        } else if (tipo.includes('Isobárico')) {
            // Δs = cp·ln(T₂/T₁)
            delta_s = resultado.cp * Math.log(T2 / T1);
        } else if (tipo.includes('Isocórico')) {
            // Δs = cv·ln(T₂/T₁)
            delta_s = resultado.cv * Math.log(T2 / T1);
        } else if (tipo.includes('Politrópico')) {
            // Δs = [cv + R/(n-1)]·ln(T₂/T₁)
            delta_s = resultado.coeficiente * Math.log(T2 / T1);
        } else {
            // Isotérmico
            delta_s = resultado.delta_s; // No cambia con T
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
            color: '#4CAF50',
            width: 3
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(76, 175, 80, 0.2)'
    };

    const puntoActual = {
        x: [resultado.T2],
        y: [resultado.delta_s],
        mode: 'markers',
        name: 'Punto Actual',
        marker: {
            color: '#FF9800',
            size: 10,
            symbol: 'diamond'
        }
    };

    const layout = {
        title: {
            text: `Entropía Específica vs. Temperatura Final (T₂)`,
            font: { color: '#e0e0e0', size: 16 }
        },
        xaxis: {
            title: 'Temperatura Final T₂ [K]',
            gridcolor: '#404040',
            tickfont: { color: '#b0b0b0' },
            titlefont: { color: '#e0e0e0' }
        },
        yaxis: {
            title: 'Cambio de Entropía Δs [kJ/(kg·K)]',
            gridcolor: '#404040',
            tickfont: { color: '#b0b0b0' },
            titlefont: { color: '#e0e0e0' }
        },
        plot_bgcolor: '#1a1a1a',
        paper_bgcolor: '#0f0f0f',
        font: { color: '#e0e0e0' },
        hovermode: 'closest',
        showlegend: true,
        margin: { l: 60, r: 40, t: 50, b: 50 }
    };

    Plotly.newPlot('grafico-entropia-temperatura', [trace, puntoActual], layout, {
        responsive: true,
        displayModeBar: true
    });
}

/**
 * Genera gráfico paramétrico genérico para procesos especiales
 */
function generarGraficoParametricoGenerico(resultado, tipo) {
    // Placeholder para procesos especiales
    // Esto se puede expandir según sea necesario
}
