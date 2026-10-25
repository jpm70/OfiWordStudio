// Modelo de datos de un caso práctico y su validación.
// Sin DOM ni React: lo usan la interfaz, la importación de .json, la respuesta
// de Gemini y las pruebas (`npm test`).

export type NivelPractica = 'Iniciación' | 'Intermedio' | 'Avanzado';

export type ModuloOpcional =
  | 'Tablas'
  | 'Estilos'
  | 'Tabulaciones'
  | 'Columnas'
  | 'Portada'
  | 'Encabezados y Pies'
  | 'Tabla de Contenido'
  | 'Combinación de Correspondencia';

export interface RequisitoTecnico {
  categoria: string;
  accion_requerida: string;
  ruta_cinta_opciones: string;
  atajo_teclado?: string;
  error_frecuente?: string;
  puntos: number;
}

export interface CasoPractico {
  id: string;
  fecha_creacion: string;
  nivel: NivelPractica;
  escenario: string;
  modulos: ModuloOpcional[];
  tiempo_estimado_min?: number;
  titulo_practica: string;
  escenario_laboral: string;
  texto_sin_formato: string;
  requisitos_tecnicos: RequisitoTecnico[];
  criterio_evaluacion_final: string;
}

export const NIVELES_VALIDOS: NivelPractica[] = ['Iniciación', 'Intermedio', 'Avanzado'];

export const ESCENARIOS: string[] = [
  'Circular interna corporativa',
  'Informe técnico',
  'Manual de procedimientos',
  'Carta formal comercial',
  'Acta de reunión ejecutiva',
  'Pliego de prescripciones técnicas',
];

export const MODULOS_DISPONIBLES: ModuloOpcional[] = [
  'Tablas',
  'Estilos',
  'Tabulaciones',
  'Columnas',
  'Portada',
  'Encabezados y Pies',
  'Tabla de Contenido',
  'Combinación de Correspondencia',
];

const TIEMPO_POR_NIVEL: Record<NivelPractica, number> = {
  Iniciación: 20,
  Intermedio: 30,
  Avanzado: 45,
};

// Límites para que un .json ajeno o una respuesta rara no llenen localStorage
// ni rompan la maquetación.
export const MAX_REQUISITOS = 30;
export const MAX_TEXTO_BASE = 20000;
const MAX_CAMPO_LARGO = 4000;
const MAX_CAMPO_CORTO = 300;

export class CasoInvalidoError extends Error {}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function texto(v: unknown, max: number, porDefecto = ''): string {
  if (typeof v === 'number' && Number.isFinite(v)) v = String(v);
  if (typeof v !== 'string') return porDefecto;
  const limpio = v.replace(/\r\n?/g, '\n').trim();
  return limpio ? limpio.slice(0, max) : porDefecto;
}

