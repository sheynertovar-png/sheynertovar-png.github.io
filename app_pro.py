"""
EntropySolver PRO - Solucionador Profesional de Problemas de Entropía
Versión Avanzada con Balance de Entropía y Generación de Entropía
Basado en Cengel & Boles y Wark & Richards
Desarrollado para fines académicos en Termodinámica Aplicada
"""

from flask import Flask, render_template, request, jsonify, send_file
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
import math
from datetime import datetime
import io
import os

from entropy_engine import IdealGasEntropySolver, build_random_exercise, evaluate_student_answer

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# ============================================================================
# CONSTANTES DE GASES IDEALES EXPANDIDAS (Cengel & Boles + Wark & Richards)
# ============================================================================
CONSTANTES_GASES = {
    'aire': {
        'nombre': 'Aire',
        'R': 0.287,      # kJ/(kg·K)
        'cp': 1.005,     # kJ/(kg·K)
        'cv': 0.718,     # kJ/(kg·K)
        'gamma': 1.4,    # cp/cv
        'M': 28.97,      # kg/kmol
        'grupo': 'Diatómico'
    },
    'nitrogeno': {
        'nombre': 'Nitrógeno (N₂)',
        'R': 0.2968,
        'cp': 1.039,
        'cv': 0.743,
        'gamma': 1.40,
        'M': 28.014,
        'grupo': 'Diatómico'
    },
    'oxigeno': {
        'nombre': 'Oxígeno (O₂)',
        'R': 0.2598,
        'cp': 0.918,
        'cv': 0.658,
        'gamma': 1.40,
        'M': 31.999,
        'grupo': 'Diatómico'
    },
    'argon': {
        'nombre': 'Argón (Ar)',
        'R': 0.2081,
        'cp': 0.520,
        'cv': 0.312,
        'gamma': 1.67,
        'M': 39.95,
        'grupo': 'Monoatómico'
    },
    'hidrogeno': {
        'nombre': 'Hidrógeno (H₂)',
        'R': 4.124,
        'cp': 14.307,
        'cv': 10.183,
        'gamma': 1.405,
        'M': 2.016,
        'grupo': 'Diatómico'
    },
    'helio': {
        'nombre': 'Helio (He)',
        'R': 2.077,
        'cp': 5.193,
        'cv': 3.116,
        'gamma': 1.667,
        'M': 4.003,
        'grupo': 'Monoatómico'
    },
    'co2': {
        'nombre': 'Dióxido de Carbono (CO₂)',
        'R': 0.1889,
        'cp': 0.846,
        'cv': 0.657,
        'gamma': 1.29,
        'M': 44.01,
        'grupo': 'Poliatómico'
    },
    'h2o': {
        'nombre': 'Vapor de Agua (H₂O)',
        'R': 0.4615,
        'cp': 1.872,
        'cv': 1.410,
        'gamma': 1.327,
        'M': 18.015,
        'grupo': 'Poliatómico'
    }
}

# ============================================================================
# CLASE PARA CÁLCULOS AVANZADOS DE ENTROPÍA
# ============================================================================

