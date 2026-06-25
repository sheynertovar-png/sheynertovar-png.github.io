"""
EntropySolver Web - Calculadora de Entropía para Gases Ideales
Basado en teoría de Cengel & Boles y Wark & Richards
Desarrollado para fines académicos en Termodinámica
"""

from flask import Flask, render_template, request, jsonify
import math
from datetime import datetime

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# ============================================================================
# CONSTANTES DE GASES IDEALES (Valores basados en Cengel & Boles)
# ============================================================================
CONSTANTES_GASES = {
    'aire': {
        'R': 0.287,      # kJ/(kg·K)
        'cp': 1.005,     # kJ/(kg·K)
        'cv': 0.718,     # kJ/(kg·K)
        'gamma': 1.4,    # cp/cv
        'M': 28.97       # kg/kmol
    },
    'nitrogeno': {
        'R': 0.2968,
        'cp': 1.039,
        'cv': 0.743,
        'gamma': 1.40,
        'M': 28.014
    },
    'oxigeno': {
        'R': 0.2598,
        'cp': 0.918,
        'cv': 0.658,
        'gamma': 1.40,
        'M': 31.999
    },
    'argon': {
        'R': 0.2081,
        'cp': 0.520,
        'cv': 0.312,
        'gamma': 1.67,
        'M': 39.95
    },
    'hidrogeno': {
        'R': 4.124,
        'cp': 14.307,
        'cv': 10.183,
        'gamma': 1.405,
        'M': 2.016
    }
}

# ============================================================================
# FUNCIONES DE CÁLCULO DE ENTROPÍA
# ============================================================================

def calcular_delta_s_tv(T1, T2, v1, v2, gas_name, m=1.0):
    """
    Calcula el cambio de entropía específica usando Δs = cv·ln(T₂/T₁) + R·ln(v₂/v₁)
    Fórmula de Cengel & Boles para gases ideales
    """
    if gas_name not in CONSTANTES_GASES:
        return None
    
    gas = CONSTANTES_GASES[gas_name]
    cv = gas['cv']
    R = gas['R']
    
    # Cálculos intermedios
    razon_temperaturas = T2 / T1
    ln_T = math.log(razon_temperaturas)
    termino1 = cv * ln_T
    
    razon_volumenes = v2 / v1
    ln_v = math.log(razon_volumenes)
    termino2 = R * ln_v
    
    # Cambio de entropía específica
    delta_s = termino1 + termino2
    
    # Cambio de entropía total
    delta_S = m * delta_s
    
    return {
        'delta_s': delta_s,
        'delta_S': delta_S,
        'T1': T1,
        'T2': T2,
        'v1': v1,
        'v2': v2,
        'cv': cv,
        'R': R,
        'm': m,
        'razon_temperaturas': razon_temperaturas,
        'ln_T': ln_T,
        'razon_volumenes': razon_volumenes,
        'ln_v': ln_v,
        'termino1': termino1,
        'termino2': termino2,
        'formula': 'Δs = cv·ln(T₂/T₁) + R·ln(v₂/v₁)',
        'formula_alternativa': 'ΔS = m·Δs',
        'gas': gas_name,
        'tipo_proceso': 'T-V (Temperatura y Volumen)'
    }

