import math
import random
from typing import Optional


GAS_PROPERTIES = {
    'aire': {
        'nombre': 'Aire',
        'R': 0.287,
        'cp': 1.005,
        'cv': 0.718,
        'gamma': 1.4,
        's0_points': [(300, 1.70203), (500, 2.21952), (800, 2.7980), (1000, 3.1100)],
    },
    'nitrogeno': {
        'nombre': 'Nitrógeno (N₂)',
        'R': 0.2968,
        'cp': 1.039,
        'cv': 0.743,
        'gamma': 1.40,
        's0_points': [(300, 1.6950), (500, 2.1800), (800, 2.6500), (1000, 2.9650)],
    },
    'oxigeno': {
        'nombre': 'Oxígeno (O₂)',
        'R': 0.2598,
        'cp': 0.918,
        'cv': 0.658,
        'gamma': 1.40,
        's0_points': [(300, 1.6800), (500, 2.1100), (800, 2.5600), (1000, 2.8800)],
    },
    'argon': {
        'nombre': 'Argón (Ar)',
        'R': 0.2081,
        'cp': 0.520,
        'cv': 0.312,
        'gamma': 1.67,
        's0_points': [(300, 1.6100), (500, 1.9700), (800, 2.3000), (1000, 2.5800)],
    },
    'hidrogeno': {
        'nombre': 'Hidrógeno (H₂)',
        'R': 4.124,
        'cp': 14.307,
        'cv': 10.183,
        'gamma': 1.405,
        's0_points': [(300, 1.7900), (500, 2.3000), (800, 2.8000), (1000, 3.1000)],
    },
    'helio': {
        'nombre': 'Helio (He)',
        'R': 2.077,
        'cp': 5.193,
        'cv': 3.116,
        'gamma': 1.667,
        's0_points': [(300, 1.7200), (500, 2.2000), (800, 2.6200), (1000, 2.9400)],
    },
    'co2': {
        'nombre': 'Dióxido de Carbono (CO₂)',
        'R': 0.1889,
        'cp': 0.846,
        'cv': 0.657,
        'gamma': 1.29,
        's0_points': [(300, 1.7400), (500, 2.1500), (800, 2.5200), (1000, 2.7900)],
    },
    'h2o': {
        'nombre': 'Vapor de Agua (H₂O)',
        'R': 0.4615,
        'cp': 1.872,
        'cv': 1.410,
        'gamma': 1.327,
        's0_points': [(300, 1.9300), (500, 2.4700), (800, 2.9800), (1000, 3.3400)],
    },
}