class CalculadoraEntropiaAvanzada:
    """Clase que encapsula todos los cálculos termodinámicos avanzados"""
    
    def __init__(self, gas_name, m=1.0):
        if gas_name not in CONSTANTES_GASES:
            raise ValueError(f"Gas no reconocido: {gas_name}")
        self.gas = CONSTANTES_GASES[gas_name]
        self.gas_name = gas_name
        self.m = m
    
    def calcular_delta_s_tv(self, T1, T2, v1, v2):
        """Δs = cv·ln(T₂/T₁) + R·ln(v₂/v₁)"""
        cv = self.gas['cv']
        R = self.gas['R']
        
        razon_T = T2 / T1
        ln_T = math.log(razon_T)
        termino1 = cv * ln_T
        
        razon_v = v2 / v1
        ln_v = math.log(razon_v)
        termino2 = R * ln_v
        
        delta_s = termino1 + termino2
        
        return {
            'delta_s': delta_s,
            'delta_S': self.m * delta_s,
            'termino_temperatura': termino1,
            'termino_volumen': termino2,
            'razon_temperaturas': razon_T,
            'razon_volumenes': razon_v,
            'datos': {'T1': T1, 'T2': T2, 'v1': v1, 'v2': v2}
        }
    
    def calcular_delta_s_tp(self, T1, T2, P1, P2):
        """Δs = cp·ln(T₂/T₁) - R·ln(P₂/P₁)"""
        cp = self.gas['cp']
        R = self.gas['R']
        
        razon_T = T2 / T1
        ln_T = math.log(razon_T)
        termino1 = cp * ln_T
        
        razon_P = P2 / P1
        ln_P = math.log(razon_P)
        termino2 = -R * ln_P
        
        delta_s = termino1 + termino2
        
        return {
            'delta_s': delta_s,
            'delta_S': self.m * delta_s,
            'termino_temperatura': termino1,
            'termino_presion': termino2,
            'razon_temperaturas': razon_T,
            'razon_presiones': razon_P,
            'datos': {'T1': T1, 'T2': T2, 'P1': P1, 'P2': P2}
        }
    
    def calcular_generacion_entropia(self, delta_S, Q, T_amb):
        """
        Balance de entropía: ΔS = Q/T_amb + Sgen
        Sgen = ΔS - Q/T_amb
        """
        if T_amb <= 0:
            raise ValueError("Temperatura ambiente debe ser > 0")
        
        Q_sobre_T = Q / T_amb
        Sgen = delta_S - Q_sobre_T
        
        # Determinar reversibilidad
        if abs(Sgen) < 1e-6:
            reversibilidad = "Reversible"
            estado = "reversible"
        elif Sgen > 0:
            reversibilidad = "Irreversible (Posible)"
            estado = "irreversible"
        else:
            reversibilidad = "Imposible (Segunda Ley violada)"
            estado = "imposible"
        
        return {
            'Sgen': Sgen,
            'Q_sobre_T': Q_sobre_T,
            'reversibilidad': reversibilidad,
            'estado': estado
        }
    
    def determinar_tipo_proceso(self, T1, T2, P1, P2, v1, v2):
        """Determina automáticamente el tipo de proceso"""
        tolerancia = 0.01
        
        tipos = []
        
        # Isotérmico
        if abs((T2 - T1) / T1) < tolerancia:
            tipos.append("Isotérmico (T = constante)")
        
        # Isobárico
        if abs((P2 - P1) / P1) < tolerancia:
            tipos.append("Isobárico (P = constante)")
        
        # Isocórico
        if abs((v2 - v1) / v1) < tolerancia:
            tipos.append("Isocórico (V = constante)")
        
        # Adiabático reversible (isentrópico)
        # Para esto necesitaríamos calcular primero, así que lo dejamos para después
        
        if not tipos:
            tipos.append("Proceso General")
        
        return tipos

# ============================================================================
# RUTAS FLASK
# ============================================================================

@app.route('/')
def index():
    """Página principal - versión PRO"""
    return render_template('pro.html')

@app.route('/v1')
def index_v1():
    """Página de versión 1 (anterior)"""
    return render_template('index.html')

def _resolver_con_motor(datos):
    gas_name = (datos.get('gas') or 'aire').lower()
    if gas_name not in CONSTANTES_GASES:
        raise ValueError(f'Gas no reconocido: {gas_name}')

    masa = float(datos.get('masa', 1.0) or 1.0)
    if masa <= 0:
        raise ValueError('La masa debe ser mayor a cero')

    solver = IdealGasEntropySolver(gas_name, masa)
    payload = {
        'gas': gas_name,
        'mass': masa,
        'T1': datos.get('T1'),
        'T2': datos.get('T2'),
        'P1': datos.get('P1'),
        'P2': datos.get('P2'),
        'v1': datos.get('v1'),
        'v2': datos.get('v2'),
        'Q': datos.get('Q'),
        'W': datos.get('W'),
        'process_type': datos.get('process_type') or datos.get('tipo_proceso') or datos.get('tipo_calculo'),
        'delta_S': datos.get('delta_S'),
        'T_amb': datos.get('T_amb'),
        'solve_entropy_balance': bool(datos.get('solve_entropy_balance')),
    }

    if datos.get('tipo_calculo') == 'balance_entropia':
        payload['solve_entropy_balance'] = True
    elif datos.get('tipo_calculo') == 'generacion_entropia':
        payload['solve_entropy_balance'] = False

    resultado = solver.solve(payload)
    resultado['constantes'] = {
        'R': solver.R,
        'cp': solver.cp,
        'cv': solver.cv,
        'gamma': solver.k,
    }
    resultado['datos'] = {
        'T1': datos.get('T1'),
        'T2': datos.get('T2'),
        'P1': datos.get('P1'),
        'P2': datos.get('P2'),
        'v1': datos.get('v1'),
        'v2': datos.get('v2'),
        'Q': datos.get('Q'),
        'W': datos.get('W'),
        'process_type': resultado.get('process_type'),
    }
    resultado['procedimiento'] = '\n'.join(f'{i + 1}. {step}' for i, step in enumerate(resultado.get('steps', [])))
    resultado['interpretacion'] = resultado.get('interpretation', '')
    return resultado


