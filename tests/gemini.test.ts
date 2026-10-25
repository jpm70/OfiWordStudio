import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sumaPuntos } from '../src/lib/caso.ts';
import { construirPrompt, ErrorGemini, extraerJson, generarCaso, MODELOS_GEMINI } from '../src/lib/gemini.ts';

const parametros = { nivel: 'Avanzado' as const, escenario: 'Informe técnico', modulos: ['Tablas' as const] };

const casoIA = {
  titulo_practica: 'Informe de ventas',
  tiempo_estimado_min: 40,
  escenario_laboral: 'Eres administrativo…',
  texto_sin_formato: '1. INTRODUCCIÓN\nTexto…',
  requisitos_tecnicos: [
    { categoria: 'Tablas', accion_requerida: 'Convierte en tabla', ruta_cinta_opciones: 'Insertar > Tabla', atajo_teclado: '-', error_frecuente: 'x', puntos: 30 },
    { categoria: 'Estilos', accion_requerida: 'Aplica Título 1', ruta_cinta_opciones: 'Inicio > Estilos', atajo_teclado: 'Alt + Ctrl + 1', error_frecuente: 'y', puntos: 30 },
  ],
  criterio_evaluacion_final: 'Sin Intro vacíos',
  nivel: 'Iniciación',
};

function respuestaOk(datos: unknown) {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(datos) }] }, finishReason: 'STOP' }] }),
    { status: 200 },
  );
}

function respuestaError(status: number, cuerpo: unknown = {}) {
  return new Response(JSON.stringify(cuerpo), { status });
}

test('la clave va en cabecera, nunca en la URL, y se usa el modelo recomendado', async () => {
  const llamadas: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    llamadas.push({ url, init });
    return respuestaOk(casoIA);
  }) as typeof fetch;
  const { caso, modelo } = await generarCaso({ apiKey: 'AIza-secreta', parametros, fetchImpl, ahora: () => new Date(0) });
  assert.equal(modelo, MODELOS_GEMINI[0]);
  assert.equal(llamadas.length, 1);
  assert.ok(!llamadas[0].url.includes('AIza'), 'la clave no debe ir en la URL');
  assert.ok(llamadas[0].url.endsWith(`/${MODELOS_GEMINI[0]}:generateContent`));
  assert.equal((llamadas[0].init.headers as Record<string, string>)['x-goog-api-key'], 'AIza-secreta');
  const cuerpo = JSON.parse(String(llamadas[0].init.body));
  assert.equal(cuerpo.generationConfig.responseMimeType, 'application/json');
  // Nivel/escenario/módulos son los pedidos; los puntos se reparten hasta 100.
  assert.equal(caso.nivel, 'Avanzado');
  assert.equal(caso.escenario, 'Informe técnico');
  assert.deepEqual(caso.modulos, ['Tablas']);
  assert.equal(sumaPuntos(caso.requisitos_tecnicos), 100);
  assert.equal(caso.id, 'custom-0');
});

test('si el primer modelo no existe o no tiene cuota, prueba el siguiente', async () => {
  for (const status of [404, 429, 503]) {
    const urls: string[] = [];
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      return urls.length === 1 ? respuestaError(status) : respuestaOk(casoIA);
    }) as typeof fetch;
    const { modelo } = await generarCaso({ apiKey: 'k', parametros, fetchImpl });
    assert.equal(modelo, MODELOS_GEMINI[1], `status ${status}`);
    assert.equal(urls.length, 2);
  }
});

test('una clave inválida corta sin probar más modelos', async () => {
  let llamadas = 0;
  const fetchImpl = (async () => {
    llamadas++;
    return respuestaError(400, {
      error: { message: 'API key not valid. Please pass a valid API key.', details: [{ reason: 'API_KEY_INVALID' }] },
    });
  }) as typeof fetch;
  await assert.rejects(generarCaso({ apiKey: 'mala', parametros, fetchImpl }), (e: unknown) => {
    assert.ok(e instanceof ErrorGemini);
    assert.equal(e.motivo, 'clave');
    return true;
  });
  assert.equal(llamadas, 1);
});

test('si todos los modelos fallan por cuota, el error lo dice', async () => {
  const fetchImpl = (async () => respuestaError(429)) as typeof fetch;
  await assert.rejects(generarCaso({ apiKey: 'k', parametros, fetchImpl }), /cuota/);
});

test('sin red, mensaje de conexión', async () => {
  const fetchImpl = (async () => {
    throw new TypeError('Failed to fetch');
  }) as typeof fetch;
  await assert.rejects(generarCaso({ apiKey: 'k', parametros, fetchImpl }), (e: unknown) => {
    assert.ok(e instanceof ErrorGemini);
    assert.equal(e.motivo, 'red');
    return true;
  });
});

test('una respuesta incompleta no se guarda como caso', async () => {
  const fetchImpl = (async () => respuestaOk({ titulo_practica: 'Solo título' })) as typeof fetch;
  await assert.rejects(generarCaso({ apiKey: 'k', parametros, fetchImpl }), /no es un caso completo/);
});

test('extraerJson ignora el razonamiento, quita vallas ``` y explica cortes', () => {
  assert.deepEqual(
    extraerJson({
      candidates: [{ content: { parts: [{ text: 'pensando…', thought: true }, { text: '```json\n{"a":1}\n```' }] } }],
    }),
    { a: 1 },
  );
  assert.throws(() => extraerJson({ candidates: [{ content: { parts: [] }, finishReason: 'MAX_TOKENS' }] }), /MAX_TOKENS/);
  assert.throws(() => extraerJson({ candidates: [{ content: { parts: [{ text: '{"a":' }] } }] }), /incompleto/);
  assert.throws(() => extraerJson({ promptFeedback: { blockReason: 'SAFETY' } }), /SAFETY/);
});

test('el prompt incluye parámetros y recorta la temática', () => {
  const prompt = construirPrompt({ ...parametros, tema: 'x'.repeat(500) });
  assert.match(prompt, /Nivel de dificultad: Avanzado/);
  assert.match(prompt, /Módulos opcionales obligatorios a incluir en los requisitos técnicos: Tablas/);
  assert.ok(prompt.includes('x'.repeat(200)) && !prompt.includes('x'.repeat(201)));
});
