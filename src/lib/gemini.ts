// Llamada directa del navegador a la API REST de Gemini con la clave del
// propio usuario (BYOK). Sin DOM: `fetch` se inyecta para poder probarlo.

import {
  ajustarA100,
  CasoInvalidoError,
  normalizarCaso,
  type CasoPractico,
  type ModuloOpcional,
  type NivelPractica,
} from './caso.ts';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Google restringe la familia 2.5 a quien ya la usaba, así que una clave
// nueva de un alumno fallaría con `gemini-2.5-flash`. Se prueba el modelo
// recomendado y, si no está disponible o no hay cuota, el ligero.
export const MODELOS_GEMINI = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'] as const;

const TIEMPO_MAXIMO_MS = 120_000;

export const ESQUEMA_RESPUESTA = {
  type: 'OBJECT',
  properties: {
    titulo_practica: {
      type: 'STRING',
      description: 'Título profesional y descriptivo del caso práctico de Microsoft Word.',
    },
    tiempo_estimado_min: {
      type: 'INTEGER',
      description: 'Tiempo estimado de realización en minutos (entre 15 y 50).',
    },
    escenario_laboral: {
      type: 'STRING',
      description:
        'Contexto realista del encargo en una empresa explicando el propósito del documento y el rol del alumno.',
    },
    texto_sin_formato: {
      type: 'STRING',
      description:
        'Entre 4 y 6 párrafos extensos de texto continuo sin formato para que el alumno lo copie y pegue en Microsoft Word.',
    },
    requisitos_tecnicos: {
      type: 'ARRAY',
      description: 'Lista de requisitos técnicos evaluables cuya suma de puntos sea exactamente 100.',
      items: {
        type: 'OBJECT',
        properties: {
          categoria: {
            type: 'STRING',
            description:
              'Categoría técnica (ej. Formato de Fuente, Párrafo, Tablas, Estilos, Tabulaciones, Columnas, Portada, Encabezados).',
          },
          accion_requerida: {
            type: 'STRING',
            description: 'Instrucción técnica precisa con medidas en pt o cm que el estudiante debe aplicar en Word.',
          },
          ruta_cinta_opciones: {
            type: 'STRING',
            description:
              'Ruta exacta en la Cinta de Opciones de Word en español (ej. Inicio > Párrafo > Sangría y espacio).',
          },
          atajo_teclado: {
            type: 'STRING',
            description:
              'Atajo de teclado útil en Word en español para esta acción (ej. Ctrl + J, Ctrl + M, Ctrl + Entrar, F9).',
          },
          error_frecuente: {
            type: 'STRING',
            description: 'Error típico que el alumno debe evitar al realizar este paso en Word.',
          },
          puntos: { type: 'INTEGER', description: 'Puntos asignados a este requisito.' },
        },
        required: ['categoria', 'accion_requerida', 'ruta_cinta_opciones', 'atajo_teclado', 'error_frecuente', 'puntos'],
      },
    },
    criterio_evaluacion_final: {
      type: 'STRING',
      description: 'Criterio global de evaluación final del documento .docx terminado.',
    },
  },
  required: [
    'titulo_practica',
    'tiempo_estimado_min',
    'escenario_laboral',
    'texto_sin_formato',
    'requisitos_tecnicos',
    'criterio_evaluacion_final',
  ],
};

export interface ParametrosCaso {
  nivel: NivelPractica;
  escenario: string;
  modulos: ModuloOpcional[];
  tema?: string;
}

