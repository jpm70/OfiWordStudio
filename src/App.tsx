/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  FileText,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Upload,
  Search,
  Sun,
  Moon,
  AlertCircle,
  SlidersHorizontal,
  BookOpen,
  KeyRound,
  ExternalLink,
  Trash2,
  X,
  Code2,
  Timer,
  Play,
  Pause,
  Keyboard,
  AlertTriangle,
  Printer,
  Layout,
  Pilcrow,
  Award,
  HelpCircle,
  FileDown,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type NivelPractica = 'Iniciación' | 'Intermedio' | 'Avanzado';

export type EscenarioDocumento =
  | 'Circular interna corporativa'
  | 'Informe técnico'
  | 'Manual de procedimientos'
  | 'Carta formal comercial'
  | ' Acta de reunión ejecutiva'
  | 'Pliego de prescripciones técnicas';

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

const API_KEY_STORAGE = 'gemini_api_key';
const STORAGE_HISTORIAL_KEY = 'ofiword_practicas_historial_v2';
const STORAGE_PROGRESO_KEY = 'ofiword_progreso_requisitos_v2';
const LOGO_PATH = './assets/aistudio/icono_81a3db5b.png';
const AUTHOR_WEB_URL = 'https://www.unfantasmaenelsistema.com/';

const NIVELES: {
  id: NivelPractica;
  resumen: string;
  competencias: string;
  tiempoSugerido: number;
}[] = [
  {
    id: 'Iniciación',
    resumen: 'Formato base de fuente y párrafo',
    competencias: 'Fuentes, alineación, interlineado, sangrías, bordes y viñetas.',
    tiempoSugerido: 20,
  },
  {
    id: 'Intermedio',
    resumen: 'Maquetación y estructuras tabulares',
    competencias:
      'Tablas complejas, tabulaciones con relleno, columnas y saltos de página/sección.',
    tiempoSugerido: 30,
  },
  {
    id: 'Avanzado',
    resumen: 'Automatización y documentos extensos',
    competencias:
      'Estilos jerárquicos, tabla de contenido automática, encabezados desvinculados y correspondencia.',
    tiempoSugerido: 45,
  },
];

const ESCENARIOS: string[] = [
  'Circular interna corporativa',
  'Informe técnico',
  'Manual de procedimientos',
  'Carta formal comercial',
  'Acta de reunión ejecutiva',
  'Pliego de prescripciones técnicas',
];

const MODULOS_DISPONIBLES: ModuloOpcional[] = [
  'Tablas',
  'Estilos',
  'Tabulaciones',
  'Columnas',
  'Portada',
  'Encabezados y Pies',
  'Tabla de Contenido',
  'Combinación de Correspondencia',
];

const ATAJOS_REFERENCIA = [
  { accion: 'Negrita / Cursiva / Subrayado', atajo: 'Ctrl + N / Ctrl + K / Ctrl + S', categoria: 'Fuente' },
  { accion: 'Abrir cuadro de diálogo Fuente', atajo: 'Ctrl + M', categoria: 'Fuente' },
  { accion: 'Alinear Izquierda / Centro / Derecha / Justificar', atajo: 'Ctrl + Q / T / D / J', categoria: 'Párrafo' },
  { accion: 'Mostrar u ocultar marcas de formato (¶)', atajo: 'Ctrl + Mayús + 8', categoria: 'Vista' },
  { accion: 'Insertar salto de página manual', atajo: 'Ctrl + Entrar', categoria: 'Paginación' },
  { accion: 'Insertar salto de línea sin cambiar de párrafo', atajo: 'Mayús + Entrar', categoria: 'Párrafo' },
  { accion: 'Aplicar estilo Título 1 / Título 2 / Normal', atajo: 'Alt + Ctrl + 1 / 2 / N', categoria: 'Estilos' },
  { accion: 'Actualizar campos (Tabla de contenido / referencias)', atajo: 'F9', categoria: 'Referencias' },
  { accion: 'Copiar formato de texto/párrafo', atajo: 'Ctrl + Mayús + C / V', categoria: 'Portapapeles' },
  { accion: 'Buscar y reemplazar texto o formatos especiales', atajo: 'Ctrl + L', categoria: 'Edición' },
];

const REGLAS_ORO_PREENTREGA = [
  {
    id: 'regla-1',
    titulo: 'Cero saltos con Intro vacíos (¶)',
    detalle: 'He separado los párrafos usando "Espaciado anterior/posterior" y nunca pulsando Intro dos veces seguidas.',
  },
  {
    id: 'regla-2',
    titulo: 'Cero alineación con barra espaciadora',
    detalle: 'He utilizado sangrías, alineaciones o paradas de tabulación en la regla en lugar de espacios repetidos.',
  },
  {
    id: 'regla-3',
    titulo: 'Estilos vinculados en epígrafes',
    detalle: 'Todos los títulos utilizan estilos (Título 1, Título 2) para que el panel de navegación y el índice funcionen.',
  },
  {
    id: 'regla-4',
    titulo: 'Saltos limpios de página o sección',
    detalle: 'Los cambios de estructura (columnas, orientación o encabezados distintos) usan Saltos de Sección adecuados.',
  },
];

