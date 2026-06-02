/* ── CAMPAÑA: locaciones ── */

const DEFAULT_CAMPAIGN_LOCATIONS = [
  // ── REGIÓN 1 — COSTA Y PUERTO ──
  { id:'loc-mina-zafira', name:'Mina Zafira',
    description:'Ciudad costera portuaria — ciudad inicial de la campaña. "Mina" (puerto, raíz árabe) + "Zafira" (sufijo élfico mediterráneo). Atmósfera viva, caótica, mercantil. Abrumador pero emocionante. Mercado activo, marineros, telas exóticas, olor a especias, músicos, armeros. Lugares: Taberna de Reynera, Taller de Smith, Local de Farandon, Puerto.',
    state:'Visitada en Sesión 1. Aliados: Reynera, Tyron, Smith, Farandon. Geografía: norte → Bosque Eldenmyr · este → mar abierto · oeste → interior.' },

  // ── REGIÓN 2 — BOSQUE ELDENMYR ──
  { id:'loc-bosque-eldenmyr', name:'Bosque Eldenmyr',
    description:'Gran bosque antiguo — zona de transición y misterio. Nombre popular: "El Bosque Sin Fin". Solo Sunbound, scholars, guerreros experimentados y Velo Elmyra conocen el nombre real. Vivo y reactivo a decisiones morales. Hongos luminosos, raíces enormes, niebla, susurros en lenguas desconocidas, espíritus animales observando. El bosque tiene voluntad propia — los caminos se pierden si no quiere que los encuentren.',
    state:'Recorrido parcialmente en Sesión 1 (corredor Mina Zafira → Aether Grove). El grupo enterró al lobo aquí. Sur: Mina Zafira · Este/Noreste: Jabal Thalos · Norte: Valle Aethon · Oeste lejano: Lago del Oeste.' },
  { id:'loc-aether-grove', name:'Aether Grove',
    description:'Santuario del Velo Elmyra — base oculta. Construido en lo alto entre árboles ancestrales. Puentes elevados y plataformas que se integran naturalmente. Arquitectura que refleja la filosofía del Velo Elmyra: oculto, elegante, conectado con el aire y el cielo. Pozo de agua donde Isis medita. Plataformas donde Zael duerme.',
    state:'Próximo destino del grupo (Sesión 2). NPCs presentes: Zyren, Nira, Zael, Isis, Sakura (visitante). Eventos clave: subida a Nv 3, Boyd aprende sanación con Nira, primera mención de los Owling por Isis, primera mención de los Sunbound por Sakura, misión de Zyren hacia Solmira.' },
  { id:'loc-lago-oeste', name:'Lago del Oeste (nombre pendiente)',
    description:'Lago enorme con cascada — zona de jungla densa al extremo oeste del Bosque Eldenmyr, muy lejos del corredor principal. Agua enorme rodeada de vegetación densa. La cascada crea una neblina permanente. Zona casi inexplorada incluso para el Velo Elmyra.',
    state:'⚠ A desarrollar. Nombre pendiente.' },

  // ── REGIÓN 3 — VALLE Y PRIMERA CIUDAD ──
  { id:'loc-valle-aethon', name:'Valle Aethon',
    description:'Valle amplio — zona de transición entre bosque y civilización. "Aethon" = griego para "el que brilla". Tierra abierta, verde, luminosa después de la oscuridad del bosque. El grupo lo ve por primera vez al salir del Eldenmyr — sensación de respiro visual. Luz del sol sin filtro de árboles por primera vez en días. De lejos pueden ver Solmira en el horizonte.',
    state:'No visitado aún. Camino entre Bosque Eldenmyr y Solmira. Encuentro 5 (bandidos) ocurre aquí.' },
  { id:'loc-solmira', name:'Solmira',
    description:'Ciudad mediana — primera ciudad real después del bosque. Atmósfera más académica y ordenada que Mina Zafira. Luz cálida, arquitectura planificada, menos caos pero más profundidad institucional.\n\nLugares establecidos:\n• Hall de los Sunbound Druids — casa antigua mezclada con templo, mucho verde, plantas, pociones, luz cálida. Base de Sura y Barek.\n• Sede de la Gran Escuela de Magos (nombre pendiente) — primer contacto del grupo con el mundo académico arcano. Tiene sede también en la Capital.\n• Mercado de Solmira — ordenado y especializado (verdulería, pescadería, carnicería, florería conectada con Sakura).\n• Quarter de Guardias — orden pública organizada. Tienen conocimiento parcial de la amenaza Fell.\n• Alcaldía — sede de Caeron.',
    state:'No visitada aún. NPCs: Sura, Barek (Hall), Aela (informante), Caeron (Alcaldía), Pip y Mila (calles). Encuentro 4 (ataque a Solmira) ocurre aquí.' },

  // ── REGIÓN 4 — CADENA DE MONTAÑAS ──
  { id:'loc-jabal-thalos', name:'Jabal Thalos',
    description:'Gran cadena montañosa — zona de aventura avanzada. "Jabal" = montaña (árabe) + "Thalos" = sufijo griego inventado. Al este y noreste del Bosque Eldenmyr. Peligroso, frío en las alturas, visualmente imponente. Ruinas, tesoros perdidos, civilizaciones olvidadas, monstruos antiguos. Separa el mundo conocido de lo que hay más allá.',
    state:'A desarrollar — quest planeada para arcos medios. Zael acompaña al grupo aquí — primera transformación en tigre blanco en momento crítico. Idris mencionado por Zael en estas montañas.' },

  // ── REGIÓN 5 — ARCO FINAL ──
  { id:'loc-norte-congelado', name:'Norte Congelado (arco final)',
    description:'Tierras heladas — zona del arco final de la campaña. Ciudadelas en ruinas enterradas en nieve, auroras en el cielo nocturno, templos antiguos congelados, criaturas ocultas bajo el hielo, silencio y miedo. Conectada con la verdad oculta del mundo y con la fuente original del Fell Lord.',
    state:'⚠ Arco final. A desarrollar.' },

  // ── CIUDADES FUTURAS (placeholders) ──
  { id:'loc-ciudad-mediana', name:'Ciudad Mediana (nombre pendiente)',
    description:'Ciudad de tamaño normal, más grande que Solmira. Primera ciudad donde el grupo puede tener encuentros más complejos socialmente. Estructura entre el valle y la Capital.',
    state:'⚠ Nombre y detalles pendientes.' },
  { id:'loc-pueblo-derrota', name:'Pueblo de la Derrota (nombre pendiente)',
    description:'Pueblo donde los jugadores son derrotados y deben huir. Este pueblo será arrasado. Momento de alto impacto emocional en la campaña.',
    state:'⚠ Confirmado narrativamente. El DM debe construir vínculos del grupo con este lugar ANTES del ataque para que el momento de la derrota tenga peso emocional.' },
  { id:'loc-la-capital', name:'La Capital (nombre pendiente)',
    description:'Ciudad grande con rey y ejército. Conocimiento establecido de la presencia del Fell Lord. Sede principal de los Paladines (facción a nombrar). Ramis Al-Nasir vive aquí — familia noble Al-Nasir. Barak y Sova están aquí. Aela tiene amigos de infancia paladines aquí. Gran Escuela de Magos tiene su sede principal aquí.',
    state:'⚠ Nombre pendiente. Centro político y militar del mundo conocido.' },
  { id:'loc-pueblo-nordico', name:'Pueblo Nórdico (nombre pendiente)',
    description:'Pueblo grande y duro, estilo nórdico guerrero. Cultura cruda, directa, sin las instituciones de la Capital. Guerreros que ayudarán al grupo en el arco final.',
    state:'⚠ Antes del Norte Congelado. Nombre pendiente.' }
];
;