export function construirPrompt({ nivel, escenario, modulos, tema }: ParametrosCaso): string {
  const modulosTexto =
    modulos.length > 0 ? modulos.join(', ') : 'Formato general acorde al nivel seleccionado';
  const temaLimpio = (tema ?? '').trim().slice(0, 200);
  return `Actúa como un profesor experto en Ofimática y Certificación MOS de Microsoft Word (versión escritorio en español).
Genera un caso práctico completo, riguroso y realista para un estudiante de ofimática con estos parámetros:
- Nivel de dificultad: ${nivel}
- Tipo de documento / Escenario: ${escenario}
- Módulos opcionales obligatorios a incluir en los requisitos técnicos: ${modulosTexto}
${temaLimpio ? `- Temática o sector empresarial: ${temaLimpio}\n` : ''}
Reglas pedagógicas estrictas:
1. "texto_sin_formato": Entre 4 y 6 párrafos extensos y realistas de texto continuo sin formato (separados por saltos de línea dobles \\n\\n) listos para copiar y pegar en Microsoft Word. Incluye títulos de sección numerados (ej. "1. INTRODUCCIÓN...") y, si se incluyen "Tablas" o "Tabulaciones", añade bloques de datos con guiones (" - ") o puntos (" ... ") para que el alumno los convierta en tabla o aplique paradas de tabulación.
2. "requisitos_tecnicos": Entre 7 y 10 requisitos detallados con medidas exactas (puntos pt, centímetros cm, alineación, nombres de estilos, saltos) cuya suma total de "puntos" sea exactamente 100.
3. En cada requisito incluye:
   - "ruta_cinta_opciones": Ruta exacta en los menús en español de Microsoft Word (ej. "Inicio > Párrafo > Configuración de párrafo > Sangría y espacio").
   - "atajo_teclado": Atajo de teclado real en Word en español (ej. "Ctrl + J", "Ctrl + M", "Alt + Ctrl + 1", "Ctrl + Entrar"). Si no hay un atajo directo fiable, indica "Sin atajo directo".
   - "error_frecuente": Consejo docente advirtiendo del fallo habitual del estudiante en ese paso.`;
}

export type MotivoError = 'clave' | 'cuota' | 'modelo' | 'servicio' | 'red' | 'respuesta' | 'cancelado';

export class ErrorGemini extends Error {
  motivo: MotivoError;
  status?: number;

  constructor(motivo: MotivoError, mensaje: string, status?: number) {
    super(mensaje);
    this.motivo = motivo;
    this.status = status;
  }
}

interface ErrorApi {
  error?: { message?: string; status?: string; details?: { reason?: string }[] };
}

/** Traduce una respuesta HTTP fallida de Gemini a un error con mensaje útil para el alumno. */
export function errorDesdeRespuesta(status: number, cuerpo: ErrorApi | null): ErrorGemini {
  const info = cuerpo?.error;
  const razon = info?.details?.find((d) => d?.reason)?.reason ?? '';
  const textoApi = (info?.message ?? '').slice(0, 300);
  if (razon === 'API_KEY_INVALID' || /api key not valid|api_key_invalid/i.test(textoApi) || status === 401) {
    return new ErrorGemini('clave', 'La API Key de Gemini no es válida. Revísala o crea una nueva en Google AI Studio.', status);
  }
  if (status === 403) {
    return new ErrorGemini(
      'clave',
      'La API Key no tiene permiso para usar Gemini (¿restringida a otra API o a otro dominio?). Revísala en Google AI Studio.',
      status,
    );
  }
  if (status === 429) {
    return new ErrorGemini('cuota', 'Se ha agotado la cuota gratuita de tu clave por ahora. Espera un minuto y vuelve a intentarlo.', status);
  }
  if (status === 404) {
    return new ErrorGemini('modelo', 'El modelo de Gemini no está disponible para esta clave.', status);
  }
  if (status >= 500) {
    return new ErrorGemini('servicio', 'Gemini está saturado o no responde. Inténtalo de nuevo en unos segundos.', status);
  }
  return new ErrorGemini('respuesta', `Gemini rechazó la petición (HTTP ${status})${textoApi ? `: ${textoApi}` : '.'}`, status);
}