const CASOS_PREDEFINIDOS: CasoPractico[] = [
  {
    id: 'preset-intermedio-informe',
    fecha_creacion: 'Caso oficial · Intermedio',
    nivel: 'Intermedio',
    escenario: 'Informe técnico',
    modulos: ['Tablas', 'Estilos', 'Tabulaciones', 'Columnas', 'Encabezados y Pies'],
    tiempo_estimado_min: 30,
    titulo_practica:
      'Informe Técnico de Auditoría Energética y Climatización — Sede Corporativa Norte',
    escenario_laboral:
      'Trabajas como técnico documental en el Departamento de Infraestructuras de Grupo Iberia Sostenible S.A. La dirección de ingeniería te ha entregado el borrador sin formato de la auditoría trimestral de consumo eléctrico y climatización. Tu objetivo es maquetar el documento siguiendo la normativa visual de la empresa antes de su presentación ante el Comité de Dirección.',
    texto_sin_formato: `INFORME TÉCNICO DE AUDITORÍA ENERGÉTICA Y CLIMATIZACIÓN - SEDE CORPORATIVA NORTE

1. RESUMEN EJECUTIVO DE LA INTERVENCIÓN
Durante el tercer trimestre del ejercicio actual se ha llevado a cabo la revisión integral de los sistemas de climatización HVAC y los cuadros de distribución lumínica en las cuatro plantas del edificio principal. Las mediciones termográficas revelan oportunidades inmediatas de optimización en los cerramientos de la fachada norte y en la programación horaria de las enfriadoras de cubierta. La adopción de las medidas correctoras detalladas en este documento permitirá reducir la demanda térmica anual en un 18,4 % sin comprometer el confort ambiental de los puestos de trabajo.

2. ANÁLISIS TÉCNICO POR ZONAS OPERATIVAS
Planta Baja y Recepción Logística: El tránsito continuo en las puertas de acceso genera infiltraciones de aire exterior no tratado. Se recomienda instalar cortinas de aire de alta eficiencia acopladas a sensores de apertura magnética. Área de Servidores y Comunicaciones (Planta 1): Los equipos de refrigeración de precisión mantienen una temperatura constante de 19 °C, pero presentan un diferencial de presión elevado en los filtros de impulsión que incrementa el consumo específico de los ventiladores. Plantas de Oficinas Generales (Plantas 2 y 3): La sustitución de luminarias fluorescentes convencionales por paneles LED con regulación DALI por aporte de luz natural ha completado su fase piloto con resultados superiores a los previstos inicialmente.

3. CUADRO DE MEDICIONES Y CONSUMOS POR PLANTA (CONVERTIR EN TABLA)
Planta - Superficie (m2) - Consumo Actual (kWh/mes) - Ahorro Estimado (%) - Prioridad de Actuación
Planta Baja (Acceso y Logística) - 850 - 6420 - 14,5 % - Alta
Planta 1 (CPD y Laboratorio) - 620 - 11850 - 22,0 % - Crítica
Planta 2 (Administración y Finanzas) - 1100 - 4980 - 16,2 % - Media
Planta 3 (Dirección y Operaciones) - 1100 - 4710 - 19,8 % - Media

4. ÍNDICE DE EQUIPOS REVISADOS Y RESPONSABLES TÉCNICOS (APLICAR TABULACIONES CON RELLENO)
Unidad Enfriadora RoofTop Carrier 40kW ... Ing. Marta Salazar ... Revisión Completada
Cuadro General de Baja Tensión CGBT-01 ... Téc. Roberto Méndez ... Pendiente Equilibrado
Sistema de Ventilación Mecánica Recuperadora ... Ing. Elena Valbuena ... Revisión Completada
Batería de Condensadores Automática 120 kVAr ... Téc. Roberto Méndez ... Sustitución Programada

5. CONCLUSIONES Y PLAN DE IMPLANTACIÓN
La ejecución escalonada del plan de mejora comenzará el próximo mes con la intervención prioritaria sobre el Centro de Procesamiento de Datos en la Planta 1. Todas las actuaciones deberán registrarse en el libro de mantenimiento preventivo y validarse mediante una segunda medición de contraste transcurridos sesenta días naturales desde la puesta en marcha.`,
    requisitos_tecnicos: [
      {
        categoria: 'Diseño de Página',
        accion_requerida:
          'Configura el tamaño de papel en A4 con orientación vertical y márgenes personalizados: Superior e Inferior de 2,5 cm; Izquierdo de 3,0 cm y Derecho de 2,5 cm.',
        ruta_cinta_opciones:
          'Disposición > Configurar página > Márgenes > Márgenes personalizados',
        atajo_teclado: 'Alt + P, M, A',
        error_frecuente: 'No modifiques los márgenes arrastrando la sangría de la regla horizontal.',
        puntos: 10,
      },
      {
        categoria: 'Estilos',
        accion_requerida:
          'Modifica el estilo "Título 1" para los epígrafes numerados (1 al 5) con fuente Aptos Display o Calibri Light de 14 pt, negrita, color Azul énfasis 1 oscuro 25%, espaciado anterior de 12 pt y posterior de 6 pt.',
        ruta_cinta_opciones:
          'Inicio > Estilos > Clic derecho en Título 1 > Modificar > Formato > Párrafo',
        atajo_teclado: 'Alt + Ctrl + 1',
        error_frecuente: 'No apliques el formato manualmente título por título; modifica el estilo para que todos cambien a la vez.',
        puntos: 15,
      },
      {
        categoria: 'Formato de Párrafo',
        accion_requerida:
          'Aplica al cuerpo del texto alineación Justificada, interlineado Múltiple en 1,15 líneas, sangría especial de primera línea de 1,25 cm y espaciado posterior de 6 pt.',
        ruta_cinta_opciones:
          'Inicio > Párrafo > Configuración de párrafo > Sangría y espacio',
        atajo_teclado: 'Ctrl + J (Justificar)',
        error_frecuente: 'Evita usar la tecla Tabulador al principio de cada párrafo; configúralo en Sangría especial: Primera línea.',
        puntos: 15,
      },
      {
        categoria: 'Columnas',
        accion_requerida:
          'Selecciona exclusivamente el texto descriptivo del apartado "2. ANÁLISIS TÉCNICO POR ZONAS OPERATIVAS" y divídelo en 2 columnas iguales con separación de 1,0 cm y línea entre columnas.',
        ruta_cinta_opciones:
          'Disposición > Configurar página > Columnas > Más columnas > Dos (marcar Línea entre columnas)',
        atajo_teclado: 'Alt + P, J, C',
        error_frecuente: 'Selecciona solo el párrafo sin incluir el título ni saltos extra para que Word cree saltos de sección Continuos automáticamente.',
        puntos: 15,
      },
      {
        categoria: 'Tablas',
        accion_requerida:
          'Convierte los datos del apartado 3 (separados por guiones) en una tabla de 5 columnas y 5 filas. Aplica autoajuste al contenido, fila de encabezado con sombreado azul corporativo y texto blanco, y alinea a la derecha los valores numéricos.',
        ruta_cinta_opciones:
          'Insertar > Tablas > Tabla > Convertir texto en tabla > Separar texto en: Otro ( - )',
        atajo_teclado: 'Alt + B, T, V',
        error_frecuente: 'No crees la tabla vacía para copiar celda por celda; usa la herramienta "Convertir texto en tabla".',
        puntos: 20,
      },
      {
        categoria: 'Tabulaciones',
        accion_requerida:
          'En la lista del apartado 4, reemplaza los puntos escritos manualmente por una única pulsación de la tecla Tab y fija dos paradas: centrada en 9,0 cm con relleno tipo 2 (...) y derecha en 15,5 cm con relleno tipo 2.',
        ruta_cinta_opciones:
          'Inicio > Párrafo > Configuración de párrafo > Botón Tabulaciones (esquina inferior izquierda)',
        atajo_teclado: 'Tecla Tab',
        error_frecuente: 'Nunca escribas puntos suspensivos "..." a mano; el carácter de relleno se genera automáticamente al pulsar Tab.',
        puntos: 15,
      },
      {
        categoria: 'Saltos y Encabezado',
        accion_requerida:
          'Inserta un salto de página antes del apartado 3 y añade un pie de página con "Auditoría Energética Interna" a la izquierda y campo "Página X de Y" a la derecha.',
        ruta_cinta_opciones:
          'Insertar > Encabezado y pie de página > Pie de página / Ctrl + Entrar para salto',
        atajo_teclado: 'Ctrl + Entrar',
        error_frecuente: 'No escribas el número de página como texto fijo; inserta siempre el campo automático de Numeración de página.',
        puntos: 10,
      },
    ],
    criterio_evaluacion_final:
      'El documento entregado (.docx) no debe contener espacios múltiples consecutivos ni líneas en blanco creadas con la tecla Intro para separar párrafos. Se verificará activando el comando Mostrar todo (¶) que los saltos de sección para las columnas, las marcas de tabulación y la tabla estén construidos de forma limpia.',
  },
  {
    id: 'preset-iniciacion-circular',
    fecha_creacion: 'Caso oficial · Iniciación',
    nivel: 'Iniciación',
    escenario: 'Circular interna corporativa',
    modulos: ['Estilos', 'Encabezados y Pies'],
    tiempo_estimado_min: 20,
    titulo_practica:
      'Circular Interna sobre Protocolo de Teletrabajo Híbrido y Seguridad Digital',
    escenario_laboral:
      'Formas parte del área de Recursos Humanos de Editorial Atlántida. Debes dar formato profesional a una circular interna dirigida a toda la plantilla sobre la actualización de los turnos de teletrabajo y el uso obligatorio de doble factor de autenticación.',
    texto_sin_formato: `CIRCULAR INTERNA N.º 14/2026 - DIRECCIÓN DE PERSONAS Y CULTURA DIGITAL
ASUNTO: ACTUALIZACIÓN DEL PROTOCOLO DE TRABAJO HÍBRIDO Y SEGURIDAD EN EQUIPOS PORTÁTILES

Estimado equipo:

A partir del próximo día 1 del mes entrante entrará en vigor la revisión anual del acuerdo de flexibilidad horaria y trabajo a distancia para todos los departamentos técnicos y administrativos de la compañía. Esta actualización responde al objetivo de armonizar la conciliación personal con las sesiones presenciales de coordinación interdepartamental.

Condiciones generales de la modalidad híbrida para el presente trimestre:
Jornada presencial mínima de tres días semanales en la sede asignada.
Franja de disponibilidad sincrónica obligatoria entre las 09:30 h y las 14:00 h.
Registro previo de los días de teletrabajo en el portal interno antes de cada viernes a las 13:00 h.
Uso exclusivo del equipo portátil corporativo conectado mediante la red privada virtual (VPN) de la empresa.

Asimismo, el Departamento de Sistemas informa de que todos los empleados deberán activar la verificación en dos pasos (2FA) en su cuenta corporativa antes de finalizar la presente semana. En caso de incidencia técnica durante la configuración, el servicio de soporte interior atenderá consultas en la extensión telefónica 4102.

Agradecemos de antemano vuestra colaboración para mantener un entorno de trabajo seguro, ágil y coordinado.

Atentamente,
Dirección de Personas y Organización
Editorial Atlántida S.L.`,
    requisitos_tecnicos: [
      {
        categoria: 'Formato de Fuente',
        accion_requerida:
          'Selecciona todo el documento y establece la familia tipográfica Calibri de 11 pt para el texto general. Aplica al título principal tamaño 14 pt, negrita, efecto Versalitas y color Azul oscuro.',
        ruta_cinta_opciones:
          'Inicio > Fuente > Cuadro de diálogo Fuente (Ctrl + M) > Efectos: Versalitas',
        atajo_teclado: 'Ctrl + E (Seleccionar todo) / Ctrl + M',
        error_frecuente: 'Usa el efecto Versalitas desde el cuadro de diálogo Fuente en vez de solo cambiar el tamaño.',
        puntos: 20,
      },
      {
        categoria: 'Bordes y Sombreado',
        accion_requerida:
          'Aplica un borde inferior de 1,5 pt de grosor y sombreado Gris claro (fondo 2, oscuro 10%) al bloque de las dos primeras líneas de cabecera (Circular y Asunto).',
        ruta_cinta_opciones:
          'Inicio > Párrafo > Bordes > Bordes y sombreado (Aplicar a: Párrafo)',
        atajo_teclado: 'Alt + O, B, B',
        error_frecuente: 'Asegúrate de que en "Aplicar a:" esté seleccionado "Párrafo" y no "Texto".',
        puntos: 20,
      },
      {
        categoria: 'Formato de Párrafo',
        accion_requerida:
          'Configura los párrafos explicativos con alineación Justificada, interlineado de 1,15 líneas y espaciado posterior de 8 pt.',
        ruta_cinta_opciones:
          'Inicio > Párrafo > Interlineado y opciones de interlineado',
        atajo_teclado: 'Ctrl + J',
        error_frecuente: 'Elimina las líneas vacías entre párrafos para que el espaciado de 8 pt controle la separación.',
        puntos: 20,
      },
      {
        categoria: 'Sangrías y Viñetas',
        accion_requerida:
          'Aplica una lista con viñetas cuadradas a las cuatro condiciones de la modalidad híbrida, con posición de viñeta en 1,0 cm y sangría de texto en 1,63 cm.',
        ruta_cinta_opciones:
          'Inicio > Párrafo > Viñetas > Clic derecho en la lista > Ajustar sangrías de lista',
        atajo_teclado: 'Ctrl + Mayús + L',
        error_frecuente: 'Ajusta las medidas exactas desde "Ajustar sangrías de lista", no moviendo los controles de la regla a ojo.',
        puntos: 25,
      },
      {
        categoria: 'Firma y Cierre',
        accion_requerida:
          'Alinea a la derecha las tres últimas líneas de despedida y firma, aplicando cursiva al nombre de la empresa "Editorial Atlántida S.L." y sangría derecha de 1,0 cm.',
        ruta_cinta_opciones:
          'Inicio > Párrafo > Alinear a la derecha (Ctrl + D) / Ctrl + K',
        atajo_teclado: 'Ctrl + D / Ctrl + K',
        error_frecuente: 'No uses tabuladores repetidos para llevar la firma a la derecha; usa alineación derecha.',
        puntos: 15,
      },
    ],
    criterio_evaluacion_final:
      'Se revisará la uniformidad visual de la circular en una sola página A4, el uso de espaciado de párrafo automático en lugar de saltos manuales y la correcta alineación de la lista de viñetas.',
  },
  {
    id: 'preset-avanzado-manual',
    fecha_creacion: 'Caso oficial · Avanzado',
    nivel: 'Avanzado',
    escenario: 'Manual de procedimientos',
    modulos: ['Portada', 'Estilos', 'Tablas', 'Tabla de Contenido', 'Encabezados y Pies'],
    tiempo_estimado_min: 45,
    titulo_practica:
      'Manual Corporativo de Gestión de Calidad ISO 9001 y Control Documental',
    escenario_laboral:
      'Eres el responsable de Documentación y Procesos en Laboratorios BioNova. Para superar la auditoría externa ISO 9001, necesitas estructurar el Manual de Control Documental incluyendo portada integrada, estilos multinivel numerados, tabla de contenido automática y encabezados desvinculados entre secciones.',
    texto_sin_formato: `MANUAL DE PROCEDIMIENTOS OPERATIVOS ESTÁNDAR (POE-CAL-08)
SISTEMA DE GESTIÓN DE LA CALIDAD Y TRAZABILIDAD DOCUMENTAL

CAPÍTULO 1. OBJETO Y ALCANCE DEL PROCEDIMIENTO
1.1 Propósito del control documental
El presente manual establece las directrices obligatorias para la elaboración, revisión, aprobación, distribución y archivo de toda la documentación técnica y de calidad generada en las instalaciones de Laboratorios BioNova. Su cumplimiento garantiza que el personal opere exclusivamente con las versiones vigentes autorizadas.
1.2 Ámbito de aplicación
Las disposiciones recogidas en este documento afectan a las áreas de Control Microbiológico, Garantía de Calidad, Producción Farmacéutica y Logística de Frío.

CAPÍTULO 2. CODIFICACIÓN Y MATRIZ DE VIGENCIA
2.1 Estructura del código alfanumérico
Todo procedimiento interno se identificará mediante un código único compuesto por tres bloques separados por guiones: siglas del tipo documental, código de departamento de tres letras y número correlativo de dos dígitos.
2.2 Matriz de control de revisiones vigentes (CONVERTIR EN TABLA)
Código - Denominación del Procedimiento - Versión - Fecha Vigencia - Responsable
POE-MIC-01 - Toma de muestras en sala limpia - v4.2 - 15/01/2026 - Dra. Carmen Vega
POE-GAR-04 - Gestión de no conformidades y CAPA - v3.0 - 02/03/2026 - Ing. Javier Solís
POE-LOG-09 - Validación de cadena de frío en transporte - v2.5 - 20/06/2026 - Lic. Andrés Pardo
POE-PRO-12 - Limpieza y despeje de línea de envasado - v5.1 - 10/09/2026 - Dra. Sonia Beltrán

CAPÍTULO 3. FLUJO DE APROBACIÓN Y ARCHIVO HISTÓRICO
3.1 Custodia de ejemplares obsoletos
Cuando se publique una nueva revisión de un procedimiento, el sistema documental retirará de inmediato el acceso de lectura a la versión anterior y almacenará una copia bloqueada con marca de agua "OBSOLETO - SOLO CONSULTA HISTÓRICA" durante un periodo legal de cinco años.`,
    requisitos_tecnicos: [
      {
        categoria: 'Portada y Secciones',
        accion_requerida:
          'Inserta una portada prediseñada sobria (tipo "Con bandas" o "Integral") con el título del manual y divide el documento en 3 secciones independientes mediante saltos de sección (Página siguiente): Sección 1 (Portada), Sección 2 (Tabla de Contenido) y Sección 3 (Capítulos).',
        ruta_cinta_opciones:
          'Insertar > Páginas > Portada / Disposición > Configurar página > Saltos > Página siguiente',
        atajo_teclado: 'Alt + P, S, P',
        error_frecuente: 'Usa "Salto de sección (Página siguiente)" y no un salto de página normal para poder desvincular los encabezados.',
        puntos: 15,
      },
      {
        categoria: 'Estilos y Lista Multinivel',
        accion_requerida:
          'Aplica "Título 1" a los CAPÍTULOS y "Título 2" a los subapartados (1.1, 1.2...). Vincula ambos estilos a una lista multinivel jerárquica y activa "Salto de página anterior" en el formato de párrafo del estilo Título 1.',
        ruta_cinta_opciones:
          'Inicio > Párrafo > Lista multinivel > Definir nueva lista multinivel > Más > Vincular nivel al estilo',
        atajo_teclado: 'Alt + Ctrl + 1 / Alt + Ctrl + 2',
        error_frecuente: 'Activa "Salto de página anterior" dentro de la pestaña "Líneas y saltos de página" al modificar el estilo Título 1.',
        puntos: 20,
      },
      {
        categoria: 'Tabla de Contenido',
        accion_requerida:
          'En la Sección 2, inserta una Tabla de Contenido automática que muestre 2 niveles jerárquicos con carácter de relleno de puntos y números de página alineados a la derecha.',
        ruta_cinta_opciones:
          'Referencias > Tabla de contenido > Tabla de contenido personalizada',
        atajo_teclado: 'F9 (Actualizar tabla)',
        error_frecuente: 'Nunca construyas el índice manualmente; debe actualizarse solo al pulsar F9.',
        puntos: 15,
      },
      {
        categoria: 'Encabezados Desvinculados',
        accion_requerida:
          'Desactiva "Vincular al anterior" en los encabezados y pies de la Sección 3. En la Sección 2 usa numeración romana en minúsculas (i, ii) y en la Sección 3 reinicia la numeración arábiga en 1 incluyendo un campo StyleRef con el título del capítulo actual.',
        ruta_cinta_opciones:
          'Encabezado y pie de página > Navegación > Vincular al anterior / Elementos rápidos > Campo > StyleRef',
        atajo_teclado: 'Alt + B, E',
        error_frecuente: 'Si olvidas desactivar "Vincular al anterior" antes de borrar o cambiar el encabezado de la Sección 3, alterarás también la Sección 2.',
        puntos: 20,
      },
      {
        categoria: 'Tablas Avanzadas',
        accion_requerida:
          'Convierte la matriz del apartado 2.2 en tabla, activa "Repetir filas de título", establece un margen de celda superior e inferior de 0,15 cm y centra verticalmente el contenido de todas las celdas.',
        ruta_cinta_opciones:
          'Disposición de tabla > Datos > Repetir filas de título / Alineación > Márgenes de celda',
        atajo_teclado: 'Alt + J, L, J',
        error_frecuente: '"Repetir filas de título" solo funciona si seleccionas la primera fila de la tabla.',
        puntos: 15,
      },
      {
        categoria: 'Marca de Agua y Protección',
        accion_requerida:
          'Inserta una marca de agua de texto diagonal semitransparente con la leyenda "COPIA CONTROLADA ISO 9001" en gris suave en todo el documento.',
        ruta_cinta_opciones:
          'Diseño > Fondo de página > Marca de agua > Marca de agua personalizada',
        atajo_teclado: 'Alt + G, M, M',
        error_frecuente: 'Asegúrate de dejar marcada la casilla "Semitransparente" para no dificultar la lectura del texto.',
        puntos: 15,
      },
    ],
    criterio_evaluacion_final:
      'Para superar la evaluación avanzada, la Tabla de Contenido debe actualizarse dinámicamente mediante F9 sin errores de referencia, las secciones deben poseer numeración independiente verificable y los estilos Título 1 y Título 2 deben controlar todo el formato jerárquico sin sobrecargas de formato manual directo.',
  },
];