def calcular_delta_s_tp(T1, T2, P1, P2, gas_name, m=1.0):
    """
    Calcula el cambio de entropía específica usando Δs = cp·ln(T₂/T₁) - R·ln(P₂/P₁)
    Fórmula de Cengel & Boles para gases ideales
    """
    if gas_name not in CONSTANTES_GASES:
        return None
    
    gas = CONSTANTES_GASES[gas_name]
    cp = gas['cp']
    R = gas['R']
    
    # Cálculos intermedios
    razon_temperaturas = T2 / T1
    ln_T = math.log(razon_temperaturas)
    termino1 = cp * ln_T
    
    razon_presiones = P2 / P1
    ln_P = math.log(razon_presiones)
    termino2 = -R * ln_P
    
    # Cambio de entropía específica
    delta_s = termino1 + termino2
    
    # Cambio de entropía total
    delta_S = m * delta_s
    
    return {
        'delta_s': delta_s,
        'delta_S': delta_S,
        'T1': T1,
        'T2': T2,
        'P1': P1,
        'P2': P2,
        'cp': cp,
        'R': R,
        'm': m,
        'razon_temperaturas': razon_temperaturas,
        'ln_T': ln_T,
        'razon_presiones': razon_presiones,
        'ln_P': ln_P,
        'termino1': termino1,
        'termino2': termino2,
        'formula': 'Δs = cp·ln(T₂/T₁) - R·ln(P₂/P₁)',
        'formula_alternativa': 'ΔS = m·Δs',
        'gas': gas_name,
        'tipo_proceso': 'T-P (Temperatura y Presión)'
    }

def calcular_isotermico(T, v1, v2, P1, P2, gas_name, m=1.0, modo='volumen'):
    """
    Proceso isotérmico: T = constante
    Δs = R·ln(v₂/v₁) = -R·ln(P₂/P₁)
    """
    if gas_name not in CONSTANTES_GASES:
        return None
    
    gas = CONSTANTES_GASES[gas_name]
    R = gas['R']
    
    if modo == 'volumen':
        razon_volumenes = v2 / v1
        ln_v = math.log(razon_volumenes)
        delta_s = R * ln_v
    else:  # modo presion
        razon_presiones = P2 / P1
        ln_P = math.log(razon_presiones)
        delta_s = -R * ln_P
    
    delta_S = m * delta_s
    
    return {
        'delta_s': delta_s,
        'delta_S': delta_S,
        'T': T,
        'v1': v1 if modo == 'volumen' else None,
        'v2': v2 if modo == 'volumen' else None,
        'P1': P1 if modo == 'presion' else None,
        'P2': P2 if modo == 'presion' else None,
        'R': R,
        'm': m,
        'formula': 'Δs = R·ln(v₂/v₁)' if modo == 'volumen' else 'Δs = -R·ln(P₂/P₁)',
        'interpretacion': 'En proceso isotérmico (T=cte), el cambio de entropía depende solo de cambios de volumen o presión.',
        'gas': gas_name,
        'tipo_proceso': 'Isotérmico (T = constante)',
        'modo': modo
    }

def calcular_isobarico(T1, T2, P, gas_name, m=1.0):
    """
    Proceso isobárico: P = constante
    Δs = cp·ln(T₂/T₁)
    """
    if gas_name not in CONSTANTES_GASES:
        return None
    
    gas = CONSTANTES_GASES[gas_name]
    cp = gas['cp']
    
    razon_temperaturas = T2 / T1
    ln_T = math.log(razon_temperaturas)
    delta_s = cp * ln_T
    delta_S = m * delta_s
    
    return {
        'delta_s': delta_s,
        'delta_S': delta_S,
        'T1': T1,
        'T2': T2,
        'P': P,
        'cp': cp,
        'm': m,
        'razon_temperaturas': razon_temperaturas,
        'ln_T': ln_T,
        'formula': 'Δs = cp·ln(T₂/T₁)',
        'interpretacion': 'En proceso isobárico (P=cte), el cambio de entropía solo depende del cambio de temperatura.',
        'gas': gas_name,
        'tipo_proceso': 'Isobárico (P = constante)'
    }

