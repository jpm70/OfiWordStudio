import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ajustarA100,
  CasoInvalidoError,
  normalizarCaso,
  slugArchivo,
  sumaPuntos,
  type RequisitoTecnico,
} from '../src/lib/caso.ts';
import { CASOS_PREDEFINIDOS } from '../src/data.ts';

const origen = { id: 'imported-1', fecha_creacion: 'Importado JSON' };

const minimo = {
  titulo_practica: 'Carta comercial',
  texto_sin_formato: 'Estimado cliente:\n\nLe escribimos…',
  requisitos_tecnicos: [{ accion_requerida: 'Justifica el texto', puntos: 100 }],
};

test('los 3 casos oficiales son válidos, únicos y suman 100 puntos', () => {
  const ids = new Set(CASOS_PREDEFINIDOS.map((c) => c.id));
  assert.equal(ids.size, 3);
  for (const caso of CASOS_PREDEFINIDOS) {
    assert.ok(caso.id.startsWith('preset-'));
    assert.deepEqual(normalizarCaso(caso, caso), caso, caso.id);
    assert.equal(sumaPuntos(caso.requisitos_tecnicos), 100, caso.id);
  }
});

test('un JSON mínimo se completa con valores por defecto', () => {
  const caso = normalizarCaso(minimo, origen);
  assert.equal(caso.id, 'imported-1');
  assert.equal(caso.nivel, 'Intermedio');
  assert.equal(caso.tiempo_estimado_min, 30);
  assert.deepEqual(caso.modulos, []);
  assert.deepEqual(caso.requisitos_tecnicos, [
    { categoria: 'General', accion_requerida: 'Justifica el texto', ruta_cinta_opciones: '', puntos: 100 },
  ]);
});

test('rechaza lo que no es un caso con un mensaje claro', () => {
  for (const malo of [null, [], 'texto', { ...minimo, titulo_practica: '   ' }, { ...minimo, texto_sin_formato: ['a'] }]) {
    assert.throws(() => normalizarCaso(malo, origen), CasoInvalidoError);
  }
  assert.throws(
    () => normalizarCaso({ ...minimo, requisitos_tecnicos: [{}, { puntos: 10 }, 'x'] }, origen),
    /accion_requerida/,
  );
});

test('requisitos sin acción se descartan y los puntos se sanean', () => {
  const caso = normalizarCaso(
    {
      ...minimo,
      requisitos_tecnicos: [
        {},
        { accion_requerida: 'A', puntos: '15' },
        { accion_requerida: 'B', puntos: 250 },
        { accion_requerida: 'C', puntos: -4 },
        { accion_requerida: 'D', puntos: 'muchos', categoria: 42 },
      ],
    },
    origen,
  );
  assert.deepEqual(
    caso.requisitos_tecnicos.map((r) => [r.accion_requerida, r.puntos, r.categoria]),
    [
      ['A', 15, 'General'],
      ['B', 100, 'General'],
      ['C', 0, 'General'],
      ['D', 0, '42'],
    ],
  );
});

test('nivel y módulos desconocidos no se cuelan', () => {
  const caso = normalizarCaso(
    { ...minimo, nivel: 'Experto', modulos: ['Tablas', 'Macros', 7, 'Columnas'] },
    { ...origen, nivel: 'Avanzado' },
  );
  assert.equal(caso.nivel, 'Avanzado');
  assert.equal(caso.tiempo_estimado_min, 45);
  assert.deepEqual(caso.modulos, ['Tablas', 'Columnas']);
});

test('limita tamaños para no llenar localStorage', () => {
  const caso = normalizarCaso(
    {
      ...minimo,
      texto_sin_formato: 'a'.repeat(50_000),
      requisitos_tecnicos: Array.from({ length: 80 }, (_, i) => ({ accion_requerida: `R${i}`, puntos: 1 })),
    },
    origen,
  );
  assert.equal(caso.texto_sin_formato.length, 20_000);
  assert.equal(caso.requisitos_tecnicos.length, 30);
});

test('ajustarA100 respeta proporciones y suma exactamente 100', () => {
  const req = (puntos: number): RequisitoTecnico => ({
    categoria: 'X',
    accion_requerida: 'Y',
    ruta_cinta_opciones: '',
    puntos,
  });
  assert.deepEqual(ajustarA100([req(10), req(10), req(10)]).map((r) => r.puntos), [34, 33, 33]);
  assert.deepEqual(ajustarA100([req(20), req(60)]).map((r) => r.puntos), [25, 75]);
  assert.deepEqual(ajustarA100([req(0), req(0)]).map((r) => r.puntos), [50, 50]);
  const yaBien = [req(40), req(60)];
  assert.equal(ajustarA100(yaBien), yaBien);
});

test('slugArchivo quita tildes y símbolos', () => {
  assert.equal(slugArchivo('Iniciación'), 'iniciacion');
  assert.equal(slugArchivo('Informe técnico: Sede Norte / 2026', 40), 'informe_tecnico_sede_norte_2026');
  assert.equal(slugArchivo('¿¡!?'), 'caso');
});
