import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CASOS_PREDEFINIDOS } from '../src/data.ts';
import { construirMaqueta } from '../src/lib/maqueta.ts';

const intermedio = CASOS_PREDEFINIDOS.find((c) => c.id === 'preset-intermedio-informe')!;

test('caso intermedio: título, tabla, tabulaciones y columnas donde las pide la rúbrica', () => {
  const bloques = construirMaqueta(intermedio);
  assert.equal(bloques[0].tipo, 'titulo_principal');

  const tabla = bloques.find((b) => b.tipo === 'tabla');
  assert.ok(tabla && tabla.tipo === 'tabla');
  assert.equal(tabla.filas.length, 5);
  assert.equal(tabla.filas[0].length, 5);
  // «Inserta un salto de página antes del apartado 3» → la tabla del apartado 3.
  assert.equal(tabla.saltoPaginaAntes, true);

  const tab = bloques.find((b) => b.tipo === 'tabulaciones');
  assert.ok(tab && tab.tipo === 'tabulaciones');
  assert.deepEqual(tab.filas[0], ['Unidad Enfriadora RoofTop Carrier 40kW', 'Ing. Marta Salazar', 'Revisión Completada']);

  const columnas = bloques.filter((b) => b.tipo === 'parrafo' && b.enDosColumnas);
  assert.equal(columnas.length, 1);
  assert.ok(columnas[0].tipo === 'parrafo' && columnas[0].epigrafe?.startsWith('2. ANÁLISIS'));
});

test('sin módulo Columnas no se pinta ningún bloque a dos columnas', () => {
  for (const caso of CASOS_PREDEFINIDOS.filter((c) => !c.modulos.includes('Columnas'))) {
    assert.ok(!construirMaqueta(caso).some((b) => b.tipo === 'parrafo' && b.enDosColumnas), caso.id);
  }
});

test('una tabla sin requisito de salto de página no muestra el salto', () => {
  const avanzado = CASOS_PREDEFINIDOS.find((c) => c.id === 'preset-avanzado-manual')!;
  const tabla = construirMaqueta(avanzado).find((b) => b.tipo === 'tabla');
  assert.ok(tabla && tabla.tipo === 'tabla');
  assert.equal(tabla.saltoPaginaAntes, false);
});