class IdealGasEntropySolver:
    def __init__(self, gas_name='aire', mass=1.0):
        gas_name = (gas_name or 'aire').lower()
        if gas_name not in GAS_PROPERTIES:
            raise ValueError(f'Gas no reconocido: {gas_name}')
        self.gas_name = gas_name
        self.gas = GAS_PROPERTIES[gas_name]
        self.mass = float(mass or 1.0)
        self.R = self.gas['R']
        self.cp = self.gas['cp']
        self.cv = self.gas['cv']
        self.k = self.gas['gamma']

    def _to_float(self, value):
        if value in (None, '', 'None', 'nan', 'NaN'):
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _normalize_process_type(self, process_type):
        if not process_type:
            return 'auto'
        value = str(process_type).strip().lower()
        aliases = {
            'auto': 'auto',
            'automatico': 'auto',
            'isotermico': 'isotermico',
            'isotérmico': 'isotermico',
            'isothermal': 'isotermico',
            'isobarico': 'isobarico',
            'isobárico': 'isobarico',
            'isobaric': 'isobarico',
            'isocorico': 'isocorico',
            'isocórico': 'isocorico',
            'isochoric': 'isocorico',
            'adiabatico': 'adiabatico',
            'adiabático': 'adiabatico',
            'adiabatic': 'adiabatico',
            'isentropico': 'adiabatico',
            'isentrópico': 'adiabatico',
            'isentro': 'adiabatico',
            'politropico': 'politropico',
            'polytropic': 'politropico',
        }
        return aliases.get(value, value)

    def _infer_process_type(self, data):
        if data.get('process_type') and str(data['process_type']).strip().lower() not in ('auto', 'automatico', ''):
            return self._normalize_process_type(data['process_type'])
        T1 = self._to_float(data.get('T1'))
        T2 = self._to_float(data.get('T2'))
        P1 = self._to_float(data.get('P1'))
        P2 = self._to_float(data.get('P2'))
        v1 = self._to_float(data.get('v1'))
        v2 = self._to_float(data.get('v2'))
        if T1 is not None and T2 is not None and abs(T2 - T1) < 1e-9:
            return 'isotermico'
        if P1 is not None and P2 is not None and abs(P2 - P1) < 1e-9:
            return 'isobarico'
        if v1 is not None and v2 is not None and abs(v2 - v1) < 1e-9:
            return 'isocorico'
        return 'auto'

    def _infer_state_from_ideal_gas(self, prefix, state, steps):
        T = state.get('T')
        P = state.get('P')
        v = state.get('v')
        if T is not None and P is not None and v is None:
            v = self.R * T / P
            state['v'] = v
            steps.append(f'{prefix}: se infirió v = RT/P = {v:.4f} m³/kg.')
        elif T is not None and v is not None and P is None:
            P = self.R * T / v
            state['P'] = P
            steps.append(f'{prefix}: se infirió P = RT/v = {P:.4f} kPa.')
        elif P is not None and v is not None and T is None:
            T = P * v / self.R
            state['T'] = T
            steps.append(f'{prefix}: se infirió T = Pv/R = {T:.4f} K.')

    def _interpolate_s0(self, T):
        points = self.gas.get('s0_points', [])
        if not points:
            return 0.0
        if T <= points[0][0]:
            return points[0][1]
        if T >= points[-1][0]:
            return points[-1][1]
        for i in range(len(points) - 1):
            T1, s1 = points[i]
            T2, s2 = points[i + 1]
            if T1 <= T <= T2:
                if abs(T2 - T1) < 1e-12:
                    return s1
                fraction = (T - T1) / (T2 - T1)
                return s1 + fraction * (s2 - s1)
        return points[-1][1]

    def solve(self, data):
        steps = []
        decision_tree = []
        data = data or {}

        process_type = self._infer_process_type(data)
        if process_type != 'auto':
            steps.append(f'Tipo de proceso detectado: {process_type}.')
            decision_tree.append(f'Se identificó un proceso {process_type}.')
        else:
            steps.append('No se identificó un proceso explícito; se usará el enfoque general con ecuaciones de gas ideal.')
            decision_tree.append('No se identificó proceso explícito; se resolverá con las relaciones de estado.')

        # Estado 1 y estado 2
        state1 = {'T': self._to_float(data.get('T1')), 'P': self._to_float(data.get('P1')), 'v': self._to_float(data.get('v1'))}
        state2 = {'T': self._to_float(data.get('T2')), 'P': self._to_float(data.get('P2')), 'v': self._to_float(data.get('v2'))}

        # Inferir propiedades faltantes del estado 1 y 2 si es posible
        self._infer_state_from_ideal_gas('Estado 1', state1, steps)
        self._infer_state_from_ideal_gas('Estado 2', state2, steps)

        # Deduce temperatura final si se da energía y falta T2
        Q = self._to_float(data.get('Q'))
        W = self._to_float(data.get('W'))
        if state2['T'] is None and Q is not None and W is not None and state1['T'] is not None and self.mass > 0:
            T2 = state1['T'] + (Q - W) / (self.mass * self.cv)
            state2['T'] = T2
            steps.append(f'Se usó la primera ley: T₂ = T₁ + (Q - W)/(m·cᵥ) = {T2:.4f} K.')
            decision_tree.append('Se empleó la primera ley para deducir T₂.')

        # Deduce estado final si el proceso es isobárico/isocórico/isotérmico/adiabático
        if process_type == 'isobarico':
            steps.append('Se eligió el modelo isobárico: P₁ = P₂.')
            decision_tree.append('Se usó la relación de presión constante para completar el estado 2.')
            if state1['P'] is None:
                state1['P'] = state2['P']
            if state2['P'] is None:
                state2['P'] = state1['P']
            if state1['T'] is not None and state2['T'] is None and state1['v'] is not None:
                state2['v'] = state1['v'] * state2['T'] / state1['T'] if state2['T'] is not None else None
            if state1['v'] is None and state2['v'] is not None and state1['T'] is not None and state2['T'] is not None:
                state1['v'] = state2['v'] * state1['T'] / state2['T']
        elif process_type == 'isocorico':
            steps.append('Se eligió el modelo isocórico: v₁ = v₂.')
            decision_tree.append('Se usó la relación de volumen constante para completar el estado 2.')
            if state1['v'] is None:
                state1['v'] = state2['v']
            if state2['v'] is None:
                state2['v'] = state1['v']
            if state1['T'] is not None and state2['T'] is None and state1['P'] is not None:
                state2['T'] = state1['T'] * state2['P'] / state1['P'] if state2['P'] is not None else None
            if state2['T'] is not None and state1['P'] is None and state2['P'] is not None:
                state1['P'] = state2['P'] * state1['T'] / state2['T']
        elif process_type == 'isotermico':
            steps.append('Se eligió el modelo isotérmico: T₁ = T₂.')
            decision_tree.append('Se usó la relación isotérmica para completar el estado 2.')
            if state1['T'] is not None and state2['T'] is None:
                state2['T'] = state1['T']
            if state1['P'] is not None and state2['P'] is None and state1['v'] is not None and state2['v'] is not None:
                state2['P'] = state1['P'] * state1['v'] / state2['v']
            elif state1['P'] is not None and state2['P'] is not None and state1['v'] is None and state2['v'] is not None:
                state1['v'] = state2['v'] * state2['P'] / state1['P']
        elif process_type == 'adiabatico':
            steps.append('Se eligió el modelo adiabático reversible (isentrópico).')
            decision_tree.append('Se usó la relación isentrópica para completar el estado 2.')
            if state1['T'] is not None and state2['T'] is None and state1['P'] is not None and state2['P'] is not None:
                state2['T'] = state1['T'] * (state2['P'] / state1['P']) ** ((self.k - 1) / self.k)
            elif state1['T'] is not None and state2['T'] is None and state1['v'] is not None and state2['v'] is not None:
                state2['T'] = state1['T'] * (state1['v'] / state2['v']) ** (self.k - 1)
            elif state1['T'] is not None and state2['T'] is not None and state1['P'] is None and state2['P'] is not None:
                state1['P'] = state2['P'] / ((state2['T'] / state1['T']) ** (self.k / (self.k - 1)))

        # Reflexión final para completar missing state values using ideal gas law
        self._infer_state_from_ideal_gas('Estado 1', state1, steps)
        self._infer_state_from_ideal_gas('Estado 2', state2, steps)

        # Fórmula de entropía
        delta_s = None
        delta_S = None
        solution_method = 'No se pudo determinar una ecuación directa.'
        formula = ''

        if state1['T'] is not None and state2['T'] is not None and state1['v'] is not None and state2['v'] is not None:
            delta_s = self.cv * math.log(state2['T'] / state1['T']) + self.R * math.log(state2['v'] / state1['v'])
            delta_S = self.mass * delta_s
            solution_method = 'Δs = cᵥ ln(T₂/T₁) + R ln(v₂/v₁)'
            formula = 'Δs = cv ln(T2/T1) + R ln(v2/v1)'
            steps.append('Se aplicó la ecuación de entropía en términos de temperatura y volumen específico.')
        elif state1['T'] is not None and state2['T'] is not None and state1['P'] is not None and state2['P'] is not None:
            delta_s = self.cp * math.log(state2['T'] / state1['T']) - self.R * math.log(state2['P'] / state1['P'])
            delta_S = self.mass * delta_s
            solution_method = 'Δs = cₚ ln(T₂/T₁) - R ln(P₂/P₁)'
            formula = 'Δs = cp ln(T2/T1) - R ln(P2/P1)'
            steps.append('Se aplicó la ecuación de entropía en términos de temperatura y presión.')
        elif state1['T'] is not None and state2['T'] is not None and state1['P'] is not None and state2['P'] is not None and self.gas.get('s0_points'):
            s1 = self._interpolate_s0(state1['T'])
            s2 = self._interpolate_s0(state2['T'])
            delta_s = (s2 - s1) - self.R * math.log(state2['P'] / state1['P'])
            delta_S = self.mass * delta_s
            solution_method = 'Δs = s°₂ - s°₁ - R ln(P₂/P₁) (tablas internas)'
            formula = 'Δs = s°2 - s°1 - R ln(P2/P1)'
            steps.append('Se usó la aproximación de tablas internas de s° para mejorar la evaluación térmica.')
        elif process_type == 'adiabatico':
            delta_s = 0.0
            delta_S = 0.0
            solution_method = 'Proceso isentrópico: Δs = 0'
            formula = 'Δs = 0 (proceso isentrópico)'
            steps.append('Para un proceso adiabático reversible, la entropía específica no cambia.')

        # Entropy balance if requested
        if data.get('solve_entropy_balance'):
            delta_S_balance = self._to_float(data.get('delta_S'))
            T_amb = self._to_float(data.get('T_amb'))
            if delta_S_balance is not None and Q is not None and T_amb is not None and T_amb > 0:
                Sgen = delta_S_balance - Q / T_amb
                steps.append(f'Balance de entropía: S_gen = ΔS - Q/T_amb = {Sgen:.4f} kJ/K.')
            elif delta_S_balance is not None and Q is not None and T_amb is not None and T_amb > 0:
                Sgen = None

        interpretation = self._make_interpretation(delta_s, delta_S, process_type)
        result = {
            'gas': self.gas['nombre'],
            'gas_id': self.gas_name,
            'mass': self.mass,
            'process_type': process_type,
            'formula': formula or solution_method,
            'method': solution_method,
            'delta_s': round(delta_s, 6) if delta_s is not None else None,
            'delta_S': round(delta_S, 6) if delta_S is not None else None,
            'states': {
                'state1': state1,
                'state2': state2,
            },
            'steps': steps,
            'decision_tree': decision_tree,
            'interpretation': interpretation,
            'missing_data': [k for k in ['T1', 'T2', 'P1', 'P2', 'v1', 'v2'] if data.get(k) in (None, '', 'None')],
            'constants': {
                'R': round(self.R, 4),
                'cp': round(self.cp, 4),
                'cv': round(self.cv, 4),
                'gamma': round(self.k, 4),
            },
            'solved': delta_s is not None,
        }
        return result

    def _make_interpretation(self, delta_s, delta_S, process_type):
        if delta_s is None:
            return 'No fue posible completar la solución con los datos actuales; se requieren más propiedades o un proceso explícito.'
        if abs(delta_s) < 1e-8:
            return 'La entropía específica no cambió; el proceso es compatible con un estado isentrópico o un caso de equilibrio especial.'
        if delta_s > 0:
            return 'La entropía aumentó, lo que indica que el sistema evolucionó hacia un estado más desordenado o que la irreversibilidad fue significativa.'
        return 'La entropía disminuyó, lo que sugiere que se requirió trabajo externo o un proceso de ordenamiento del sistema.'


