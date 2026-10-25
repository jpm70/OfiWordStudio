// Interpreta el texto en bruto de un caso para pintar la «Maqueta objetivo A4».
// Es una orientación visual: detecta tablas (líneas con « - »), listas con
// relleno (« ... »), el título principal y los epígrafes.

import type { CasoPractico } from './caso.ts';

export type BloqueMaqueta =
  | { tipo: 'titulo_principal'; id: number; lineas: string[] }
  | { tipo: 'tabla'; id: number; tituloSeccion: string | null; filas: string[][]; saltoPaginaAntes: boolean }
  | { tipo: 'tabulaciones'; id: number; tituloSeccion: string | null; filas: string[][] }
  | { tipo: 'parrafo'; id: number; epigrafe: string | null; cuerpo: string; enDosColumnas: boolean };

const SEP_TABLA = ' - ';
const SEP_RELLENO = /\s*\.{3,}\s*/;

function esMayusculas(s: string): boolean {
  return /\p{L}/u.test(s) && s === s.toLocaleUpperCase('es-ES');
}

function esEpigrafe(linea: string): boolean {
  return esMayusculas(linea) || /^\d+(\.\d+)*\.?\s/.test(linea);
}

function numeroEpigrafe(linea: string | null): string | null {
  return linea?.match(/^(\d+(?:\.\d+)*)\.?\s/)?.[1] ?? null;
}

/** ¿Algún requisito de la categoría pedida menciona el texto? */
function requisitosQueMencionan(caso: CasoPractico, patronCategoria: RegExp): string[] {
  return caso.requisitos_tecnicos
    .filter((r) => patronCategoria.test(r.categoria) || patronCategoria.test(r.accion_requerida))
    .map((r) => r.accion_requerida.toLocaleLowerCase('es-ES'));
}

function mencionaApartado(textos: string[], epigrafe: string | null): boolean {
  if (!epigrafe) return false;
  const num = numeroEpigrafe(epigrafe);
  const sinNumero = epigrafe.replace(/^\d+(\.\d+)*\.?\s*/, '').toLocaleLowerCase('es-ES').slice(0, 40);
  return textos.some(
    (t) =>
      (num !== null && new RegExp(`apartado\\s+${num.replace(/\./g, '\\.')}(?![\\d.])`).test(t)) ||
      (sinNumero.length > 8 && t.includes(sinNumero)),
  );
}

export function construirMaqueta(caso: CasoPractico): BloqueMaqueta[] {
  const bloques = caso.texto_sin_formato
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const textosColumnas = caso.modulos.includes('Columnas') ? requisitosQueMencionan(caso, /columna/i) : [];
  const textosSalto = requisitosQueMencionan(caso, /salto de página/i).filter((t) => t.includes('salto de página'));

  const resultado: BloqueMaqueta[] = bloques.map((bloque, idx) => {
    const lineas = bloque.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lineas.filter((l) => l.includes(SEP_TABLA)).length >= 2) {
      const titulo = !lineas[0].includes(SEP_TABLA) ? lineas[0] : null;
      const filas = (titulo ? lineas.slice(1) : lineas).map((l) => l.split(SEP_TABLA).map((c) => c.trim()));
      return {
        tipo: 'tabla',
        id: idx,
        tituloSeccion: titulo,
        filas,
        saltoPaginaAntes: mencionaApartado(textosSalto, titulo),
      };
    }

    if (lineas.filter((l) => SEP_RELLENO.test(l)).length >= 2) {
      const titulo = !SEP_RELLENO.test(lineas[0]) ? lineas[0] : null;
      const filas = (titulo ? lineas.slice(1) : lineas).map((l) => l.split(SEP_RELLENO).map((c) => c.trim()));
      return { tipo: 'tabulaciones', id: idx, tituloSeccion: titulo, filas };
    }

    if (idx === 0 && esMayusculas(bloque)) {
      return { tipo: 'titulo_principal', id: idx, lineas };
    }

    const conEpigrafe = lineas.length > 1 && esEpigrafe(lineas[0]);
    const epigrafe = conEpigrafe ? lineas[0] : null;
    return {
      tipo: 'parrafo',
      id: idx,
      epigrafe,
      cuerpo: (conEpigrafe ? lineas.slice(1) : lineas).join(' '),
      enDosColumnas: mencionaApartado(textosColumnas, epigrafe),
    };
  });

  // Si se piden columnas pero ningún requisito señala un apartado concreto,
  // se muestra el efecto en el primer párrafo con epígrafe.
  if (textosColumnas.length > 0 && !resultado.some((b) => b.tipo === 'parrafo' && b.enDosColumnas)) {
    const primero = resultado.find((b) => b.tipo === 'parrafo' && b.epigrafe);
    if (primero && primero.tipo === 'parrafo') primero.enDosColumnas = true;
  }
  return resultado;
}