function entero(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function normalizarRequisito(raw: unknown): RequisitoTecnico | null {
  if (!esObjeto(raw)) return null;
  const accion = texto(raw.accion_requerida, MAX_CAMPO_LARGO);
  if (!accion) return null;
  const req: RequisitoTecnico = {
    categoria: texto(raw.categoria, MAX_CAMPO_CORTO, 'General'),
    accion_requerida: accion,
    ruta_cinta_opciones: texto(raw.ruta_cinta_opciones, MAX_CAMPO_LARGO),
    puntos: entero(raw.puntos, 0, 100) ?? 0,
  };
  const atajo = texto(raw.atajo_teclado, MAX_CAMPO_CORTO);
  const error = texto(raw.error_frecuente, MAX_CAMPO_LARGO);
  if (atajo) req.atajo_teclado = atajo;
  if (error) req.error_frecuente = error;
  return req;
}

export interface OrigenCaso {
  id: string;
  fecha_creacion: string;
  nivel?: NivelPractica;
  escenario?: string;
  modulos?: ModuloOpcional[];
}

/**
 * Convierte cualquier objeto (un .json importado o la respuesta de Gemini) en
 * un CasoPractico seguro de pintar. Lanza CasoInvalidoError si falta lo
 * imprescindible: título, texto base y al menos un requisito con acción.
 * `origen` aporta id/fecha y los valores por defecto de nivel/escenario/módulos.
 */
export function normalizarCaso(raw: unknown, origen: OrigenCaso): CasoPractico {
  if (!esObjeto(raw)) {
    throw new CasoInvalidoError('El contenido no es un objeto JSON.');
  }
  const titulo = texto(raw.titulo_practica, MAX_CAMPO_CORTO);
  if (!titulo) throw new CasoInvalidoError('Falta "titulo_practica".');
  const textoBase = texto(raw.texto_sin_formato, MAX_TEXTO_BASE);
  if (!textoBase) throw new CasoInvalidoError('Falta "texto_sin_formato".');
  if (!Array.isArray(raw.requisitos_tecnicos)) {
    throw new CasoInvalidoError('Falta la lista "requisitos_tecnicos".');
  }
  const requisitos = raw.requisitos_tecnicos
    .slice(0, MAX_REQUISITOS)
    .map(normalizarRequisito)
    .filter((r): r is RequisitoTecnico => r !== null);
  if (requisitos.length === 0) {
    throw new CasoInvalidoError('Ningún requisito técnico tiene "accion_requerida".');
  }

  const nivel = NIVELES_VALIDOS.includes(raw.nivel as NivelPractica)
    ? (raw.nivel as NivelPractica)
    : origen.nivel ?? 'Intermedio';

  const modulosRaw = Array.isArray(raw.modulos) ? raw.modulos : origen.modulos ?? [];
  const modulos = [...new Set(modulosRaw)].filter((m): m is ModuloOpcional =>
    MODULOS_DISPONIBLES.includes(m as ModuloOpcional),
  );

  return {
    id: origen.id,
    fecha_creacion: origen.fecha_creacion,
    nivel,
    escenario: texto(raw.escenario, MAX_CAMPO_CORTO, origen.escenario ?? 'Documento'),
    modulos,
    tiempo_estimado_min:
      entero(raw.tiempo_estimado_min, 5, 180) ?? TIEMPO_POR_NIVEL[nivel],
    titulo_practica: titulo,
    escenario_laboral: texto(raw.escenario_laboral, MAX_CAMPO_LARGO),
    texto_sin_formato: textoBase,
    requisitos_tecnicos: requisitos,
    criterio_evaluacion_final: texto(raw.criterio_evaluacion_final, MAX_CAMPO_LARGO),
  };
}

export function sumaPuntos(requisitos: RequisitoTecnico[]): number {
  return requisitos.reduce((s, r) => s + r.puntos, 0);
}

/**
 * Reparte los puntos para que sumen exactamente 100 respetando las
 * proporciones (método del resto mayor). Se aplica a lo que genera la IA,
 * que no siempre cuadra la suma; los .json del profesor se respetan tal cual.
 */
export function ajustarA100(requisitos: RequisitoTecnico[]): RequisitoTecnico[] {
  const total = sumaPuntos(requisitos);
  if (total === 100 || requisitos.length === 0) return requisitos;
  const pesos = total > 0 ? requisitos.map((r) => r.puntos) : requisitos.map(() => 1);
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  const exactos = pesos.map((p) => (p / sumaPesos) * 100);
  const base = exactos.map(Math.floor);
  let resto = 100 - base.reduce((a, b) => a + b, 0);
  const porResto = exactos
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of porResto) {
    if (resto <= 0) break;
    base[i] += 1;
    resto -= 1;
  }
  return requisitos.map((r, i) => ({ ...r, puntos: base[i] }));
}

/** Nombre de archivo seguro (sin tildes ni símbolos) para exportaciones. */
export function slugArchivo(valor: string, max = 30): string {
  const slug = valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, max);
  return slug || 'caso';
}
