// Contenido docente fijo: niveles, atajos, reglas de oro y los 3 casos oficiales.
import type { CasoPractico, NivelPractica } from './lib/caso.ts';

export const NIVELES: {
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

export const ATAJOS_REFERENCIA = [
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

export const REGLAS_ORO_PREENTREGA = [
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

export const CASOS_PREDEFINIDOS: CasoPractico[] = [
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