@app.route('/api/calcular-avanzado', methods=['POST'])
def calcular_avanzado():
    """Endpoint avanzado para cálculos con balance de entropía"""
    try:
        datos = request.get_json()

        if not datos:
            return jsonify({'error': 'No se recibieron datos'}), 400

        gas_name = (datos.get('gas') or 'aire').lower()
        if gas_name not in CONSTANTES_GASES:
            return jsonify({'error': f'Gas no reconocido: {gas_name}'}), 400

        masa = float(datos.get('masa', 1.0) or 1.0)
        if masa <= 0:
            return jsonify({'error': 'La masa debe ser mayor a cero'}), 400

        tipo_calculo = datos.get('tipo_calculo', 'resolver_inteligente')
        calc = CalculadoraEntropiaAvanzada(gas_name, masa)
        resultado = {'gas': CONSTANTES_GASES[gas_name]['nombre']}

        if tipo_calculo in ('resolver_inteligente', 'delta_s_tv', 'delta_s_tp', 'procesos_especiales', 'balance_entropia'):
            motor_resultado = _resolver_con_motor(datos)
            resultado.update({
                'gas': motor_resultado['gas'],
                'gas_id': motor_resultado['gas_id'],
                'mass': motor_resultado['mass'],
                'delta_s': motor_resultado['delta_s'],
                'delta_S': motor_resultado['delta_S'],
                'formula': motor_resultado['formula'],
                'tipo_proceso': motor_resultado['process_type'],
                'method': motor_resultado['method'],
                'steps': motor_resultado['steps'],
                'decision_tree': motor_resultado['decision_tree'],
                'interpretation': motor_resultado['interpretation'],
                'procedimiento': motor_resultado['procedimiento'],
                'datos': motor_resultado['datos'],
                'missing_data': motor_resultado['missing_data'],
                'constantes': motor_resultado['constantes'],
                'solved': motor_resultado['solved'],
            })
            return jsonify(resultado), 200

        if tipo_calculo == 'delta_s_tv':
            T1 = float(datos.get('T1'))
            T2 = float(datos.get('T2'))
            v1 = float(datos.get('v1'))
            v2 = float(datos.get('v2'))

            if T1 <= 0 or T2 <= 0 or v1 <= 0 or v2 <= 0:
                return jsonify({'error': 'Valores inválidos'}), 400

            res = calc.calcular_delta_s_tv(T1, T2, v1, v2)
            resultado.update(res)
            resultado['tipo_proceso'] = 'T-V'
            resultado['formula'] = 'Δs = cv·ln(T₂/T₁) + R·ln(v₂/v₁)'
            resultado['datos'] = {'T1': T1, 'T2': T2, 'v1': v1, 'v2': v2}

        elif tipo_calculo == 'delta_s_tp':
            T1 = float(datos.get('T1'))
            T2 = float(datos.get('T2'))
            P1 = float(datos.get('P1'))
            P2 = float(datos.get('P2'))

            if T1 <= 0 or T2 <= 0 or P1 <= 0 or P2 <= 0:
                return jsonify({'error': 'Valores inválidos'}), 400

            res = calc.calcular_delta_s_tp(T1, T2, P1, P2)
            resultado.update(res)
            resultado['tipo_proceso'] = 'T-P'
            resultado['formula'] = 'Δs = cp·ln(T₂/T₁) - R·ln(P₂/P₁)'
            resultado['datos'] = {'T1': T1, 'T2': T2, 'P1': P1, 'P2': P2}

        elif tipo_calculo == 'generacion_entropia':
            delta_S = float(datos.get('delta_S'))
            Q = float(datos.get('Q'))
            T_amb = float(datos.get('T_amb'))

            if T_amb <= 0:
                return jsonify({'error': 'Temperatura ambiente inválida'}), 400

            res = calc.calcular_generacion_entropia(delta_S, Q, T_amb)
            resultado.update(res)
            resultado['tipo_calculo'] = 'Generación de Entropía'

        resultado['constantes'] = {
            'R': calc.gas['R'],
            'cp': calc.gas['cp'],
            'cv': calc.gas['cv'],
            'gamma': calc.gas['gamma']
        }

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500


@app.route('/api/solver-inteligente', methods=['POST'])
def solver_inteligente():
    try:
        datos = request.get_json() or {}
        resultado = _resolver_con_motor(datos)
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500


@app.route('/api/procedimiento-detallado', methods=['POST'])
def procedimiento_detallado():
    try:
        datos = request.get_json() or {}
        resultado = _resolver_con_motor(datos)
        return jsonify({'procedimiento': resultado.get('procedimiento', ''), 'pasos': resultado.get('steps', []), 'interpretacion': resultado.get('interpretation', '')}), 200
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500


@app.route('/api/ejercicio-aleatorio', methods=['GET'])
def ejercicio_aleatorio():
    try:
        return jsonify(build_random_exercise()), 200
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500