interface RespuestaGemini {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

/** Extrae el JSON del primer candidato (ignorando partes de razonamiento). */
export function extraerJson(respuesta: RespuestaGemini): unknown {
  if (respuesta.promptFeedback?.blockReason) {
    throw new ErrorGemini('respuesta', `Gemini bloqueó la petición (${respuesta.promptFeedback.blockReason}). Cambia la temática.`);
  }
  const candidato = respuesta.candidates?.[0];
  const texto = (candidato?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
    .trim();
  if (!texto) {
    const fin = candidato?.finishReason;
    throw new ErrorGemini(
      'respuesta',
      fin && fin !== 'STOP'
        ? `Gemini no terminó la respuesta (${fin}). Vuelve a generar.`
        : 'La respuesta de Gemini llegó vacía. Vuelve a generar.',
    );
  }
  // Algunos modelos envuelven el JSON en ```json … ``` aunque se pida JSON puro.
  const sinVallas = texto.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(sinVallas);
  } catch {
    throw new ErrorGemini('respuesta', 'Gemini devolvió un JSON incompleto. Vuelve a generar.');
  }
}

export interface OpcionesGeneracion {
  apiKey: string;
  parametros: ParametrosCaso;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  modelos?: readonly string[];
  ahora?: () => Date;
}

export interface ResultadoGeneracion {
  caso: CasoPractico;
  modelo: string;
}

/**
 * Pide un caso a Gemini. La clave viaja en la cabecera `x-goog-api-key` (no en
 * la URL, que acaba en historiales y registros). Si un modelo no existe, está
 * saturado o sin cuota, se prueba el siguiente; un error de clave corta en seco.
 */
export async function generarCaso({
  apiKey,
  parametros,
  fetchImpl = fetch,
  signal,
  modelos = MODELOS_GEMINI,
  ahora = () => new Date(),
}: OpcionesGeneracion): Promise<ResultadoGeneracion> {
  const cuerpo = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: construirPrompt(parametros) }] }],
    systemInstruction: {
      parts: [
        {
          text: 'Eres un docente senior de Ofimática especializado en Microsoft Word en español. Respondes solo con JSON válido ajustado al esquema.',
        },
      ],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: ESQUEMA_RESPUESTA,
      temperature: 0.7,
    },
  });

  let ultimoError: ErrorGemini | null = null;
  for (const modelo of modelos) {
    const temporizador = new AbortController();
    const reloj = setTimeout(() => temporizador.abort(), TIEMPO_MAXIMO_MS);
    const cancelar = () => temporizador.abort();
    signal?.addEventListener('abort', cancelar, { once: true });
    let respuesta: Response;
    try {
      respuesta = await fetchImpl(`${API_BASE}/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: cuerpo,
        signal: temporizador.signal,
      });
    } catch {
      clearTimeout(reloj);
      signal?.removeEventListener('abort', cancelar);
      if (signal?.aborted) throw new ErrorGemini('cancelado', 'Generación cancelada.');
      if (temporizador.signal.aborted) {
        ultimoError = new ErrorGemini('servicio', 'Gemini tardó demasiado en responder. Inténtalo de nuevo.');
        continue;
      }
      throw new ErrorGemini('red', 'No se pudo conectar con Gemini. Comprueba tu conexión a Internet.');
    }

    try {
      if (!respuesta.ok) {
        const datosError = (await respuesta.json().catch(() => null)) as ErrorApi | null;
        const error = errorDesdeRespuesta(respuesta.status, datosError);
        if (error.motivo === 'modelo' || error.motivo === 'cuota' || error.motivo === 'servicio') {
          ultimoError = error;
          continue;
        }
        throw error;
      }
      const datos = extraerJson((await respuesta.json()) as RespuestaGemini);
      const fecha = ahora();
      let caso: CasoPractico;
      try {
        caso = normalizarCaso(datos, {
          id: `custom-${fecha.getTime()}`,
          fecha_creacion: fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          nivel: parametros.nivel,
          escenario: parametros.escenario,
          modulos: parametros.modulos,
        });
      } catch (e) {
        if (e instanceof CasoInvalidoError) {
          throw new ErrorGemini('respuesta', `La respuesta de Gemini no es un caso completo (${e.message}). Vuelve a generar.`);
        }
        throw e;
      }
      // El nivel, escenario y módulos son los que pidió el alumno, no los que diga el modelo.
      caso.nivel = parametros.nivel;
      caso.escenario = parametros.escenario;
      caso.modulos = [...parametros.modulos];
      caso.requisitos_tecnicos = ajustarA100(caso.requisitos_tecnicos);
      return { caso, modelo };
    } finally {
      clearTimeout(reloj);
      signal?.removeEventListener('abort', cancelar);
    }
  }
  throw ultimoError ?? new ErrorGemini('modelo', 'Ningún modelo de Gemini está disponible ahora mismo.');
}
