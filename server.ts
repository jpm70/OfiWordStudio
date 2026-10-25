import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const practiceResponseSchema = {
  type: Type.OBJECT,
  properties: {
    titulo_practica: {
      type: Type.STRING,
      description: 'Título profesional y descriptivo del caso práctico de Microsoft Word.',
    },
    escenario_laboral: {
      type: Type.STRING,
      description: 'Contexto realista del encargo en una empresa o institución explicando el propósito del documento y el rol del estudiante.',
    },
    texto_sin_formato: {
      type: Type.STRING,
      description: 'Entre 4 y 6 párrafos extensos y realistas de texto continuo sin formato (separados por saltos de línea dobles) para que el alumno los copie y pegue en Microsoft Word y aplique sobre ellos el formato solicitado.',
    },
    requisitos_tecnicos: {
      type: Type.ARRAY,
      description: 'Lista detallada de entre 7 y 10 requisitos técnicos evaluables cuya suma total de puntos sea exactamente 100.',
      items: {
        type: Type.OBJECT,
        properties: {
          categoria: {
            type: Type.STRING,
            description: 'Categoría técnica (ej. Formato de Fuente, Formato de Párrafo, Estilos, Tablas, Tabulaciones, Columnas, Diseño de Página, Portada, Referencias).',
          },
          accion_requerida: {
            type: Type.STRING,
            description: 'Instrucción concreta, medible y detallada que el alumno debe realizar en su documento de Word (con medidas exactas en pt, cm, alineación, colores o parámetros).',
          },
          ruta_cinta_opciones: {
            type: Type.STRING,
            description: 'Ruta exacta en la Cinta de Opciones de Microsoft Word en español (ej. Inicio > Párrafo > Sangría y espacio > Interlineado).',
          },
          puntos: {
            type: Type.INTEGER,
            description: 'Puntos asignados a este requisito (la suma total de todos los requisitos debe ser 100).',
          },
        },
        required: ['categoria', 'accion_requerida', 'ruta_cinta_opciones', 'puntos'],
      },
    },
    criterio_evaluacion_final: {
      type: Type.STRING,
      description: 'Criterio global de evaluación final y verificación de calidad antes de entregar el archivo .docx.',
    },
  },
  required: [
    'titulo_practica',
    'escenario_laboral',
    'texto_sin_formato',
    'requisitos_tecnicos',
    'criterio_evaluacion_final',
  ],
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.post('/api/generate-practice', async (req, res) => {
    try {
      const { nivel, escenario, modulos, temaPersonalizado } = req.body || {};

      if (!nivel || !escenario) {
        res.status(400).json({
          error: 'Debes seleccionar tanto el nivel de dificultad como el escenario documental.',
        });
        return;
      }

      const modulosTexto =
        Array.isArray(modulos) && modulos.length > 0
          ? modulos.join(', ')
          : 'Formato general acorde al nivel';

      const prompt = `Actúa como un profesor experto en Ofimática Empresarial y certificación MOS (Microsoft Office Specialist) de Microsoft Word (versión escritorio en español).

Genera un caso práctico completo, riguroso y realista para un estudiante de ofimática con los siguientes parámetros:
- Nivel de competencia: ${nivel}
- Tipo de documento / Escenario: ${escenario}
- Módulos opcionales obligatorios a incluir en los requisitos técnicos: ${modulosTexto}
${temaPersonalizado ? `- Sector o temática específica solicitada: ${temaPersonalizado}` : ''}

Instrucciones pedagógicas obligatorias:
1. El campo "texto_sin_formato" debe contener entre 4 y 6 párrafos densos, realistas, bien redactados en español profesional (mínimo 260 palabras en total), separados por saltos de línea (\\n\\n), listos para que el estudiante los copie en bruto en un documento en blanco de Microsoft Word. Si se solicita el módulo "Tablas" o "Tabulaciones", incluye dentro del texto en bruto una sección de datos separados por guiones o comas para que el estudiante los convierta en tabla o lista tabulada.
2. El array "requisitos_tecnicos" debe tener entre 7 y 10 ítems técnicos muy precisos (especificando tamaños en puntos, márgenes o sangrías en cm, nombres exactos de estilos, bordes, sombreados, etc.) acordes con el nivel "${nivel}" y que incluyan expresamente todos los módulos seleccionados (${modulosTexto}).
3. La suma de los valores "puntos" de todos los elementos en "requisitos_tecnicos" DEBE ser exactamente 100 puntos.
4. El campo "ruta_cinta_opciones" debe indicar con exactitud la ruta real en la interfaz en español de Microsoft Word (por ejemplo: "Inicio > Párrafo > Configuración de párrafo > Sangría especial: Primera línea (1,25 cm)" o "Disposición > Configurar página > Saltos > Página siguiente").`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Eres un docente senior de Ofimática y diseño documental corporativo especializado en Microsoft Word. Respondes siempre en español con JSON válido ajustado estrictamente al esquema solicitado.',
          responseMimeType: 'application/json',
          responseSchema: practiceResponseSchema,
          temperature: 0.7,
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('El modelo no devolvió contenido.');
      }

      const parsed = JSON.parse(rawText.trim());
      res.json(parsed);
    } catch (error: unknown) {
      console.error('Error generating practice:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo generar el caso práctico en este momento.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