@app.route('/api/verificar-respuesta', methods=['POST'])
def verificar_respuesta():
    try:
        datos = request.get_json() or {}
        respuesta = datos.get('respuesta')
        esperado = datos.get('esperado')
        return jsonify(evaluate_student_answer(respuesta, esperado)), 200
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500

@app.route('/api/gases-pro')
def gases_pro():
    """Obtiene lista de gases disponibles en versión PRO"""
    return jsonify({
        gas_id: {
            'nombre': gas['nombre'],
            'grupo': gas['grupo'],
            'M': gas['M']
        }
        for gas_id, gas in CONSTANTES_GASES.items()
    }), 200

@app.route('/api/constantes-gas/<gas>')
def constantes_gas(gas):
    """Obtiene todas las constantes de un gas"""
    gas = gas.lower()
    if gas in CONSTANTES_GASES:
        return jsonify(CONSTANTES_GASES[gas]), 200
    return jsonify({'error': 'Gas no encontrado'}), 404

@app.route('/api/exportar-pdf', methods=['POST'])
def exportar_pdf():
    """Exporta los resultados a PDF profesional"""
    try:
        datos = request.get_json()
        
        # Crear PDF en memoria
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=0.75*inch, leftMargin=0.75*inch,
                                topMargin=0.75*inch, bottomMargin=0.75*inch)
        
        story = []
        styles = getSampleStyleSheet()
        
        # Estilos personalizados
        titulo_style = ParagraphStyle(
            'TituloCustom',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1B5E20'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'HeadingCustom',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2E7D32'),
            spaceAfter=10,
            spaceBefore=10
        )
        
        # Título
        story.append(Paragraph('EntropySolver PRO - Reporte de Cálculo', titulo_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Información general
        info_text = f"""
        <b>Fecha:</b> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}<br/>
        <b>Gas:</b> {datos.get('gas', 'N/A')}<br/>
        <b>Tipo de Proceso:</b> {datos.get('tipo_proceso', 'N/A')}<br/>
        <b>Masa:</b> {datos.get('masa', 1.0)} kg
        """
        story.append(Paragraph(info_text, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Datos de entrada
        story.append(Paragraph('Datos de Entrada', heading_style))
        story.append(Spacer(1, 0.1*inch))
        
        entrada_text = datos.get('datos_entrada', 'No disponible')
        story.append(Paragraph(str(entrada_text), styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Fórmula
        story.append(Paragraph('Ecuaciones Utilizadas', heading_style))
        story.append(Spacer(1, 0.1*inch))
        formula_text = datos.get('formula', 'No disponible')
        story.append(Paragraph(f"<b>{formula_text}</b>", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Resultados
        story.append(Paragraph('Resultados', heading_style))
        story.append(Spacer(1, 0.1*inch))
        
        resultados_text = f"""
        <b>Δs (Entropía específica):</b> {datos.get('delta_s', 'N/A')} kJ/(kg·K)<br/>
        <b>ΔS (Entropía total):</b> {datos.get('delta_S', 'N/A')} kJ/K<br/>
        """
        
        if 'Sgen' in datos:
            resultados_text += f"<b>Sgen (Generación):</b> {datos.get('Sgen', 'N/A')} kJ/K<br/>"
            resultados_text += f"<b>Reversibilidad:</b> {datos.get('reversibilidad', 'N/A')}<br/>"
        
        story.append(Paragraph(resultados_text, styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # Procedimiento
        story.append(Paragraph('Procedimiento', heading_style))
        story.append(Spacer(1, 0.1*inch))
        procedimiento_text = datos.get('procedimiento', 'No disponible')
        story.append(Paragraph(procedimiento_text, styles['Normal']))
        
        # Construir PDF
        doc.build(story)
        
        buffer.seek(0)
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"entropysolver_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )
    
    except Exception as e:
        return jsonify({'error': f'Error al generar PDF: {str(e)}'}), 500

# ============================================================================
# RUTAS COMPATIBILIDAD CON V1
# ============================================================================

@app.route('/api/calcular', methods=['POST'])
def calcular():
    """Compatibilidad con versión anterior"""
    return calcular_avanzado()

@app.route('/api/gases')
def obtener_gases():
    """Lista de gases para compatibilidad"""
    return jsonify(list(CONSTANTES_GASES.keys())), 200

# ============================================================================
# EJECUCIÓN
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*80)
    print(" EntropySolver PRO - Solucionador Avanzado de Problemas de Entropía")
    print("="*80)
    print(" 🚀 Iniciando servidor Flask...")
    print(" 📍 Accede a: http://localhost:5000")
    print(" 📚 Basado en Cengel & Boles y Wark & Richards")
    print(" 🎨 Paleta de colores: Verde profesional y oscuro")
    print(" 📊 Características: Balance de Entropía | Generación | Reversibilidad")
    print("="*80 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