def calcular_isocoro(T1, T2, V, gas_name, m=1.0):
    """
    Proceso isocórico: V = constante
    Δs = cv·ln(T₂/T₁)
    """
    if gas_name not in CONSTANTES_GASES:
        return None
    
    gas = CONSTANTES_GASES[gas_name]
    cv = gas['cv']
    
    razon_temperaturas = T2 / T1
    ln_T = math.log(razon_temperaturas)
    delta_s = cv * ln_T
    delta_S = m * delta_s
    
    return {
        'delta_s': delta_s,
        'delta_S': delta_S,
        'T1': T1,
        'T2': T2,
        'V': V,
        'cv': cv,
        'm': m,
        'razon_temperaturas': razon_temperaturas,
        'ln_T': ln_T,
        'formula': 'Δs = cv·ln(T₂/T₁)',
        'interpretacion': 'En proceso isocórico (V=cte), el cambio de entropía solo depende del cambio de temperatura.',
        'gas': gas_name,
        'tipo_proceso': 'Isocórico (V = constante)'
    }

def calcular_politropico(T1, T2, n, gas_name, m=1.0):
    """
    Proceso politrópico: PVⁿ = constante
    Δs = cv·ln(T₂/T₁) + R/(n-1)·ln(T₂/T₁) = [cv + R/(n-1)]·ln(T₂/T₁)
    """
    if gas_name not in CONSTANTES_GASES:
        return None
    
    # Caso especial: n=1 es isotérmico
    if abs(n - 1.0) < 0.001:
        return calcular_isotermico(T1, None, None, None, None, gas_name, m, 'volumen')
    
    gas = CONSTANTES_GASES[gas_name]
    cv = gas['cv']
    R = gas['R']
    
    razon_temperaturas = T2 / T1
    ln_T = math.log(razon_temperaturas)
    
    # Coeficiente de entropía para proceso politrópico
    coeficiente = cv + R / (n - 1)
    delta_s = coeficiente * ln_T
    delta_S = m * delta_s
    
    return {
        'delta_s': delta_s,
        'delta_S': delta_S,
        'T1': T1,
        'T2': T2,
        'n': n,
        'cv': cv,
        'R': R,
        'coeficiente': coeficiente,
        'm': m,
        'razon_temperaturas': razon_temperaturas,
        'ln_T': ln_T,
        'formula': 'Δs = [cv + R/(n-1)]·ln(T₂/T₁)',
        'interpretacion': f'En proceso politrópico con índice n={n:.3f}, la entropía sigue la relación generalizada.',
        'gas': gas_name,
        'tipo_proceso': f'Politrópico (n = {n})'
    }

def obtener_interpretacion_fisica(resultado):
    """
    Genera una interpretación física del cambio de entropía basada en Cengel & Boles
    """
    delta_s = resultado.get('delta_s', 0)
    delta_S = resultado.get('delta_S', 0)
    tipo = resultado.get('tipo_proceso', '')
    
    if delta_S > 0:
        if 'Isotérmico' in tipo:
            interpretacion = f"La entropía aumentó en {delta_S:.4f} kJ/K. En el proceso isotérmico, la expansión del gas provocó aumento irreversible de desorden molecular."
        elif 'Isobárico' in tipo:
            interpretacion = f"La entropía aumentó en {delta_S:.4f} kJ/K. El calentamiento a presión constante aumentó el desorden molecular del sistema."
        elif 'Isocórico' in tipo:
            interpretacion = f"La entropía aumentó en {delta_S:.4f} kJ/K. El calentamiento a volumen constante causó mayor movimiento molecular y desorden."
        elif 'Politrópico' in tipo:
            interpretacion = f"La entropía aumentó en {delta_S:.4f} kJ/K. El proceso politrópico permite expansión con aumento de desorden molecular."
        else:
            interpretacion = f"La entropía aumentó en {delta_S:.4f} kJ/K. El sistema ganó energía térmica y mayor desorden molecular."
    elif delta_S < 0:
        if 'Isotérmico' in tipo:
            interpretacion = f"La entropía disminuyó en {abs(delta_S):.4f} kJ/K. La compresión isotérmica requiere trabajo externo para ordenar el sistema."
        elif 'Isobárico' in tipo:
            interpretacion = f"La entropía disminuyó en {abs(delta_S):.4f} kJ/K. El enfriamiento a presión constante redujo el desorden molecular."
        elif 'Isocórico' in tipo:
            interpretacion = f"La entropía disminuyó en {abs(delta_S):.4f} kJ/K. El enfriamiento a volumen constante redujo la agitación molecular."
        elif 'Politrópico' in tipo:
            interpretacion = f"La entropía disminuyó en {abs(delta_S):.4f} kJ/K. La compresión politrópica requiere trabajo externo."
        else:
            interpretacion = f"La entropía disminuyó en {abs(delta_S):.4f} kJ/K. El sistema perdió energía térmica y experimentó menor desorden."
    else:
        interpretacion = f"La entropía no cambió (Δs = 0). El proceso fue reversible y adiabático o el sistema alcanzó equilibrio."
    
    return interpretacion