// Esquema JSON enriquecido para Gemini 2.5 Flash
const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    titulo_practica: {
      type: 'STRING',
      description:
        'Título profesional y descriptivo del caso práctico de Microsoft Word.',
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
        '4 o 5 párrafos extensos de texto continuo sin formato para que el alumno lo copie y pegue en Microsoft Word.',
    },
    requisitos_tecnicos: {
      type: 'ARRAY',
      description:
        'Lista de requisitos técnicos evaluables cuya suma de puntos sea exactamente 100.',
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
            description:
              'Instrucción técnica precisa con medidas en pt o cm que el estudiante debe aplicar en Word.',
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
            description:
              'Error típico que el alumno debe evitar al realizar este paso en Word.',
          },
          puntos: {
            type: 'INTEGER',
            description: 'Puntos asignados a este requisito.',
          },
        },
        required: [
          'categoria',
          'accion_requerida',
          'ruta_cinta_opciones',
          'atajo_teclado',
          'error_frecuente',
          'puntos',
        ],
      },
    },
    criterio_evaluacion_final: {
      type: 'STRING',
      description:
        'Criterio global de evaluación final del documento .docx terminado.',
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

export default function App() {
  // 1. ARQUITECTURA BYOK (localStorage 'gemini_api_key')
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  const [inputKey, setInputKey] = useState<string>(() => {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  const [mostrarKeyTexto, setMostrarKeyTexto] = useState<boolean>(false);

  const [modalKeyAbierto, setModalKeyAbierto] = useState<boolean>(() => {
    try {
      const guardada = localStorage.getItem(API_KEY_STORAGE);
      return !guardada || guardada.trim() === '';
    } catch {
      return true;
    }
  });

  // Modal de Chuleta / Glosario Pedagógico
  const [modalGlosarioAbierto, setModalGlosarioAbierto] = useState<boolean>(false);

  // Modal de Informe de Entrega / Calificación del Alumno
  const [modalInformeAbierto, setModalInformeAbierto] = useState<boolean>(false);
  const [nombreAlumno, setNombreAlumno] = useState<string>(() => {
    try {
      return localStorage.getItem('ofiword_alumno_nombre') || '';
    } catch {
      return '';
    }
  });
  const [identificadorAlumno, setIdentificadorAlumno] = useState<string>(() => {
    try {
      return localStorage.getItem('ofiword_alumno_id') || '';
    } catch {
      return '';
    }
  });
  const [grupoAlumno, setGrupoAlumno] = useState<string>(() => {
    try {
      return localStorage.getItem('ofiword_alumno_grupo') || '';
    } catch {
      return '';
    }
  });
  const [centroAlumno, setCentroAlumno] = useState<string>(() => {
    try {
      return localStorage.getItem('ofiword_alumno_centro') || '';
    } catch {
      return '';
    }
  });
  const [observacionesAlumno, setObservacionesAlumno] = useState<string>('');
  const [generandoPDF, setGenerandoPDF] = useState<boolean>(false);

  // Toast / alerta de notificación
  const [toast, setToast] = useState<{
    tipo: 'error' | 'exito';
    mensaje: string;
  } | null>(null);

  const mostrarNotificacion = (
    tipo: 'error' | 'exito',
    mensaje: string,
    duracion = 5000
  ) => {
    setToast({ tipo, mensaje });
    setTimeout(() => {
      setToast((actual) => (actual?.mensaje === mensaje ? null : actual));
    }, duracion);
  };

  const handleGuardarApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const limpia = inputKey.trim();
    if (!limpia) {
      mostrarNotificacion(
        'error',
        'Por favor, introduce una Google Gemini API Key válida.'
      );
      return;
    }
    try {
      localStorage.setItem(API_KEY_STORAGE, limpia);
    } catch {
      // Ignore
    }
    setApiKey(limpia);
    setModalKeyAbierto(false);
    mostrarNotificacion(
      'exito',
      'API Key guardada localmente en tu navegador (localStorage).'
    );
  };

  const handleBorrarApiKey = () => {
    try {
      localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      // Ignore
    }
    setApiKey('');
    setInputKey('');
    setModalKeyAbierto(true);
    mostrarNotificacion(
      'exito',
      'Clave eliminada del navegador. Introduce una nueva clave para continuar.'
    );
  };

  // Tema Claro / Oscuro
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Estado del Formulario de Generación
  const [nivel, setNivel] = useState<NivelPractica>('Intermedio');
  const [escenario, setEscenario] = useState<string>('Informe técnico');
  const [modulos, setModulos] = useState<ModuloOpcional[]>([
    'Tablas',
    'Estilos',
    'Tabulaciones',
    'Columnas',
  ]);
  const [temaPersonalizado, setTemaPersonalizado] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Historial de prácticas y práctica activa
  const [historial, setHistorial] = useState<CasoPractico[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORIAL_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return CASOS_PREDEFINIDOS;
  });

  const [practicaActualId, setPracticaActualId] = useState<string>(
    () => CASOS_PREDEFINIDOS[0].id
  );

  // Progreso de checkboxes por práctica
  const [completadosPorPractica, setCompletadosPorPractica] = useState<
    Record<string, Record<number, boolean>>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROGRESO_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return {};
  });

  // Reglas de oro pre-entrega marcadas
  const [reglasPreentrega, setReglasPreentrega] = useState<
    Record<string, boolean>
  >({});

  // Controles de Columna A (Texto en Bruto vs Simulador Vista Previa A4 + Mostrar Todo ¶)
  const [vistaColumnaA, setVistaColumnaA] = useState<'bruto' | 'maqueta'>('bruto');
  const [mostrarMarcasFormato, setMostrarMarcasFormato] = useState<boolean>(true);

  // Controles de la Rúbrica y Cronómetro de Examen
  const [modoExamen, setModoExamen] = useState<boolean>(false);
  const [copiadoExito, setCopiadoExito] = useState<boolean>(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [busquedaRequisito, setBusquedaRequisito] = useState<string>('');
  const [mostrarConfigurador, setMostrarConfigurador] = useState<boolean>(true);

  // Cronómetro de Simulacro MOS / Examen
  const [segundosCronometro, setSegundosCronometro] = useState<number>(0);
  const [cronometroActivo, setCronometroActivo] = useState<boolean>(false);

  useEffect(() => {
    if (!cronometroActivo) return;
    const interval = setInterval(() => {
      setSegundosCronometro((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cronometroActivo]);

  const formatearTiempo = (totalSeg: number) => {
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  const practicaActual = useMemo(() => {
    return (
      historial.find((item) => item.id === practicaActualId) ||
      historial[0] ||
      CASOS_PREDEFINIDOS[0]
    );
  }, [historial, practicaActualId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORIAL_KEY, JSON.stringify(historial));
    } catch {
      // Ignore
    }
  }, [historial]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_PROGRESO_KEY,
        JSON.stringify(completadosPorPractica)
      );
    } catch {
      // Ignore
    }
  }, [completadosPorPractica]);

  useEffect(() => {
    setCategoriaFiltro('Todas');
    setBusquedaRequisito('');
  }, [practicaActual.id]);

  const toggleModulo = (mod: ModuloOpcional) => {
    setModulos((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleSeleccionarNivel = (nuevoNivel: NivelPractica) => {
    setNivel(nuevoNivel);
    if (nuevoNivel === 'Iniciación') {
      setModulos(['Estilos', 'Encabezados y Pies']);
    } else if (nuevoNivel === 'Intermedio') {
      setModulos(['Tablas', 'Tabulaciones', 'Columnas', 'Encabezados y Pies']);
    } else {
      setModulos([
        'Portada',
        'Estilos',
        'Tablas',
        'Tabla de Contenido',
        'Encabezados y Pies',
      ]);
    }
  };

  // 3. INTEGRACIÓN CON LA API DE GEMINI (CLIENT-SIDE FETCH DIRECTO CON BYOK)
  const handleGenerarPractica = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const currentKey = (
      localStorage.getItem(API_KEY_STORAGE) ||
      apiKey ||
      ''
    ).trim();

    if (!currentKey) {
      mostrarNotificacion(
        'error',
        'Necesitas configurar tu Google Gemini API Key antes de generar una práctica.'
      );
      setModalKeyAbierto(true);
      return;
    }

    setIsGenerating(true);

    const modulosTexto =
      modulos.length > 0
        ? modulos.join(', ')
        : 'Formato general acorde al nivel seleccionado';

    const prompt = `Actúa como un profesor experto en Ofimática y Certificación MOS de Microsoft Word (versión escritorio en español).
Genera un caso práctico completo, riguroso y realista para un estudiante de ofimática con estos parámetros:
- Nivel de dificultad: ${nivel}
- Tipo de documento / Escenario: ${escenario}
- Módulos opcionales obligatorios a incluir en los requisitos técnicos: ${modulosTexto}
${
  temaPersonalizado.trim()
    ? `- Temática o sector empresarial: ${temaPersonalizado.trim()}`
    : ''
}

Reglas pedagógicas estrictas:
1. "texto_sin_formato": Entre 4 y 6 párrafos extensos y realistas de texto continuo sin formato (separados por saltos de línea dobles \\n\\n) listos para copiar y pegar en Microsoft Word. Incluye títulos de sección numerados (ej. "1. INTRODUCCIÓN...") y, si se incluyen "Tablas" o "Tabulaciones", añade bloques de datos con guiones (" - ") o puntos (" ... ") para que el alumno los convierta en tabla o aplique paradas de tabulación.
2. "requisitos_tecnicos": Entre 7 y 10 requisitos detallados con medidas exactas (puntos pt, centímetros cm, alineación, nombres de estilos, saltos) cuya suma total de "puntos" sea exactamente 100.
3. En cada requisito incluye:
   - "ruta_cinta_opciones": Ruta exacta en los menús en español de Microsoft Word (ej. "Inicio > Párrafo > Configuración de párrafo > Sangría y espacio").
   - "atajo_teclado": Atajo de teclado real en Word en español (ej. "Ctrl + J", "Ctrl + M", "Alt + Ctrl + 1", "Ctrl + Entrar").
   - "error_frecuente": Consejo docente advirtiendo del fallo habitual del estudiante en ese paso.`;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        currentKey
      )}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            response_schema: GEMINI_RESPONSE_SCHEMA,
            temperature: 0.7,
          },
        }),
      });

      if (response.status === 400 || response.status === 403) {
        mostrarNotificacion(
          'error',
          `Error ${response.status}: Tu API Key de Gemini es inválida, no tiene permisos o ha expirado. Por favor, revísala o introduce una nueva.`
        );
        setModalKeyAbierto(true);
        setIsGenerating(false);
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message ||
            `Error HTTP ${response.status} al llamar a Gemini API.`
        );
      }

      const result = await response.json();
      const rawJsonText =
        result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawJsonText) {
        throw new Error('La respuesta de Gemini no incluyó contenido JSON.');
      }

      const data = JSON.parse(rawJsonText.trim());

      const nuevaPractica: CasoPractico = {
        id: `custom-${Date.now()}`,
        fecha_creacion: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        nivel,
        escenario,
        modulos: [...modulos],
        tiempo_estimado_min: data.tiempo_estimado_min || 30,
        titulo_practica: data.titulo_practica,
        escenario_laboral: data.escenario_laboral,
        texto_sin_formato: data.texto_sin_formato,
        requisitos_tecnicos: Array.isArray(data.requisitos_tecnicos)
          ? data.requisitos_tecnicos
          : [],
        criterio_evaluacion_final: data.criterio_evaluacion_final || '',
      };

      setHistorial((prev) => [nuevaPractica, ...prev.slice(0, 19)]);
      setPracticaActualId(nuevaPractica.id);
      setSegundosCronometro(0);
      mostrarNotificacion('exito', '¡Nueva práctica de Word generada con éxito!');
    } catch (err: unknown) {
      mostrarNotificacion(
        'error',
        err instanceof Error
          ? err.message
          : 'Error de red o de formato al generar la práctica.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Exportar / Importar Caso en JSON para que el profesor comparta retos con la clase
  const handleExportarJSON = () => {
    const jsonString = JSON.stringify(practicaActual, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reto_word_${practicaActual.nivel.toLowerCase()}_${Date.now()
      .toString()
      .slice(-4)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarNotificacion(
      'exito',
      'Caso práctico exportado en JSON para compartir con tus alumnos.'
    );
  };

  const handleImportarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || ''));
        if (
          !parsed.titulo_practica ||
          !parsed.texto_sin_formato ||
          !Array.isArray(parsed.requisitos_tecnicos)
        ) {
          throw new Error('Estructura JSON no válida.');
        }
        const importada: CasoPractico = {
          ...parsed,
          id: `imported-${Date.now()}`,
          fecha_creacion: 'Importado JSON',
        };
        setHistorial((prev) => [importada, ...prev]);
        setPracticaActualId(importada.id);
        mostrarNotificacion(
          'exito',
          `Práctica "${importada.titulo_practica}" cargada correctamente.`
        );
      } catch {
        mostrarNotificacion(
          'error',
          'El archivo JSON seleccionado no tiene el formato de una práctica de OfiWord Studio.'
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const estadoCompletadosActual = useMemo(() => {
    return completadosPorPractica[practicaActual.id] || {};
  }, [completadosPorPractica, practicaActual.id]);

  const toggleRequisitoCompletado = (index: number) => {
    setCompletadosPorPractica((prev) => {
      const actual = prev[practicaActual.id] || {};
      return {
        ...prev,
        [practicaActual.id]: {
          ...actual,
          [index]: !actual[index],
        },
      };
    });
  };

  const reiniciarProgresoActual = () => {
    setCompletadosPorPractica((prev) => ({
      ...prev,
      [practicaActual.id]: {},
    }));
    setSegundosCronometro(0);
    setCronometroActivo(false);
  };

  const marcarTodosActual = () => {
    const todos: Record<number, boolean> = {};
    practicaActual.requisitos_tecnicos.forEach((_, idx) => {
      todos[idx] = true;
    });
    setCompletadosPorPractica((prev) => ({
      ...prev,
      [practicaActual.id]: todos,
    }));
  };

  const handleCopiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(practicaActual.texto_sin_formato);
      setCopiadoExito(true);
      setTimeout(() => setCopiadoExito(false), 2400);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = practicaActual.texto_sin_formato;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiadoExito(true);
      setTimeout(() => setCopiadoExito(false), 2400);
    }
  };

  const obtenerLogoBase64 = async (): Promise<string> => {
    try {
      const res = await fetch(LOGO_PATH);
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || LOGO_PATH));
        reader.onerror = () => resolve(LOGO_PATH);
        reader.readAsDataURL(blob);
      });
    } catch {
      return LOGO_PATH;
    }
  };

  // Exportar Hoja de Calificación y Rúbrica como archivo PDF profesional usando jsPDF + autoTable
  const handleExportarPDFCalificacion = async () => {
    setGenerandoPDF(true);
    try {
      // Guardar datos del alumno en localStorage para comodidad en futuras prácticas
      try {
        localStorage.setItem('ofiword_alumno_nombre', nombreAlumno);
        localStorage.setItem('ofiword_alumno_id', identificadorAlumno);
        localStorage.setItem('ofiword_alumno_grupo', grupoAlumno);
        localStorage.setItem('ofiword_alumno_centro', centroAlumno);
      } catch {
        // Ignore storage error
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Banda superior decorativa
      doc.setFillColor(15, 23, 42); // #0F172A
      doc.rect(0, 0, pageWidth, 34, 'F');
      doc.setFillColor(2, 132, 199); // #0284C7
      doc.rect(0, 34, pageWidth, 1.8, 'F');

      // Cargar logo manteniendo relación de aspecto exacta (sin distorsión)
      try {
        const logoDataUrl = await obtenerLogoBase64();
        if (logoDataUrl.startsWith('data:image')) {
          const dims = await new Promise<{ w: number; h: number }>((resolve) => {
            const img = new Image();
            img.onload = () =>
              resolve({
                w: img.naturalWidth || 100,
                h: img.naturalHeight || 100,
              });
            img.onerror = () => resolve({ w: 100, h: 100 });
            img.src = logoDataUrl;
          });
          const targetH = 22;
          const targetW = (dims.w / dims.h) * targetH;
          doc.addImage(logoDataUrl, 'PNG', margin, 6, targetW, targetH);
        }
      } catch {
        // Continue if logo cannot be embedded
      }

      // Textos de cabecera institucional
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(
        'HOJA OFICIAL DE CALIFICACIÓN Y RÚBRICA DE OFIMÁTICA',
        margin + 26,
        14
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(186, 230, 253);
      doc.text(
        'OfiWord Studio · Laboratorio de Microsoft Word · Un Fantasma en el Sistema',
        margin + 26,
        20.5
      );

      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      const fechaEmision = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.text(
        `Web: https://www.unfantasmaenelsistema.com/   |   Emisión: ${fechaEmision}`,
        margin + 26,
        26.5
      );

      let currentY = 43;

      // 1. Bloque de Datos Personales del Estudiante y Metadatos de la Práctica
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 38, 2.5, 2.5, 'FD');

      doc.setTextColor(2, 132, 199);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('1. DATOS DEL ESTUDIANTE Y DEL EJERCICIO EVALUADO', margin + 4, currentY + 6.5);

      doc.setDrawColor(226, 232, 240);
      doc.line(margin + 4, currentY + 8.5, pageWidth - margin - 4, currentY + 8.5);

      const colLeftX = margin + 4;
      const colRightX = pageWidth / 2 + 4;

      doc.setFontSize(8.8);
      // Columna izquierda
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Estudiante:', colLeftX, currentY + 14.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(
        nombreAlumno.trim() || 'No especificado',
        colLeftX + 22,
        currentY + 14.5
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('DNI / ID / Correo:', colLeftX, currentY + 20.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(
        identificadorAlumno.trim() || 'No especificado',
        colLeftX + 29,
        currentY + 20.5
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Grupo / Curso:', colLeftX, currentY + 26.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(
        grupoAlumno.trim() || 'No especificado',
        colLeftX + 25,
        currentY + 26.5
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Centro / Materia:', colLeftX, currentY + 32.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(
        centroAlumno.trim() || 'Ofimática y Procesamiento de Textos',
        colLeftX + 28,
        currentY + 32.5
      );

      // Columna derecha
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Nivel y Escenario:', colRightX, currentY + 14.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${practicaActual.nivel} · ${practicaActual.escenario}`,
        colRightX + 30,
        currentY + 14.5
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Modalidad:', colRightX, currentY + 20.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(
        modoExamen ? 'Modo Examen (Sin ayudas)' : 'Modo Práctica Guiada',
        colRightX + 20,
        currentY + 20.5
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Tiempo empleado:', colRightX, currentY + 26.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${formatearTiempo(segundosCronometro)} min`,
        colRightX + 30,
        currentY + 26.5
      );

      const reglasVerificadas = Object.values(reglasPreentrega).filter(Boolean).length;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Autocontrol (¶):', colRightX, currentY + 32.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${reglasVerificadas} de 4 reglas de oro verificadas`,
        colRightX + 28,
        currentY + 32.5
      );

      currentY += 43;

      // 2. Resumen del Caso y Barra de Puntuación
      doc.setFillColor(240, 249, 255);
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2.5, 2.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const tituloRecortado = doc.splitTextToSize(
        `Caso Práctico: ${practicaActual.titulo_practica}`,
        pageWidth - margin * 2 - 55
      );
      doc.text(tituloRecortado[0], margin + 4, currentY + 7);

      // Puntuación destacada a la derecha
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(2, 132, 199);
      doc.text(
        `${puntosAcumulados} / ${puntosTotales} PTS (${porcentajeProgreso}%)`,
        pageWidth - margin - 4,
        currentY + 7.5,
        { align: 'right' }
      );

      // Barra de progreso dibujada en el PDF
      const barX = margin + 4;
      const barY = currentY + 11.5;
      const barW = pageWidth - margin * 2 - 8;
      const barH = 4;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F');
      if (porcentajeProgreso > 0) {
        if (porcentajeProgreso === 100) {
          doc.setFillColor(5, 150, 105);
        } else if (porcentajeProgreso >= 60) {
          doc.setFillColor(2, 132, 199);
        } else {
          doc.setFillColor(217, 119, 6);
        }
        doc.roundedRect(
          barX,
          barY,
          Math.max(3, (barW * porcentajeProgreso) / 100),
          barH,
          1.5,
          1.5,
          'F'
        );
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Estado de la evaluación: ${estadoCalificacion.etiqueta} · Requisitos completados: ${completadosCount} de ${practicaActual.requisitos_tecnicos.length}`,
        margin + 4,
        currentY + 20.5
      );

      currentY += 29;

      // 3. Tabla detallada de la Rúbrica Técnica con autoTable
      const tableBody = practicaActual.requisitos_tecnicos.map((req, idx) => {
        const hecho = !!estadoCompletadosActual[idx];
        const num = String(idx + 1).padStart(2, '0');
        const puntosTexto = hecho
          ? `${req.puntos} / ${req.puntos}`
          : `0 / ${req.puntos}`;
        const rutaAtajo = req.atajo_teclado
          ? `${req.ruta_cinta_opciones}\n(Atajo: ${req.atajo_teclado})`
          : req.ruta_cinta_opciones;

        return [
          num,
          req.categoria,
          req.accion_requerida,
          rutaAtajo,
          hecho ? 'COMPLETADO' : 'PENDIENTE',
          puntosTexto,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [
            'N.º',
            'Categoría',
            'Acción Técnica Requerida',
            'Ruta en Cinta de Opciones / Atajo',
            'Estado',
            'Puntos',
          ],
        ],
        body: tableBody,
        foot: [
          [
            '',
            '',
            '',
            'PUNTUACIÓN TOTAL ACUMULADA EN LA RÚBRICA',
            `${porcentajeProgreso}%`,
            `${puntosAcumulados} / ${puntosTotales} pts`,
          ],
        ],
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [30, 41, 59],
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.2,
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 27, fontStyle: 'bold' },
          2: { cellWidth: 68 },
          3: { cellWidth: 42, fontSize: 7.4, textColor: [3, 105, 161] },
          4: { cellWidth: 20, halign: 'center', fontStyle: 'bold', fontSize: 7.2 },
          5: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            const isCompleted = !!estadoCompletadosActual[rowIndex];
            if (isCompleted) {
              data.cell.styles.fillColor = [236, 253, 245]; // Verde muy suave
            }
            if (data.column.index === 4) {
              data.cell.styles.textColor = isCompleted
                ? [5, 150, 105]
                : [180, 83, 9];
            }
          }
        },
      });

      // Posición después de la tabla
      const finalY =
        (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
          ?.finalY || currentY + 80;

      let nextY = finalY + 6;
      if (nextY + 52 > pageHeight - 15) {
        doc.addPage();
        nextY = 20;
      }

      // 4. Criterio de Evaluación Final y Observaciones del Alumno
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, nextY, pageWidth - margin * 2, 24, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Criterio de Evaluación Final:', margin + 3.5, nextY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const criterioLineas = doc.splitTextToSize(
        practicaActual.criterio_evaluacion_final,
        pageWidth - margin * 2 - 7
      );
      doc.text(criterioLineas.slice(0, 3), margin + 3.5, nextY + 10.5);

      if (observacionesAlumno.trim()) {
        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones del estudiante:', margin + 3.5, nextY + 19.5);
        doc.setFont('helvetica', 'italic');
        const obsRecortada = doc.splitTextToSize(
          observacionesAlumno.trim(),
          pageWidth - margin * 2 - 52
        );
        doc.text(obsRecortada[0], margin + 48, nextY + 19.5);
      }

      nextY += 29;

      // 5. Cajas de Firma del Estudiante y Validación del Docente
      const boxW = (pageWidth - margin * 2 - 6) / 2;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, nextY, boxW, 20, 2, 2, 'FD');
      doc.roundedRect(margin + boxW + 6, nextY, boxW, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Firma de conformidad del Estudiante:', margin + 3.5, nextY + 5);
      doc.text(
        'Sello, Revisión y Nota Definitiva del Docente:',
        margin + boxW + 9.5,
        nextY + 5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Archivo .docx adjunto · ${nombreAlumno.trim() || 'Alumno/a'}`,
        margin + 3.5,
        nextY + 17
      );
      doc.text(
        'Calificación tras inspección de marcas (¶): ______ / 100 pts',
        margin + boxW + 9.5,
        nextY + 17
      );

      // Pie de página con numeración en todas las páginas
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          'OfiWord Studio · Un Fantasma en el Sistema (https://www.unfantasmaenelsistema.com/)',
          margin,
          pageHeight - 7
        );
        doc.text(
          `Página ${p} de ${totalPages}`,
          pageWidth - margin,
          pageHeight - 7,
          { align: 'right' }
        );
      }

      const slugAlumno = (nombreAlumno.trim() || 'estudiante')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '_')
        .slice(0, 25);
      const slugPractica = practicaActual.nivel.toLowerCase();

      doc.save(`calificacion_word_${slugAlumno}_${slugPractica}.pdf`);
      mostrarNotificacion(
        'exito',
        'Hoja de Calificación exportada en formato PDF correctamente.'
      );
    } catch (err: unknown) {
      console.error('Error al generar el PDF:', err);
      mostrarNotificacion(
        'error',
        'No se pudo generar el archivo PDF. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setGenerandoPDF(false);
    }
  };

  // Descargar el archivo único SPA (index.html) 100% autocontenido para subir directamente a GitHub Pages
  const handleDescargarSingleFileGitHubPages = async () => {
    const logoDataUri = await obtenerLogoBase64();

    const singleFileHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OfiWord Studio — Un Fantasma en el Sistema</title>
  <link rel="icon" type="image/png" href="${logoDataUri}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #F8FAFC;
      --surface: #FFFFFF;
      --surface-alt: #F1F5F9;
      --border: #E2E8F0;
      --text: #0F172A;
      --muted: #475569;
      --accent: #0284C7;
      --accent-hover: #0369A1;
      --success: #059669;
      --success-bg: #ECFDF5;
      --danger: #DC2626;
      --radius: 10px;
      --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      --font-mono: 'IBM Plex Mono', monospace;
    }
    body.dark {
      --bg: #0F172A;
      --surface: #1E293B;
      --surface-alt: #090E1A;
      --border: #334155;
      --text: #F8FAFC;
      --muted: #94A3B8;
      --success-bg: rgba(5, 150, 105, 0.15);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font-sans);
      background: var(--bg);
      color: var(--text);
      line-height: 1.55;
      transition: background 0.15s, color 0.15s;
    }
    .topbar {
      position: sticky; top: 0; z-index: 20;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 0.75rem 1.5rem;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
    }
    .brand-wrap {
      display: flex; align-items: center; gap: 0.75rem; text-decoration: none; color: var(--text);
    }
    .brand-logo {
      height: 42px; width: auto; object-fit: contain; flex-shrink: 0; display: block;
    }
    .brand-title { font-weight: 700; font-size: 1.05rem; letter-spacing: -0.02em; }
    .brand-sub { font-size: 0.75rem; color: var(--accent); font-weight: 600; display: block; }
    .top-actions { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
    .container { max-width: 1380px; margin: 0 auto; padding: 1.5rem; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.35rem;
      margin-bottom: 1.25rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
      align-items: end;
    }
    label.field-label {
      display: block; font-size: 0.78rem; font-weight: 600; margin-bottom: 0.45rem;
    }
    select, input[type="text"], input[type="password"], textarea {
      width: 100%;
      padding: 0.6rem 0.8rem;
      border-radius: 7px;
      border: 1px solid var(--border);
      background: var(--surface-alt);
      color: var(--text);
      font-family: inherit;
      font-size: 0.875rem;
    }
    .modules-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .mod-chip {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.4rem 0.7rem; border: 1px solid var(--border);
      border-radius: 6px; font-size: 0.8rem; cursor: pointer; user-select: none;
      background: var(--surface-alt);
    }
    .mod-chip input { margin: 0; accent-color: var(--accent); }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
      padding: 0.6rem 1.1rem; border-radius: 7px; font-weight: 600; font-size: 0.82rem;
      border: 1px solid transparent; cursor: pointer; font-family: inherit; white-space: nowrap;
      text-decoration: none;
    }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-primary:disabled { opacity: 0.6; cursor: wait; }
    .btn-outline { background: transparent; border-color: var(--border); color: var(--text); }
    .btn-outline:hover { background: var(--surface-alt); }
    .btn-danger { background: var(--danger); color: #fff; }
    .workspace {
      display: grid;
      grid-template-columns: 5fr 7fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 980px) { .workspace { grid-template-columns: 1fr; } }
    .meta-line { font-size: 0.78rem; color: var(--muted); margin-bottom: 0.4rem; }
    .scenario-box {
      background: var(--surface-alt); border: 1px solid var(--border);
      border-radius: 8px; padding: 0.9rem 1rem; font-size: 0.88rem; margin: 0.85rem 0 1.1rem;
    }
    textarea.raw-text {
      font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.6;
      height: 390px; resize: vertical; margin-top: 0.5rem;
    }
    .progress-box {
      background: var(--surface-alt); border: 1px solid var(--border);
      border-radius: 8px; padding: 0.9rem 1rem; margin: 0.85rem 0 1.1rem;
    }
    .progress-track {
      width: 100%; height: 9px; background: var(--border);
      border-radius: 99px; overflow: hidden; margin-top: 0.5rem;
    }
    .progress-bar {
      height: 100%; background: var(--accent); width: 0%; transition: width 0.2s ease;
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { border-bottom: 1px solid var(--border); padding: 0.75rem 0.6rem; text-align: left; vertical-align: top; }
    th { font-size: 0.75rem; color: var(--muted); background: var(--surface-alt); }
    tr.completed td { background: var(--success-bg); }
    tr.completed .req-desc { text-decoration: line-through; opacity: 0.7; }
    .ribbon-code {
      font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent);
      background: var(--surface-alt); padding: 0.25rem 0.45rem; border-radius: 4px;
      border: 1px solid var(--border); display: inline-block;
    }
    .exam-mode .col-ribbon { display: none; }
    .pts-col { font-family: var(--font-mono); font-variant-numeric: tabular-nums; text-align: right; font-weight: 600; white-space: nowrap; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75);
      display: none; align-items: center; justify-content: center; z-index: 50; padding: 1rem;
      backdrop-filter: blur(3px);
    }
    .modal-backdrop.active { display: flex; }
    .modal {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; max-width: 480px; width: 100%; padding: 1.5rem;
    }
    .toast {
      position: fixed; bottom: 1.25rem; right: 1.25rem; z-index: 60;
      padding: 0.85rem 1.15rem; border-radius: 8px; font-size: 0.84rem; font-weight: 500;
      border: 1px solid var(--border); background: var(--surface); color: var(--text);
      box-shadow: 0 10px 25px rgba(0,0,0,0.15); display: none; max-width: 420px;
    }
    .toast.active { display: block; }
    .footer {
      border-top: 1px solid var(--border); padding: 1.5rem; margin-top: 2rem;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
      font-size: 0.82rem; color: var(--muted); max-width: 1380px; margin-left: auto; margin-right: auto;
    }
    .spinner {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <header class="topbar">
    <a href="${AUTHOR_WEB_URL}" target="_blank" rel="noopener noreferrer" class="brand-wrap">
      <img src="${logoDataUri}" alt="Logo Un Fantasma en el Sistema" class="brand-logo" />
      <div>
        <span class="brand-title">OfiWord Studio · Prácticas de Microsoft Word</span>
        <span class="brand-sub">unfantasmaenelsistema.com</span>
      </div>
    </a>
    <div class="top-actions">
      <a href="${AUTHOR_WEB_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Visitar Web</a>
      <button type="button" class="btn btn-outline" id="btn-theme">Tema Claro / Oscuro</button>
      <button type="button" class="btn btn-outline" id="btn-manage-key">Cambiar / Borrar API Key</button>
    </div>
  </header>

  <main class="container">
    <section class="card">
      <form id="form-generator">
        <div class="form-grid">
          <div>
            <label class="field-label" for="sel-nivel">1. Nivel de Competencia</label>
            <select id="sel-nivel">
              <option value="Iniciación">Iniciación (fuentes, alineación, interlineado, sangrías, viñetas)</option>
              <option value="Intermedio" selected>Intermedio (tablas complejas, tabulaciones con relleno, columnas, saltos)</option>
              <option value="Avanzado">Avanzado (estilos jerárquicos, TOC automática, encabezados desvinculados)</option>
            </select>
          </div>
          <div>
            <label class="field-label" for="sel-escenario">2. Escenario / Tipo de Documento</label>
            <select id="sel-escenario">
              <option value="Circular interna corporativa">Circular interna corporativa</option>
              <option value="Informe técnico" selected>Informe técnico</option>
              <option value="Manual de procedimientos">Manual de procedimientos</option>
              <option value="Carta formal comercial">Carta formal comercial</option>
              <option value="Acta de reunión ejecutiva">Acta de reunión ejecutiva</option>
              <option value="Pliego de prescripciones técnicas">Pliego de prescripciones técnicas</option>
            </select>
          </div>
          <div>
            <label class="field-label">3. Módulos Opcionales a Incluir</label>
            <div class="modules-wrap" id="modulos-container">
              <label class="mod-chip"><input type="checkbox" value="Tablas" checked /> Tablas</label>
              <label class="mod-chip"><input type="checkbox" value="Estilos" checked /> Estilos</label>
              <label class="mod-chip"><input type="checkbox" value="Tabulaciones" checked /> Tabulaciones</label>
              <label class="mod-chip"><input type="checkbox" value="Columnas" checked /> Columnas</label>
              <label class="mod-chip"><input type="checkbox" value="Portada" /> Portada</label>
              <label class="mod-chip"><input type="checkbox" value="Encabezados y Pies" /> Encabezados</label>
              <label class="mod-chip"><input type="checkbox" value="Tabla de Contenido" /> Índice TOC</label>
            </div>
          </div>
          <div>
            <button type="submit" class="btn btn-primary" id="btn-generate" style="width:100%;">
              Generar Práctica
            </button>
          </div>
        </div>
      </form>
    </section>

    <div class="workspace">
      <section class="card">
        <div class="meta-line" id="practice-meta">Nivel Intermedio · Informe técnico</div>
        <h2 id="practice-title" style="margin:0 0 0.5rem 0; font-size:1.25rem;"></h2>
        <div class="scenario-box">
          <strong>Contexto del encargo laboral:</strong>
          <p id="practice-scenario" style="margin:0.35rem 0 0 0;"></p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <label class="field-label" for="raw-text" style="margin:0;">Texto sin formato (Pegar en Word)</label>
          <button type="button" class="btn btn-primary" id="btn-copy">Copiar texto al portapapeles</button>
        </div>
        <textarea id="raw-text" class="raw-text" readonly></textarea>
      </section>

      <section class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap;">
          <h2 style="margin:0; font-size:1.15rem;">Hoja de Instrucciones y Rúbrica</h2>
          <button type="button" class="btn btn-outline" id="btn-toggle-mode">Modo: Práctica Guiada</button>
        </div>
        <div class="progress-box">
          <div style="display:flex; justify-content:space-between; font-size:0.84rem; font-weight:600;">
            <span>Progreso acumulado</span>
            <span id="score-readout" class="pts-col">0 / 100 pts (0%)</span>
          </div>
          <div class="progress-track"><div class="progress-bar" id="progress-bar"></div></div>
        </div>
        <div style="overflow-x:auto;">
          <table id="rubric-table">
            <thead>
              <tr>
                <th style="width:42px;">Hecho</th>
                <th>Categoría y Acción Requerida</th>
                <th class="col-ribbon">Ruta Cinta de Opciones / Atajo</th>
                <th class="pts-col">Puntos</th>
              </tr>
            </thead>
            <tbody id="rubric-body"></tbody>
          </table>
        </div>
        <p style="margin-top:1rem; font-size:0.82rem; color:var(--muted);">
          <strong>Criterio de evaluación final:</strong> <span id="practice-criteria"></span>
        </p>
      </section>
    </div>
  </main>

  <footer class="footer">
    <div style="display:flex; align-items:center; gap:0.65rem;">
      <img src="${logoDataUri}" alt="Logo Un Fantasma en el Sistema" style="height:32px; width:auto; object-fit:contain;" />
      <span>Creado por <a href="${AUTHOR_WEB_URL}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-weight:600; text-decoration:none;">Un Fantasma en el Sistema</a></span>
    </div>
    <a href="${AUTHOR_WEB_URL}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-weight:600;">${AUTHOR_WEB_URL}</a>
  </footer>

  <div class="modal-backdrop" id="key-modal">
    <div class="modal">
      <h3 style="margin:0 0 0.5rem 0;">Configurar Google Gemini API Key (BYOK)</h3>
      <p style="font-size:0.85rem; color:var(--muted); margin:0 0 0.85rem 0;">
        Esta aplicación se ejecuta 100% en tu navegador. Tu clave se almacena únicamente en <code>localStorage</code> de este dispositivo.
      </p>
      <p style="font-size:0.84rem; margin:0 0 1rem 0;">
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-weight:600;">
          Obtén tu API Key gratuita en https://aistudio.google.com/app/apikey
        </a>
      </p>
      <form id="form-key">
        <label class="field-label" for="input-api-key">Tu Gemini API Key</label>
        <input type="password" id="input-api-key" placeholder="AIzaSy..." required />
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.1rem; flex-wrap:wrap;">
          <button type="button" class="btn btn-danger" id="btn-clear-key">Borrar Clave</button>
          <button type="button" class="btn btn-outline" id="btn-close-modal">Cerrar</button>
          <button type="submit" class="btn btn-primary">Guardar Clave</button>
        </div>
      </form>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const INITIAL_PRACTICE = ${JSON.stringify(practicaActual)};
    const SCHEMA = ${JSON.stringify(GEMINI_RESPONSE_SCHEMA)};
    let currentPractice = INITIAL_PRACTICE;
    let checkedMap = {};
    let examMode = false;

    const modal = document.getElementById('key-modal');
    const inputKey = document.getElementById('input-api-key');
    const toastEl = document.getElementById('toast');

    function showToast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('active');
      setTimeout(() => toastEl.classList.remove('active'), 4500);
    }

    function checkStoredKey() {
      const k = localStorage.getItem('gemini_api_key');
      if (!k) {
        modal.classList.add('active');
      } else {
        inputKey.value = k;
      }
    }

    document.getElementById('btn-manage-key').onclick = () => {
      inputKey.value = localStorage.getItem('gemini_api_key') || '';
      modal.classList.add('active');
    };
    document.getElementById('btn-close-modal').onclick = () => modal.classList.remove('active');
    document.getElementById('btn-clear-key').onclick = () => {
      localStorage.removeItem('gemini_api_key');
      inputKey.value = '';
      showToast('Clave borrada de localStorage.');
    };
    document.getElementById('form-key').onsubmit = (e) => {
      e.preventDefault();
      const val = inputKey.value.trim();
      if (!val) return;
      localStorage.setItem('gemini_api_key', val);
      modal.classList.remove('active');
      showToast('API Key guardada en tu navegador.');
    };

    document.getElementById('btn-theme').onclick = () => document.body.classList.toggle('dark');

    document.getElementById('btn-toggle-mode').onclick = (e) => {
      examMode = !examMode;
      document.getElementById('rubric-table').classList.toggle('exam-mode', examMode);
      e.target.textContent = examMode ? 'Modo: Examen (Sin Ayudas)' : 'Modo: Práctica Guiada';
    };

    document.getElementById('btn-copy').onclick = async (e) => {
      await navigator.clipboard.writeText(currentPractice.texto_sin_formato);
      const btn = e.currentTarget;
      btn.textContent = '¡Copiado!';
      setTimeout(() => btn.textContent = 'Copiar texto al portapapeles', 2000);
    };

    function renderPractice() {
      document.getElementById('practice-title').textContent = currentPractice.titulo_practica;
      document.getElementById('practice-scenario').textContent = currentPractice.escenario_laboral;
      document.getElementById('raw-text').value = currentPractice.texto_sin_formato;
      document.getElementById('practice-criteria').textContent = currentPractice.criterio_evaluacion_final;

      const tbody = document.getElementById('rubric-body');
      tbody.innerHTML = '';
      let earned = 0, total = 0;

      currentPractice.requisitos_tecnicos.forEach((req, idx) => {
        const pts = Number(req.puntos) || 0;
        total += pts;
        if (checkedMap[idx]) earned += pts;

        const tr = document.createElement('tr');
        if (checkedMap[idx]) tr.classList.add('completed');
        tr.innerHTML = \`
          <td><input type="checkbox" \${checkedMap[idx] ? 'checked' : ''} data-idx="\${idx}" /></td>
          <td>
            <strong>\${req.categoria}</strong>
            <div class="req-desc" style="margin-top:0.2rem;">\${req.accion_requerida}</div>
            \${req.error_frecuente && !examMode ? '<div style="margin-top:0.35rem; font-size:0.75rem; color:var(--muted);">Evita: ' + req.error_frecuente + '</div>' : ''}
          </td>
          <td class="col-ribbon">
            <span class="ribbon-code">\${req.ruta_cinta_opciones}</span>
            \${req.atajo_teclado ? '<div style="margin-top:0.25rem; font-size:0.72rem; font-family:var(--font-mono);">Atajo: ' + req.atajo_teclado + '</div>' : ''}
          </td>
          <td class="pts-col">+\${pts}</td>
        \`;
        tr.querySelector('input').onchange = (ev) => {
          checkedMap[idx] = ev.target.checked;
          renderPractice();
        };
        tbody.appendChild(tr);
      });

      const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
      document.getElementById('score-readout').textContent = \`\${earned} / \${total} pts (\${pct}%)\`;
      document.getElementById('progress-bar').style.width = pct + '%';
    }

    document.getElementById('form-generator').onsubmit = async (e) => {
      e.preventDefault();
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        showToast('Introduce tu Gemini API Key primero.');
        modal.classList.add('active');
        return;
      }
      const nivel = document.getElementById('sel-nivel').value;
      const escenario = document.getElementById('sel-escenario').value;
      const modulos = Array.from(document.querySelectorAll('#modulos-container input:checked')).map(i => i.value);

      const btn = document.getElementById('btn-generate');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Generando...';

      try {
        const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${encodeURIComponent(apiKey)}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: \`Genera un caso práctico de Microsoft Word en español. Nivel: \${nivel}. Escenario: \${escenario}. Módulos obligatorios: \${modulos.join(', ')}. Incluye de 4 a 5 párrafos extensos en texto_sin_formato y requisitos_tecnicos con atajo_teclado y error_frecuente que sumen 100 puntos.\` }] }],
            generationConfig: { response_mime_type: 'application/json', response_schema: SCHEMA }
          })
        });

        if (res.status === 400 || res.status === 403) {
          showToast('Error ' + res.status + ': API Key inválida o expirada. Actualízala.');
          modal.classList.add('active');
          return;
        }
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          currentPractice = JSON.parse(text);
          checkedMap = {};
          document.getElementById('practice-meta').textContent = \`Nivel \${nivel} · \${escenario}\`;
          renderPractice();
          showToast('¡Práctica generada correctamente!');
        }
      } catch (err) {
        showToast('Error al conectar con Gemini API.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Generar Práctica';
      }
    };

    checkStoredKey();
    renderPractice();
  </script>
</body>
</html>`;

    const blob = new Blob([singleFileHTML], {
      type: 'text/html;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
    mostrarNotificacion(
      'exito',
      'Archivo único "index.html" (con tu logo incrustado) descargado para GitHub Pages.'
    );
  };

  // Estadísticas del texto base
  const estadisticasTexto = useMemo(() => {
    const texto = practicaActual.texto_sin_formato.trim();
    if (!texto)
      return { palabras: 0, caracteres: 0, sinEspacios: 0, parrafos: 0 };
    const palabras = texto.split(/\s+/).filter(Boolean).length;
    const caracteres = texto.length;
    const sinEspacios = texto.replace(/\s+/g, '').length;
    const parrafos = texto
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean).length;
    return { palabras, caracteres, sinEspacios, parrafos };
  }, [practicaActual.texto_sin_formato]);

  // Procesador de bloques para el Simulador Visual A4 de Maqueta Objetivo
  const bloquesSimuladosA4 = useMemo(() => {
    const bloques = practicaActual.texto_sin_formato
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    return bloques.map((bloque, idx) => {
      const lineas = bloque.split('\n').map((l) => l.trim()).filter(Boolean);

      // Detectar si contiene líneas de tabla (con " - ")
      const lineasConGuion = lineas.filter((l) => l.includes(' - '));
      if (lineasConGuion.length >= 2) {
        const encabezadoSeccion =
          !lineas[0].includes(' - ') ? lineas[0] : null;
        const filasTabla = (encabezadoSeccion ? lineas.slice(1) : lineas).map(
          (l) => l.split(' - ').map((c) => c.trim())
        );
        return {
          tipo: 'tabla' as const,
          id: idx,
          tituloSeccion: encabezadoSeccion,
          filas: filasTabla,
        };
      }

      // Detectar si contiene líneas de tabulación con relleno (" ... ")
      const lineasTabuladas = lineas.filter((l) => l.includes('...'));
      if (lineasTabuladas.length >= 2) {
        const encabezadoSeccion = !lineas[0].includes('...') ? lineas[0] : null;
        const filasTab = (encabezadoSeccion ? lineas.slice(1) : lineas).map(
          (l) => l.split('...').map((c) => c.trim())
        );
        return {
          tipo: 'tabulaciones' as const,
          id: idx,
          tituloSeccion: encabezadoSeccion,
          filas: filasTab,
        };
      }

      // Detectar si es el título principal del documento (primer bloque en mayúsculas)
      if (idx === 0 && bloque === bloque.toUpperCase()) {
        return {
          tipo: 'titulo_principal' as const,
          id: idx,
          lineas,
        };
      }

      // Párrafo con o sin epígrafe inicial
      const primeraLineaEsTitulo =
        lineas.length > 1 &&
        (lineas[0] === lineas[0].toUpperCase() ||
          /^\d+(\.\d+)?\s/.test(lineas[0]));

      return {
        tipo: 'parrafo' as const,
        id: idx,
        epigrafe: primeraLineaEsTitulo ? lineas[0] : null,
        cuerpo: primeraLineaEsTitulo ? lineas.slice(1).join(' ') : lineas.join(' '),
        enDosColumnas:
          practicaActual.modulos.includes('Columnas') && idx === 2,
      };
    });
  }, [practicaActual.texto_sin_formato, practicaActual.modulos]);

  // Cálculo de progreso y puntos
  const {
    puntosAcumulados,
    puntosTotales,
    porcentajeProgreso,
    completadosCount,
  } = useMemo(() => {
    let acumulados = 0;
    let totales = 0;
    let count = 0;
    practicaActual.requisitos_tecnicos.forEach((req, idx) => {
      const pts = Number(req.puntos) || 0;
      totales += pts;
      if (estadoCompletadosActual[idx]) {
        acumulados += pts;
        count += 1;
      }
    });
    const pct = totales > 0 ? Math.round((acumulados / totales) * 100) : 0;
    return {
      puntosAcumulados: acumulados,
      puntosTotales: totales,
      porcentajeProgreso: pct,
      completadosCount: count,
    };
  }, [practicaActual.requisitos_tecnicos, estadoCompletadosActual]);

  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>();
    practicaActual.requisitos_tecnicos.forEach((r) => {
      if (r.categoria) set.add(r.categoria);
    });
    return ['Todas', ...Array.from(set)];
  }, [practicaActual.requisitos_tecnicos]);

  const requisitosFiltrados = useMemo(() => {
    return practicaActual.requisitos_tecnicos
      .map((req, originalIndex) => ({ req, originalIndex }))
      .filter(({ req }) => {
        const coincideCategoria =
          categoriaFiltro === 'Todas' || req.categoria === categoriaFiltro;
        const termino = busquedaRequisito.trim().toLowerCase();
        const coincideTexto =
          !termino ||
          req.accion_requerida.toLowerCase().includes(termino) ||
          req.categoria.toLowerCase().includes(termino) ||
          req.ruta_cinta_opciones.toLowerCase().includes(termino);
        return coincideCategoria && coincideTexto;
      });
  }, [
    practicaActual.requisitos_tecnicos,
    categoriaFiltro,
    busquedaRequisito,
  ]);

  const estadoCalificacion = useMemo(() => {
    if (porcentajeProgreso === 100) {
      return {
        etiqueta: 'Práctica completada (Sobresaliente · 100%)',
        claseTexto: darkMode ? 'text-emerald-400' : 'text-emerald-700',
        claseBarra: 'bg-emerald-600',
      };
    }
    if (porcentajeProgreso >= 60) {
      return {
        etiqueta: 'Requisitos mínimos superados (Apto)',
        claseTexto: darkMode ? 'text-sky-400' : 'text-sky-700',
        claseBarra: 'bg-[#0284C7]',
      };
    }
    if (porcentajeProgreso > 0) {
      return {
        etiqueta: 'En desarrollo — Continúa aplicando formatos',
        claseTexto: darkMode ? 'text-amber-400' : 'text-amber-700',
        claseBarra: 'bg-amber-600',
      };
    }
    return {
      etiqueta: 'Pendiente de iniciar en Microsoft Word',
      claseTexto: darkMode ? 'text-slate-400' : 'text-slate-600',
      claseBarra: 'bg-slate-400',
    };
  }, [porcentajeProgreso, darkMode]);

  return (
    <div
      className={`min-h-screen transition-colors duration-150 ${
        darkMode
          ? 'bg-[#0F172A] text-[#F8FAFC] tracking-[0.005em]'
          : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Top Bar con Logo sin distorsionar y enlace a https://www.unfantasmaenelsistema.com/ */}
      <header
        className={`sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3 border-b transition-colors ${
          darkMode
            ? 'bg-[#0F172A]/95 border-[#1E293B]'
            : 'bg-white/95 border-[#E2E8F0]'
        } backdrop-blur-sm`}
      >
        {/* Zone 1: Brand + Logo sin distorsionar */}
        <a
          href={AUTHOR_WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 whitespace-nowrap shrink-0 group"
          title="Visitar Un Fantasma en el Sistema"
        >
          <img
            src={LOGO_PATH}
            alt="Logo Un Fantasma en el Sistema"
            className="h-11 w-auto object-contain shrink-0 transition-transform duration-150 group-hover:scale-105"
          />
          <span className="text-lg font-bold tracking-tight">
            OfiWord Studio
          </span>
        </a>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a
            href="#configurador"
            onClick={() => setMostrarConfigurador(true)}
            className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 ${
              darkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Configurador
          </a>
          <a
            href="#material-trabajo"
            className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 ${
              darkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Material y Maqueta A4
          </a>
          <a
            href="#hoja-instrucciones"
            className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 ${
              darkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rúbrica
          </a>
          <button
            type="button"
            onClick={() => setModalGlosarioAbierto(true)}
            className={`transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4 cursor-pointer ${
              darkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chuleta Word
          </button>
          <a
            href={AUTHOR_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#0284C7] font-semibold transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
          >
            <span>Un Fantasma en el Sistema</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </nav>

        {/* Zone 3: Botón discreto "Cambiar / Borrar API Key" */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setInputKey(localStorage.getItem(API_KEY_STORAGE) || apiKey);
              setModalKeyAbierto(true);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              apiKey
                ? darkMode
                  ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200/70'
                : 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span>Cambiar / Borrar API Key</span>
          </button>
        </div>
      </header>

      {/* Notificación Toast Flotante */}
      {toast && (
        <div
          role="alert"
          className={`fixed bottom-5 right-5 z-50 max-w-md px-4 py-3 rounded-xl border shadow-lg flex items-center justify-between gap-3 text-xs font-medium transition-all ${
            toast.tipo === 'error'
              ? darkMode
                ? 'bg-red-950 border-red-800 text-red-100'
                : 'bg-red-50 border-red-200 text-red-900'
              : darkMode
              ? 'bg-emerald-950 border-emerald-800 text-emerald-100'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{toast.mensaje}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 opacity-75 hover:opacity-100 cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MODAL CHULETA PEDAGÓGICA Y ATAJOS DE MICROSOFT WORD */}
      {modalGlosarioAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-glosario-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-xl border p-6 shadow-xl ${
              darkMode
                ? 'bg-[#1E293B] border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-semibold text-[#0284C7]">
                  Guía de Referencia Rápida para el Estudiante
                </p>
                <h2 id="modal-glosario-title" className="text-lg font-bold mt-0.5">
                  Atajos de Teclado y Conceptos Clave de Microsoft Word (Español)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalGlosarioAbierto(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6 mt-4">
              <div>
                <h3 className="text-xs font-semibold tracking-tight mb-2.5">
                  01. Atajos de teclado imprescindibles (Versión en Español)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {ATAJOS_REFERENCIA.map((item, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                        darkMode
                          ? 'bg-slate-900/70 border-slate-800'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <span>{item.accion}</span>
                      <code className="font-mono font-semibold text-[#0284C7] shrink-0">
                        {item.atajo}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                <div
                  className={`p-4 rounded-lg border ${
                    darkMode
                      ? 'bg-slate-900/70 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-1.5 text-[#0284C7]">
                    Salto de Página vs Salto de Sección
                  </h4>
                  <p className="mb-2">
                    <strong>Salto de página (Ctrl + Entrar):</strong> Pasa a la
                    hoja siguiente manteniendo los mismos márgenes, columnas y
                    encabezados.
                  </p>
                  <p>
                    <strong>Salto de sección (Disposición &gt; Saltos):</strong>{' '}
                    Divide el documento en partes independientes. Es obligatorio
                    cuando necesitas aplicar 2 columnas a un solo párrafo
                    (<em>Sección Continua</em>) o cambiar encabezados,
                    numeración u orientación de papel (<em>Página siguiente</em>).
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border ${
                    darkMode
                      ? 'bg-slate-900/70 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-sm mb-1.5 text-[#0284C7]">
                    Tipos de Paradas de Tabulación
                  </h4>
                  <ul className="space-y-1">
                    <li>
                      <strong>Izquierda:</strong> El texto se extiende hacia la
                      derecha desde la marca.
                    </li>
                    <li>
                      <strong>Centrada:</strong> El texto se centra sobre la
                      posición indicada en cm.
                    </li>
                    <li>
                      <strong>Derecha:</strong> El texto termina exactamente en
                      la marca (ideal para precios o estados al margen derecho).
                    </li>
                    <li>
                      <strong>Decimal:</strong> Alinea números por la coma
                      decimal independientemente de sus cifras.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setModalGlosarioAbierto(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] rounded-lg cursor-pointer"
              >
                Entendido, volver a la práctica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EMISIÓN DE HOJA DE CALIFICACIÓN EN PDF (jsPDF) */}
      {modalInformeAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-informe-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-xl rounded-xl border p-6 shadow-xl ${
              darkMode
                ? 'bg-[#1E293B] border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <img
                  src={LOGO_PATH}
                  alt="Logo Un Fantasma en el Sistema"
                  className="h-11 w-auto object-contain shrink-0"
                />
                <div>
                  <p className="text-xs font-semibold text-[#0284C7]">
                    Exportación Oficial en PDF con jsPDF
                  </p>
                  <h2
                    id="modal-informe-title"
                    className="text-base font-bold mt-0.5"
                  >
                    Emitir Hoja de Calificación y Rúbrica del Estudiante
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalInformeAbierto(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Nombre y Apellidos del Estudiante:
                  </label>
                  <input
                    type="text"
                    value={nombreAlumno}
                    onChange={(e) => setNombreAlumno(e.target.value)}
                    placeholder="Ej. Laura Gómez Pérez"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    DNI / NIA / Correo Electrónico:
                  </label>
                  <input
                    type="text"
                    value={identificadorAlumno}
                    onChange={(e) => setIdentificadorAlumno(e.target.value)}
                    placeholder="Ej. 12345678A o alumno@centro.es"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Grupo / Curso / Ciclo Formativo:
                  </label>
                  <input
                    type="text"
                    value={grupoAlumno}
                    onChange={(e) => setGrupoAlumno(e.target.value)}
                    placeholder="Ej. 1.º Administración y Finanzas"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Centro Educativo o Asignatura:
                  </label>
                  <input
                    type="text"
                    value={centroAlumno}
                    onChange={(e) => setCentroAlumno(e.target.value)}
                    placeholder="Ej. IES Tecnológico · Ofimática"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Observaciones o comentarios sobre tu entrega (.docx):
                </label>
                <textarea
                  rows={2}
                  value={observacionesAlumno}
                  onChange={(e) => setObservacionesAlumno(e.target.value)}
                  placeholder="Opcional: indica cualquier nota para el profesor..."
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-slate-900 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div
                className={`p-3.5 rounded-lg border space-y-1.5 ${
                  darkMode
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between font-semibold gap-2">
                  <span className="shrink-0">Práctica evaluada:</span>
                  <span className="text-right truncate">
                    {practicaActual.titulo_practica}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nivel y modalidad:</span>
                  <span>
                    {practicaActual.nivel} ·{' '}
                    {modoExamen
                      ? 'Modo Examen (Sin ayudas)'
                      : 'Modo Práctica Guiada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tiempo registrado en cronómetro:</span>
                  <span className="font-mono tabular-nums">
                    {formatearTiempo(segundosCronometro)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#0284C7] pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Puntuación en la rúbrica:</span>
                  <span className="font-mono tabular-nums">
                    {puntosAcumulados} / {puntosTotales} pts ({porcentajeProgreso}
                    %)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border cursor-pointer ${
                  darkMode
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir vista</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setModalInformeAbierto(false)}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExportarPDFCalificacion}
                  disabled={generandoPDF}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 rounded-lg cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>
                    {generandoPDF
                      ? 'Generando PDF...'
                      : 'Descargar Hoja de Calificación (.PDF)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EMERGENTE / BLOQUEANTE DE AUTENTICACIÓN BYOK */}
      {modalKeyAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-api-key-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
        >
          <div
            className={`w-full max-w-lg rounded-xl border p-6 shadow-xl ${
              darkMode
                ? 'bg-[#1E293B] border-slate-700 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={LOGO_PATH}
                  alt="Logo Un Fantasma en el Sistema"
                  className="h-12 w-auto object-contain shrink-0"
                />
                <div>
                  <h2
                    id="modal-api-key-title"
                    className="text-base font-bold tracking-tight"
                  >
                    Configuración de Google Gemini API Key (BYOK)
                  </h2>
                  <p
                    className={`text-xs ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Almacenamiento exclusivamente local en tu navegador
                  </p>
                </div>
              </div>

              {apiKey && (
                <button
                  type="button"
                  onClick={() => setModalKeyAbierto(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Cerrar ventana"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <p
              className={`text-xs leading-relaxed mb-4 ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Para generar nuevos casos prácticos con inteligencia artificial sin
              servidor intermedio (ideal para GitHub Pages), introduce tu clave
              gratuita de Google Gemini. La clave se guarda únicamente en{' '}
              <code className="font-mono px-1 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800">
                localStorage.getItem(&apos;gemini_api_key&apos;)
              </code>{' '}
              dentro de tu propio navegador.
            </p>

            {/* Enlace directo requerido */}
            <div
              className={`p-3.5 rounded-lg border mb-4 text-xs flex items-center justify-between gap-3 ${
                darkMode
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-sky-50/70 border-sky-200/80'
              }`}
            >
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#0284C7] hover:underline inline-flex items-center gap-1.5"
              >
                <span>
                  Obtén tu API Key gratuita en
                  https://aistudio.google.com/app/apikey
                </span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>

            <form onSubmit={handleGuardarApiKey} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="gemini-key-input"
                    className="text-xs font-semibold"
                  >
                    Tu Google Gemini API Key:
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarKeyTexto((v) => !v)}
                    className="text-xs text-[#0284C7] hover:underline cursor-pointer"
                  >
                    {mostrarKeyTexto ? 'Ocultar clave' : 'Mostrar clave'}
                  </button>
                </div>
                <input
                  id="gemini-key-input"
                  type={mostrarKeyTexto ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  autoComplete="off"
                  className={`w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0284C7] ${
                    darkMode
                      ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {apiKey ? (
                  <button
                    type="button"
                    onClick={handleBorrarApiKey}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Borrar clave guardada</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalKeyAbierto(false)}
                    className={`text-xs underline cursor-pointer ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Explorar primero los 3 casos oficiales sin clave
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {apiKey && (
                    <button
                      type="button"
                      onClick={() => setModalKeyAbierto(false)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg border cursor-pointer ${
                        darkMode
                          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg transition-colors cursor-pointer"
                  >
                    Guardar Clave
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main
        id="top"
        className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        {/* Banner de aviso si el usuario cerró el modal sin guardar API Key */}
        {!apiKey && (
          <div
            className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
              darkMode
                ? 'bg-amber-950/35 border-amber-800/70 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="text-xs space-y-0.5">
              <p className="font-semibold">
                Modo sin clave activa: estás viendo los 3 casos prácticos oficiales
                preinstalados (Iniciación, Intermedio y Avanzado).
              </p>
              <p>
                Configura tu Google Gemini API Key gratuita en{' '}
                <code className="font-mono">localStorage</code> para generar
                nuevos casos ilimitados o importa un archivo{' '}
                <code className="font-mono">.json</code> compartido por tu profesor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalKeyAbierto(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Introducir API Key
            </button>
          </div>
        )}

        {/* Barra de Herramientas Secundaria con Identidad Visual y Utilidades Docentes */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <a
              href={AUTHOR_WEB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
              title="Ir a https://www.unfantasmaenelsistema.com/"
            >
              <img
                src={LOGO_PATH}
                alt="Un Fantasma en el Sistema"
                className="h-14 w-auto object-contain shrink-0"
              />
            </a>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <a
                  href={AUTHOR_WEB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#0284C7] hover:underline inline-flex items-center gap-1"
                >
                  <span>unfantasmaenelsistema.com</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <span
                  aria-hidden="true"
                  className={darkMode ? 'text-slate-600' : 'text-slate-400'}
                >
                  ·
                </span>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                  Simulador y Evaluador Técnico de Microsoft Word
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5 text-balance">
                Generador de Casos Prácticos y Retos de Ofimática
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModalGlosarioAbierto(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                darkMode
                  ? 'border-[#1E293B] bg-[#1E293B]/60 text-slate-200 hover:bg-[#1E293B]'
                  : 'border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Chuleta y Atajos Word</span>
            </button>

            <button
              type="button"
              onClick={handleExportarJSON}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                darkMode
                  ? 'border-[#1E293B] bg-[#1E293B]/60 text-slate-200 hover:bg-[#1E293B]'
                  : 'border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Exporta este caso en formato JSON para enviarlo a tus alumnos"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Reto (.json)</span>
            </button>

            <label
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                darkMode
                  ? 'border-[#1E293B] bg-[#1E293B]/60 text-slate-200 hover:bg-[#1E293B]'
                  : 'border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Carga un reto .json compartido por el profesor"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportarJSON}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleDescargarSingleFileGitHubPages}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                darkMode
                  ? 'border-[#1E293B] bg-[#1E293B]/60 text-slate-200 hover:bg-[#1E293B]'
                  : 'border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Descarga toda la aplicación con tu logo incrustado en un único archivo index.html para GitHub Pages"
            >
              <Code2 className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Descargar SPA (1 HTML)</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarConfigurador((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                darkMode
                  ? 'border-[#1E293B] bg-[#1E293B]/60 text-slate-200 hover:bg-[#1E293B]'
                  : 'border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{mostrarConfigurador ? 'Ocultar Panel' : 'Configurar'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                darkMode
                  ? 'border-[#1E293B] bg-[#1E293B]/60 text-slate-200 hover:bg-[#1E293B]'
                  : 'border-[#E2E8F0] bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-label="Cambiar tema visual"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* 2. FORMULARIO DE GENERACIÓN DE PRÁCTICAS */}
        {mostrarConfigurador && (
          <section
            id="configurador"
            aria-label="Formulario de generación de prácticas"
            className={`rounded-xl border p-5 sm:p-6 transition-colors ${
              darkMode
                ? 'bg-[#1E293B]/45 border-[#1E293B]'
                : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <form onSubmit={handleGenerarPractica} className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Selector de Nivel */}
                <div className="lg:col-span-5 space-y-2.5">
                  <label className="block text-xs font-semibold tracking-tight">
                    01. Selector de Nivel de Competencia
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {NIVELES.map((item) => {
                      const activo = nivel === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSeleccionarNivel(item.id)}
                          className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                            activo
                              ? darkMode
                                ? 'border-[#0284C7] bg-[#0284C7]/15 text-white'
                                : 'border-[#0284C7] bg-[#0284C7]/8 text-[#0F172A]'
                              : darkMode
                              ? 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                              : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-semibold whitespace-nowrap">
                              {item.id}
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-[#0284C7]">
                              ~{item.tiempoSugerido}m
                            </span>
                          </div>
                          <p
                            className={`text-xs mt-1 leading-snug ${
                              darkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {item.competencias}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de Escenario / Tipo de Documento */}
                <div className="lg:col-span-3 space-y-2.5">
                  <label
                    htmlFor="select-escenario"
                    className="block text-xs font-semibold tracking-tight"
                  >
                    02. Escenario Documental
                  </label>
                  <select
                    id="select-escenario"
                    value={escenario}
                    onChange={(e) => setEscenario(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0284C7] ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {ESCENARIOS.map((esc) => (
                      <option key={esc} value={esc}>
                        {esc}
                      </option>
                    ))}
                  </select>

                  <div className="pt-1">
                    <label
                      htmlFor="input-tema"
                      className={`block text-xs mb-1 ${
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Sector empresarial o temática (opcional):
                    </label>
                    <input
                      id="input-tema"
                      type="text"
                      value={temaPersonalizado}
                      onChange={(e) => setTemaPersonalizado(e.target.value)}
                      placeholder="Ej. Clínica dental, Logística, Ciberseguridad..."
                      className={`w-full px-3.5 py-2 text-xs rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0284C7] ${
                        darkMode
                          ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Módulos Opcionales + Botón Generar Práctica */}
                <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="block text-xs font-semibold tracking-tight mb-2">
                      03. Módulos Técnicos a Evaluar
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MODULOS_DISPONIBLES.map((mod) => {
                        const seleccionado = modulos.includes(mod);
                        return (
                          <button
                            key={mod}
                            type="button"
                            onClick={() => toggleModulo(mod)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              seleccionado
                                ? 'bg-[#0284C7] text-white border-[#0284C7]'
                                : darkMode
                                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {seleccionado ? (
                              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            )}
                            <span>{mod}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>
                        {isGenerating
                          ? 'Generando práctica con Gemini 2.5 Flash...'
                          : 'Generar Práctica'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* Historial de prácticas disponibles */}
        <section
          id="biblioteca-casos"
          aria-label="Casos prácticos disponibles"
          className="flex items-center justify-between gap-4 overflow-x-auto py-1"
        >
          <div className="flex items-center gap-2 shrink-0">
            <BookOpen className="w-4 h-4 text-[#0284C7]" />
            <span className="text-xs font-semibold whitespace-nowrap">
              Casos disponibles ({historial.length}):
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {historial.map((item) => {
              const activo = item.id === practicaActual.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPracticaActualId(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[260px] truncate ${
                    activo
                      ? darkMode
                        ? 'bg-[#0284C7] text-white border-[#0284C7]'
                        : 'bg-[#0F172A] text-white border-[#0F172A]'
                      : darkMode
                      ? 'bg-[#1E293B]/60 border-slate-800 text-slate-300 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  title={`${item.nivel} · ${item.titulo_practica}`}
                >
                  {item.nivel}: {item.titulo_practica}
                </button>
              );
            })}
          </div>
        </section>

        {/* Indicador visual de carga (Skeleton) */}
        {isGenerating ? (
          <div
            aria-busy="true"
            aria-live="polite"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            <div
              className={`lg:col-span-5 rounded-xl border p-6 space-y-4 ${
                darkMode
                  ? 'bg-[#1E293B]/40 border-[#1E293B]'
                  : 'bg-white border-[#E2E8F0]'
              }`}
            >
              <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-7 w-4/5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-20 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-96 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>

            <div
              className={`lg:col-span-7 rounded-xl border p-6 space-y-4 ${
                darkMode
                  ? 'bg-[#1E293B]/40 border-[#1E293B]'
                  : 'bg-white border-[#E2E8F0]'
              }`}
            >
              <div className="h-6 w-64 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-12 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-16 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* 4. ÁREA DE TRABAJO DEL ALUMNO (DASHBOARD EN 2 COLUMNAS) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* COLUMNA A: MATERIAL DE TRABAJO + SIMULADOR MAQUETA A4 */}
            <section
              id="material-trabajo"
              aria-label="Material de trabajo"
              className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 flex flex-col justify-between transition-colors ${
                darkMode
                  ? 'bg-[#1E293B]/45 border-[#1E293B]'
                  : 'bg-white border-[#E2E8F0]'
              }`}
            >
              <div className="space-y-4">
                <div
                  className={`flex flex-wrap items-center gap-2 text-xs ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <span className="font-semibold text-[#0284C7]">
                    Nivel {practicaActual.nivel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{practicaActual.escenario}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    ~{practicaActual.tiempo_estimado_min || 30} min
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {estadisticasTexto.palabras} palabras
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold tracking-tight leading-snug text-balance">
                  {practicaActual.titulo_practica}
                </h2>

                <div
                  className={`p-4 rounded-lg border text-sm leading-relaxed ${
                    darkMode
                      ? 'bg-slate-900/70 border-slate-800 text-slate-300'
                      : 'bg-slate-50/90 border-slate-200/90 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 text-slate-900 dark:text-white">
                    Contexto del encargo profesional:
                  </p>
                  <p>{practicaActual.escenario_laboral}</p>
                </div>

                {/* Selector de pestaña en Columna A: Texto en Bruto vs Maqueta A4 */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div
                    role="tablist"
                    className={`inline-flex items-center p-1 rounded-lg border ${
                      darkMode
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-slate-100 border-slate-200/80'
                    }`}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={vistaColumnaA === 'bruto'}
                      onClick={() => setVistaColumnaA('bruto')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        vistaColumnaA === 'bruto'
                          ? darkMode
                            ? 'bg-[#0284C7] text-white'
                            : 'bg-white text-slate-900 shadow-xs'
                          : darkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Texto en Bruto</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={vistaColumnaA === 'maqueta'}
                      onClick={() => setVistaColumnaA('maqueta')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        vistaColumnaA === 'maqueta'
                          ? darkMode
                            ? 'bg-[#0284C7] text-white'
                            : 'bg-white text-slate-900 shadow-xs'
                          : darkMode
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layout className="w-3.5 h-3.5" />
                      <span>Maqueta Objetivo A4</span>
                    </button>
                  </div>

                  {vistaColumnaA === 'bruto' ? (
                    <button
                      type="button"
                      onClick={handleCopiarTexto}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        copiadoExito
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0284C7] hover:bg-[#0369A1] text-white'
                      }`}
                    >
                      {copiadoExito ? (
                        <>
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 shrink-0" />
                          <span>Copiar texto al portapapeles</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMostrarMarcasFormato((m) => !m)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                        mostrarMarcasFormato
                          ? 'bg-[#0284C7] text-white border-[#0284C7]'
                          : darkMode
                          ? 'border-slate-700 text-slate-300'
                          : 'border-slate-300 text-slate-700'
                      }`}
                      title="Simula el botón Mostrar todo (¶) de Word para ver saltos de párrafo, tabulaciones y secciones"
                    >
                      <Pilcrow className="w-3.5 h-3.5" />
                      <span>Mostrar todo (¶)</span>
                    </button>
                  )}
                </div>

                {/* Contenido de Columna A según pestaña seleccionada */}
                {vistaColumnaA === 'bruto' ? (
                  <div>
                    <textarea
                      id="raw-word-text"
                      readOnly
                      value={practicaActual.texto_sin_formato}
                      rows={18}
                      aria-label="Texto continuo sin formato para copiar en Microsoft Word"
                      className={`w-full p-4 rounded-lg border font-mono text-xs leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[#0284C7] ${
                        darkMode
                          ? 'bg-slate-950/90 border-slate-800 text-slate-200'
                          : 'bg-[#F8FAFC] border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                ) : (
                  /* SIMULADOR VISUAL DE HOJA A4 MAQUETADA */
                  <div className="p-3 rounded-lg bg-slate-200/70 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 max-h-[500px] overflow-y-auto">
                    {/* Regla Horizontal Simulada de Word */}
                    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-t px-4 py-1 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none">
                      <span>1 · · · 2 · · · 3</span>
                      <span className="text-[#0284C7] font-semibold">
                        Regla A4 (Márgenes y Paradas de Tabulación ⊥)
                      </span>
                      <span>13 · · · 14 · · · 15,5</span>
                    </div>

                    {/* Hoja A4 Blanca */}
                    <div className="bg-white text-slate-900 shadow-md border border-slate-300 p-6 sm:p-8 space-y-3.5 text-xs leading-relaxed">
                      {/* Encabezado simulado */}
                      <div className="border-b border-slate-200 pb-1.5 mb-3 flex justify-between text-[10px] text-slate-400 italic">
                        <span>{practicaActual.escenario} · Documento Corporativo</span>
                        <span>
                          {mostrarMarcasFormato && (
                            <span className="text-sky-500 font-mono not-italic mr-1">
                              [Encabezado] ¶
                            </span>
                          )}
                          Sección Principal
                        </span>
                      </div>

                      {bloquesSimuladosA4.map((b) => {
                        if (b.tipo === 'titulo_principal') {
                          return (
                            <div
                              key={b.id}
                              className="border-b-2 border-[#0284C7] pb-2 mb-3 bg-slate-50 p-2.5 rounded-xs"
                            >
                              {b.lineas.map((l, i) => (
                                <p
                                  key={i}
                                  className="font-bold text-sm text-[#0F172A] tracking-tight"
                                >
                                  {l}
                                  {mostrarMarcasFormato && (
                                    <span className="text-sky-500 font-mono ml-1">
                                      ¶
                                    </span>
                                  )}
                                </p>
                              ))}
                            </div>
                          );
                        }

                        if (b.tipo === 'tabla') {
                          return (
                            <div key={b.id} className="space-y-1.5 pt-1">
                              {mostrarMarcasFormato && (
                                <div className="text-[10px] font-mono text-sky-600 text-center border-y border-dashed border-sky-300 py-0.5">
                                  ······ Salto de página (Ctrl + Entrar) ······ ¶
                                </div>
                              )}
                              {b.tituloSeccion && (
                                <h4 className="font-bold text-xs text-[#0369A1] pt-1">
                                  {b.tituloSeccion}
                                  {mostrarMarcasFormato && (
                                    <span className="text-sky-500 font-mono ml-1">
                                      ¶
                                    </span>
                                  )}
                                </h4>
                              )}
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                                  <tbody>
                                    {b.filas.map((fila, rIdx) => (
                                      <tr
                                        key={rIdx}
                                        className={
                                          rIdx === 0
                                            ? 'bg-[#0F172A] text-white font-semibold'
                                            : rIdx % 2 === 0
                                            ? 'bg-slate-50'
                                            : 'bg-white'
                                        }
                                      >
                                        {fila.map((celda, cIdx) => (
                                          <td
                                            key={cIdx}
                                            className={`border border-slate-300 px-2 py-1 ${
                                              /\d/.test(celda) && rIdx > 0
                                                ? 'text-right font-mono tabular-nums'
                                                : 'text-left'
                                            }`}
                                          >
                                            {celda}
                                            {mostrarMarcasFormato && (
                                              <span className="text-sky-400 font-mono ml-0.5">
                                                ¤
                                              </span>
                                            )}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        }

                        if (b.tipo === 'tabulaciones') {
                          return (
                            <div key={b.id} className="space-y-1 pt-1">
                              {b.tituloSeccion && (
                                <h4 className="font-bold text-xs text-[#0369A1]">
                                  {b.tituloSeccion}
                                  {mostrarMarcasFormato && (
                                    <span className="text-sky-500 font-mono ml-1">
                                      ¶
                                    </span>
                                  )}
                                </h4>
                              )}
                              <div className="space-y-1 font-mono text-[11px] bg-slate-50/70 p-2 rounded border border-slate-200">
                                {b.filas.map((partes, rIdx) => (
                                  <div
                                    key={rIdx}
                                    className="flex items-baseline justify-between gap-1"
                                  >
                                    <span className="truncate">{partes[0]}</span>
                                    <span className="flex-1 border-b border-dotted border-slate-400 mx-1 text-center text-sky-500 text-[10px]">
                                      {mostrarMarcasFormato ? '→' : ''}
                                    </span>
                                    <span className="shrink-0">{partes[1]}</span>
                                    {partes[2] && (
                                      <>
                                        <span className="flex-1 border-b border-dotted border-slate-400 mx-1 text-center text-sky-500 text-[10px]">
                                          {mostrarMarcasFormato ? '→' : ''}
                                        </span>
                                        <span className="shrink-0 font-semibold">
                                          {partes[2]}
                                        </span>
                                      </>
                                    )}
                                    {mostrarMarcasFormato && (
                                      <span className="text-sky-500 ml-1">¶</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={b.id} className="space-y-1">
                            {b.epigrafe && (
                              <h4 className="font-bold text-xs text-[#0369A1] pt-1">
                                {b.epigrafe}
                                {mostrarMarcasFormato && (
                                  <span className="text-sky-500 font-mono ml-1">
                                    ¶
                                  </span>
                                )}
                              </h4>
                            )}
                            {b.enDosColumnas && mostrarMarcasFormato && (
                              <div className="text-[10px] font-mono text-sky-600 text-center border-y border-dashed border-sky-300 py-0.5">
                                === Salto de sección (Continua · 2 Columnas) ===
                              </div>
                            )}
                            <p
                              className={`text-justify indent-5 text-slate-800 ${
                                b.enDosColumnas
                                  ? 'columns-2 gap-4 border-x border-slate-100 px-1'
                                  : ''
                              }`}
                            >
                              {b.cuerpo}
                              {mostrarMarcasFormato && (
                                <span className="text-sky-500 font-mono ml-1">
                                  ¶
                                </span>
                              )}
                            </p>
                          </div>
                        );
                      })}

                      {/* Pie de página simulado */}
                      <div className="border-t border-slate-200 pt-2 mt-4 flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{practicaActual.titulo_practica.slice(0, 42)}...</span>
                        <span>Página 1 de 2</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checklist de Calidad Pre-Entrega (4 Reglas de Oro de Word) */}
                <div
                  className={`p-3.5 rounded-lg border space-y-2 ${
                    darkMode
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-slate-50/80 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      Autocontrol de Calidad Técnica (Antes de entregar el .docx)
                    </span>
                    <span className="text-[11px] font-mono text-[#0284C7]">
                      {Object.values(reglasPreentrega).filter(Boolean).length}/4
                      verificadas
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REGLAS_ORO_PREENTREGA.map((regla) => {
                      const marcada = !!reglasPreentrega[regla.id];
                      return (
                        <label
                          key={regla.id}
                          className={`flex items-start gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                            marcada
                              ? darkMode
                                ? 'bg-emerald-950/25 border-emerald-800/60 text-emerald-200'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : darkMode
                              ? 'border-slate-800 text-slate-300'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcada}
                            onChange={() =>
                              setReglasPreentrega((p) => ({
                                ...p,
                                [regla.id]: !p[regla.id],
                              }))
                            }
                            className="mt-0.5 accent-[#0284C7]"
                          />
                          <div>
                            <div className="font-semibold">{regla.titulo}</div>
                            <div className="text-[11px] opacity-80 leading-snug">
                              {regla.detalle}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                className={`mt-4 pt-3 border-t text-xs flex flex-wrap items-center justify-between gap-2 ${
                  darkMode
                    ? 'border-slate-800 text-slate-400'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                <span className="font-mono tabular-nums">
                  {estadisticasTexto.palabras} palabras ·{' '}
                  {estadisticasTexto.parrafos} bloques ·{' '}
                  {estadisticasTexto.caracteres} caract. ({estadisticasTexto.sinEspacios}{' '}
                  sin esp.)
                </span>
                <button
                  type="button"
                  onClick={() => setModalInformeAbierto(true)}
                  className="inline-flex items-center gap-1 font-semibold text-[#0284C7] hover:underline cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Generar Informe de Entrega</span>
                </button>
              </div>
            </section>

            {/* COLUMNA B: HOJA DE INSTRUCCIONES, CRONÓMETRO MOS Y RÚBRICA */}
            <section
              id="hoja-instrucciones"
              aria-label="Hoja de instrucciones y rúbrica"
              className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 flex flex-col justify-between transition-colors ${
                darkMode
                  ? 'bg-[#1E293B]/45 border-[#1E293B]'
                  : 'bg-white border-[#E2E8F0]'
              }`}
            >
              <div className="space-y-5">
                {/* Encabezado, Cronómetro y Toggle: Modo Práctica Guiada vs Modo Examen */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div
                      className={`flex items-center gap-2 text-xs ${
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      <span>Columna B · Hoja de Instrucciones y Rúbrica</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {practicaActual.requisitos_tecnicos.length} requisitos
                      </span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight mt-0.5">
                      Requisitos Técnicos Evaluables
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Cronómetro de Práctica / Examen */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono tabular-nums ${
                        darkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-200'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <Timer className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span className="font-semibold">
                        {formatearTiempo(segundosCronometro)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCronometroActivo((a) => !a)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                        title={
                          cronometroActivo
                            ? 'Pausar cronómetro'
                            : 'Iniciar cronómetro'
                        }
                      >
                        {cronometroActivo ? (
                          <Pause className="w-3 h-3 text-amber-500" />
                        ) : (
                          <Play className="w-3 h-3 text-emerald-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCronometroActivo(false);
                          setSegundosCronometro(0);
                        }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                        title="Reiniciar cronómetro"
                      >
                        <RotateCcw className="w-3 h-3 opacity-70" />
                      </button>
                    </div>

                    {/* Interruptor/Toggle: Modo Práctica Guiada vs Modo Examen */}
                    <div
                      role="group"
                      aria-label="Selector de modo de práctica"
                      className={`inline-flex items-center p-1 rounded-lg border ${
                        darkMode
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-slate-100 border-slate-200/80'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setModoExamen(false)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          !modoExamen
                            ? darkMode
                              ? 'bg-[#0284C7] text-white'
                              : 'bg-white text-slate-900 shadow-xs'
                            : darkMode
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Modo Práctica Guiada</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setModoExamen(true);
                          if (!cronometroActivo && segundosCronometro === 0) {
                            setCronometroActivo(true);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          modoExamen
                            ? darkMode
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-900 text-white shadow-xs'
                            : darkMode
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Modo Examen</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Barra de Progreso de Puntos Acumulados */}
                <div
                  className={`p-4 rounded-lg border space-y-2.5 ${
                    darkMode
                      ? 'bg-slate-900/70 border-slate-800'
                      : 'bg-slate-50/90 border-slate-200/90'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold">Calificación en curso:</span>
                      <span
                        className={`font-medium ${estadoCalificacion.claseTexto}`}
                      >
                        {estadoCalificacion.etiqueta}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 font-mono tabular-nums">
                      <span className="text-lg font-bold text-[#0284C7]">
                        {puntosAcumulados}
                      </span>
                      <span
                        className={`text-xs ${
                          darkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        / {puntosTotales} puntos ({porcentajeProgreso}%)
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-full h-2.5 rounded-full overflow-hidden ${
                      darkMode ? 'bg-slate-800' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`h-full transition-all duration-150 ${estadoCalificacion.claseBarra}`}
                      style={{ width: `${porcentajeProgreso}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
                    <span
                      className={`font-mono tabular-nums ${
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {completadosCount} de{' '}
                      {practicaActual.requisitos_tecnicos.length} requisitos
                      completados
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={marcarTodosActual}
                        className="text-xs font-medium text-[#0284C7] hover:underline whitespace-nowrap cursor-pointer"
                      >
                        Marcar todos
                      </button>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <button
                        type="button"
                        onClick={reiniciarProgresoActual}
                        className={`inline-flex items-center gap-1 text-xs font-medium hover:underline whitespace-nowrap cursor-pointer ${
                          darkMode ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reiniciar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filtros de categoría y búsqueda */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {categoriasDisponibles.map((cat) => {
                      const activa = categoriaFiltro === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoriaFiltro(cat)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            activa
                              ? 'bg-[#0284C7] text-white'
                              : darkMode
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={busquedaRequisito}
                      onChange={(e) => setBusquedaRequisito(e.target.value)}
                      placeholder="Buscar requisito..."
                      aria-label="Buscar requisito"
                      className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0284C7] ${
                        darkMode
                          ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Aviso cuando Modo Examen está activo */}
                {modoExamen && (
                  <div
                    className={`px-3.5 py-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                      darkMode
                        ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <span>
                      <strong>Modo Examen activo:</strong> Se han ocultado las rutas
                      de la Cinta de Opciones, los atajos y las pistas de errores
                      frecuentes.
                    </span>
                    <button
                      type="button"
                      onClick={() => setModoExamen(false)}
                      className="font-semibold underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Volver a Práctica Guiada
                    </button>
                  </div>
                )}

                {/* Tabla de Requisitos Técnicos con Atajos y Prevención de Errores */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`border-b text-xs font-semibold ${
                          darkMode
                            ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <th className="py-3 pl-4 pr-2 w-10">Hecho</th>
                        <th className="py-3 px-3">
                          Categoría y Acción Requerida
                        </th>
                        {!modoExamen && (
                          <th className="py-3 px-3 w-64">
                            Ruta Cinta de Opciones y Atajo
                          </th>
                        )}
                        <th className="py-3 pl-2 pr-4 text-right w-16 font-mono tabular-nums">
                          Puntos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {requisitosFiltrados.map(({ req, originalIndex }) => {
                        const completado =
                          !!estadoCompletadosActual[originalIndex];
                        const numOrden = String(originalIndex + 1).padStart(
                          2,
                          '0'
                        );
                        return (
                          <tr
                            key={originalIndex}
                            onClick={() =>
                              toggleRequisitoCompletado(originalIndex)
                            }
                            className={`transition-colors cursor-pointer ${
                              completado
                                ? darkMode
                                  ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                                  : 'bg-emerald-50/50 hover:bg-emerald-50/80'
                                : darkMode
                                ? 'hover:bg-slate-800/50'
                                : 'hover:bg-slate-50/90'
                            }`}
                          >
                            <td className="py-3.5 pl-4 pr-2 align-top">
                              <input
                                type="checkbox"
                                checked={completado}
                                onChange={() =>
                                  toggleRequisitoCompletado(originalIndex)
                                }
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Marcar requisito ${numOrden}`}
                                className="w-4 h-4 mt-0.5 rounded accent-[#0284C7] cursor-pointer"
                              />
                            </td>

                            <td className="py-3.5 px-3 align-top space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="font-mono tabular-nums font-semibold text-[#0284C7]">
                                  {numOrden}.
                                </span>
                                <span className="font-semibold">
                                  {req.categoria}
                                </span>
                              </div>
                              <p
                                className={`text-xs sm:text-sm leading-relaxed ${
                                  completado
                                    ? 'line-through opacity-65'
                                    : darkMode
                                    ? 'text-slate-200'
                                    : 'text-slate-800'
                                }`}
                              >
                                {req.accion_requerida}
                              </p>

                              {/* Consejo pedagógico / Error frecuente a evitar (visible en Modo Guiado) */}
                              {!modoExamen && req.error_frecuente && (
                                <div
                                  className={`flex items-start gap-1.5 text-[11px] pt-0.5 ${
                                    darkMode
                                      ? 'text-amber-300/90'
                                      : 'text-amber-800'
                                  }`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>
                                    <strong>Evita este error:</strong>{' '}
                                    {req.error_frecuente}
                                  </span>
                                </div>
                              )}
                            </td>

                            {!modoExamen && (
                              <td className="py-3.5 px-3 align-top space-y-1.5">
                                <code
                                  className={`block text-[11px] font-mono leading-snug p-2 rounded border ${
                                    darkMode
                                      ? 'bg-slate-950/80 border-slate-800 text-sky-300'
                                      : 'bg-slate-50 border-slate-200/80 text-[#0369A1]'
                                  }`}
                                >
                                  {req.ruta_cinta_opciones}
                                </code>
                                {req.atajo_teclado && (
                                  <div
                                    className={`inline-flex items-center gap-1 text-[11px] font-mono ${
                                      darkMode
                                        ? 'text-slate-400'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    <Keyboard className="w-3 h-3 text-[#0284C7]" />
                                    <span>Atajo: {req.atajo_teclado}</span>
                                  </div>
                                )}
                              </td>
                            )}

                            <td className="py-3.5 pl-2 pr-4 align-top text-right font-mono tabular-nums font-semibold text-xs sm:text-sm">
                              <span
                                className={
                                  completado
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : ''
                                }
                              >
                                +{req.puntos}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Criterio de Evaluación Final y Botón de Informe */}
              <div
                className={`mt-5 pt-4 border-t text-xs leading-relaxed flex flex-wrap items-center justify-between gap-4 ${
                  darkMode
                    ? 'border-slate-800 text-slate-300'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="max-w-xl">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Criterio de evaluación final:{' '}
                  </span>
                  <span>{practicaActual.criterio_evaluacion_final}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setModalInformeAbierto(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-lg shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Emitir Hoja de Calificación</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer con logo sin distorsionar y enlace a https://www.unfantasmaenelsistema.com/ */}
      <footer
        className={`mt-12 border-t py-6 px-6 text-xs ${
          darkMode
            ? 'border-[#1E293B] text-slate-400'
            : 'border-[#E2E8F0] text-slate-500'
        }`}
      >
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <a
            href={AUTHOR_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <img
              src={LOGO_PATH}
              alt="Logo Un Fantasma en el Sistema"
              className="h-9 w-auto object-contain shrink-0"
            />
            <span>
              <strong className="text-slate-900 dark:text-white">
                Un Fantasma en el Sistema
              </strong>{' '}
              · Laboratorio Interactivo de Ofimática y Procesadores de Texto
            </span>
          </a>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={AUTHOR_WEB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#0284C7] hover:underline"
            >
              <span>https://www.unfantasmaenelsistema.com/</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleDescargarSingleFileGitHubPages}
              className="inline-flex items-center gap-1 font-semibold hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar index.html único para GitHub Pages</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