def build_random_exercise():
    gas = random.choice(list(GAS_PROPERTIES.keys()))
    process_type = random.choice(['isobarico', 'isocorico', 'isotermico', 'adiabatico'])
    if process_type == 'isobarico':
        T1 = random.choice([300, 350, 400])
        T2 = T1 + random.choice([100, 150, 200])
        P1 = random.choice([100, 150, 200])
        P2 = P1
        v1 = round(0.287 * T1 / P1, 3)
        v2 = round(v1 * T2 / T1, 3)
        return {
            'statement': f'Un sistema cerrado de {GAS_PROPERTIES[gas]["nombre"]} se somete a un proceso isobárico desde T₁={T1} K y P₁={P1} kPa hasta T₂={T2} K. Determina Δs.',
            'gas': gas,
            'mass': 1.0,
            'process_type': process_type,
            'T1': T1,
            'T2': T2,
            'P1': P1,
            'P2': P2,
            'v1': v1,
            'v2': v2,
            'expected_hint': 'Usa Δs = cₚ ln(T₂/T₁) - R ln(P₂/P₁).',
        }
    if process_type == 'isocorico':
        T1 = random.choice([300, 350, 400])
        T2 = T1 + random.choice([50, 100, 150])
        P1 = random.choice([100, 150])
        P2 = round(P1 * T2 / T1, 2)
        v1 = round(0.287 * T1 / P1, 3)
        v2 = v1
        return {
            'statement': f'Un sistema cerrado de {GAS_PROPERTIES[gas]["nombre"]} se somete a un proceso isocórico desde T₁={T1} K y P₁={P1} kPa hasta T₂={T2} K. Determina Δs.',
            'gas': gas,
            'mass': 1.0,
            'process_type': process_type,
            'T1': T1,
            'T2': T2,
            'P1': P1,
            'P2': P2,
            'v1': v1,
            'v2': v2,
            'expected_hint': 'Usa Δs = cᵥ ln(T₂/T₁) + R ln(v₂/v₁).',
        }
    if process_type == 'isotermico':
        T = random.choice([300, 350, 400])
        v1 = round(random.choice([0.5, 0.8, 1.0]), 3)
        v2 = round(v1 * random.choice([1.5, 2.0, 2.5]), 3)
        P1 = round(0.287 * T / v1, 2)
        P2 = round(P1 * v1 / v2, 2)
        return {
            'statement': f'Un sistema cerrado de {GAS_PROPERTIES[gas]["nombre"]} se somete a un proceso isotérmico a T={T} K, con v₁={v1} m³/kg y v₂={v2} m³/kg. Determina Δs.',
            'gas': gas,
            'mass': 1.0,
            'process_type': process_type,
            'T1': T,
            'T2': T,
            'P1': P1,
            'P2': P2,
            'v1': v1,
            'v2': v2,
            'expected_hint': 'Usa Δs = R ln(v₂/v₁) porque T es constante.',
        }
    T1 = random.choice([300, 350, 400])
    P1 = random.choice([100, 150, 200])
    P2 = P1 + random.choice([50, 100, 150])
    T2 = round(T1 * (P2 / P1) ** ((GAS_PROPERTIES[gas]['gamma'] - 1) / GAS_PROPERTIES[gas]['gamma']), 2)
    return {
        'statement': f'Un sistema cerrado de {GAS_PROPERTIES[gas]["nombre"]} se somete a un proceso adiabático reversible desde P₁={P1} kPa y T₁={T1} K hasta P₂={P2} kPa. Determina Δs.',
        'gas': gas,
        'mass': 1.0,
        'process_type': process_type,
        'T1': T1,
        'T2': T2,
        'P1': P1,
        'P2': P2,
        'expected_hint': 'Para un proceso adiabático reversible, Δs = 0.',
    }


def evaluate_student_answer(student_answer, expected_value):
    try:
        value = float(str(student_answer).replace(',', '.'))
    except (TypeError, ValueError):
        return {
            'status': 'invalid',
            'message': 'No se pudo interpretar la respuesta. Escribe un número.',
        }
    if expected_value is None:
        return {'status': 'unknown', 'message': 'Aún no se ha calculado una respuesta de referencia.'}
    if abs(value - expected_value) < 1e-3:
        return {'status': 'correct', 'message': 'Correcto. El resultado coincide con la solución.', 'difference': round(abs(value - expected_value), 4)}
    if abs(value - expected_value) < 0.05 * max(1.0, abs(expected_value)):
        return {'status': 'near', 'message': 'Muy cerca. Revisa el signo o las unidades.', 'difference': round(abs(value - expected_value), 4)}
    if value * expected_value < 0:
        return {'status': 'sign', 'message': 'El signo no coincide con la solución.', 'difference': round(abs(value - expected_value), 4)}
    return {'status': 'incorrect', 'message': 'La respuesta está alejada del valor esperado.', 'difference': round(abs(value - expected_value), 4)}