# ============================================================================
# RUTAS FLASK
# ============================================================================

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/api/calcular', methods=['POST'])
def calcular():
    """Endpoint API para cálculos de entropía"""
    try:
        datos = request.get_json()
        
        # Validaciones
        if not datos:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        tipo_proceso = datos.get('tipo_proceso', '')
        gas_name = datos.get('gas', 'aire').lower()
        
        if gas_name not in CONSTANTES_GASES:
            return jsonify({'error': f'Gas no reconocido: {gas_name}'}), 400
        
        # Validar masa
        try:
            masa = float(datos.get('masa', 1.0))
            if masa <= 0:
                return jsonify({'error': 'La masa debe ser mayor a cero'}), 400
        except ValueError:
            return jsonify({'error': 'Masa inválida'}), 400
        
        resultado = None
        
        # TIPO 1: T-V (Temperatura y Volumen)
        if tipo_proceso == 'tv':
            try:
                T1 = float(datos.get('T1'))
                T2 = float(datos.get('T2'))
                v1 = float(datos.get('v1'))
                v2 = float(datos.get('v2'))
                
                if T1 <= 0 or T2 <= 0:
                    return jsonify({'error': 'Las temperaturas deben ser mayores a 0 K'}), 400
                if v1 <= 0 or v2 <= 0:
                    return jsonify({'error': 'Los volúmenes específicos deben ser mayores a 0'}), 400
                
                resultado = calcular_delta_s_tv(T1, T2, v1, v2, gas_name, masa)
            except (ValueError, KeyError) as e:
                return jsonify({'error': f'Datos inválidos en T-V: {str(e)}'}), 400
        
        # TIPO 2: T-P (Temperatura y Presión)
        elif tipo_proceso == 'tp':
            try:
                T1 = float(datos.get('T1'))
                T2 = float(datos.get('T2'))
                P1 = float(datos.get('P1'))
                P2 = float(datos.get('P2'))
                
                if T1 <= 0 or T2 <= 0:
                    return jsonify({'error': 'Las temperaturas deben ser mayores a 0 K'}), 400
                if P1 <= 0 or P2 <= 0:
                    return jsonify({'error': 'Las presiones deben ser mayores a 0'}), 400
                
                resultado = calcular_delta_s_tp(T1, T2, P1, P2, gas_name, masa)
            except (ValueError, KeyError) as e:
                return jsonify({'error': f'Datos inválidos en T-P: {str(e)}'}), 400
        
        # TIPO 3: Isotérmico
        elif tipo_proceso == 'isotermico':
            try:
                T = float(datos.get('T'))
                modo = datos.get('modo_isotermico', 'volumen')
                
                if modo == 'volumen':
                    v1 = float(datos.get('v1'))
                    v2 = float(datos.get('v2'))
                    if v1 <= 0 or v2 <= 0:
                        return jsonify({'error': 'Los volúmenes específicos deben ser mayores a 0'}), 400
                    resultado = calcular_isotermico(T, v1, v2, None, None, gas_name, masa, 'volumen')
                else:
                    P1 = float(datos.get('P1'))
                    P2 = float(datos.get('P2'))
                    if P1 <= 0 or P2 <= 0:
                        return jsonify({'error': 'Las presiones deben ser mayores a 0'}), 400
                    resultado = calcular_isotermico(T, None, None, P1, P2, gas_name, masa, 'presion')
                
                if T <= 0:
                    return jsonify({'error': 'La temperatura debe ser mayor a 0 K'}), 400
            except (ValueError, KeyError) as e:
                return jsonify({'error': f'Datos inválidos en Isotérmico: {str(e)}'}), 400
        
        # TIPO 4: Isobárico
        elif tipo_proceso == 'isobarico':
            try:
                T1 = float(datos.get('T1'))
                T2 = float(datos.get('T2'))
                P = float(datos.get('P'))
                
                if T1 <= 0 or T2 <= 0:
                    return jsonify({'error': 'Las temperaturas deben ser mayores a 0 K'}), 400
                if P <= 0:
                    return jsonify({'error': 'La presión debe ser mayor a 0'}), 400
                
                resultado = calcular_isobarico(T1, T2, P, gas_name, masa)
            except (ValueError, KeyError) as e:
                return jsonify({'error': f'Datos inválidos en Isobárico: {str(e)}'}), 400
        
        # TIPO 5: Isocórico
        elif tipo_proceso == 'isocoro':
            try:
                T1 = float(datos.get('T1'))
                T2 = float(datos.get('T2'))
                V = float(datos.get('V'))
                
                if T1 <= 0 or T2 <= 0:
                    return jsonify({'error': 'Las temperaturas deben ser mayores a 0 K'}), 400
                if V <= 0:
                    return jsonify({'error': 'El volumen debe ser mayor a 0'}), 400
                
                resultado = calcular_isocoro(T1, T2, V, gas_name, masa)
            except (ValueError, KeyError) as e:
                return jsonify({'error': f'Datos inválidos en Isocórico: {str(e)}'}), 400
        
        # TIPO 6: Politrópico
        elif tipo_proceso == 'politropico':
            try:
                T1 = float(datos.get('T1'))
                T2 = float(datos.get('T2'))
                n = float(datos.get('n'))
                
                if T1 <= 0 or T2 <= 0:
                    return jsonify({'error': 'Las temperaturas deben ser mayores a 0 K'}), 400
                if n <= 0:
                    return jsonify({'error': 'El índice politrópico debe ser mayor a 0'}), 400
                
                resultado = calcular_politropico(T1, T2, n, gas_name, masa)
            except (ValueError, KeyError) as e:
                return jsonify({'error': f'Datos inválidos en Politrópico: {str(e)}'}), 400
        
        else:
            return jsonify({'error': 'Tipo de proceso no reconocido'}), 400
        
        if not resultado:
            return jsonify({'error': 'Error al realizar el cálculo'}), 500
        
        # Agregar interpretación física
        resultado['interpretacion_fisica'] = obtener_interpretacion_fisica(resultado)
        
        return jsonify(resultado), 200
    
    except Exception as e:
        return jsonify({'error': f'Error en servidor: {str(e)}'}), 500

@app.route('/api/constantes/<gas>')
def obtener_constantes(gas):
    """Obtiene las constantes de un gas específico"""
    gas = gas.lower()
    if gas in CONSTANTES_GASES:
        return jsonify(CONSTANTES_GASES[gas]), 200
    return jsonify({'error': 'Gas no encontrado'}), 404

@app.route('/api/gases')
def obtener_gases():
    """Obtiene la lista de gases disponibles"""
    return jsonify(list(CONSTANTES_GASES.keys())), 200

# ============================================================================
# EJECUCIÓN
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*70)
    print(" EntropySolver Web - Calculadora de Entropía para Gases Ideales")
    print("="*70)
    print(" 🚀 Iniciando servidor Flask...")
    print(" 📍 Accede a: http://localhost:5000")
    print(" 📚 Basado en teoría de Cengel & Boles y Wark & Richards")
    print("="*70 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
