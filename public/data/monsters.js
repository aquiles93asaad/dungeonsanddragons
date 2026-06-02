/* ── PRESET MONSTERS: encuentros ── */

const PRESET_MONSTERS = [
  {
    id:'lobo-corrupto',
    name:'Lobo Corrupto',
    type:'Bestia',
    size:'Grande',
    cr:'2',
    ac:13,
    hpMax:42,
    speed:'40 ft',
    atk:'+5',
    str:16,dex:14,con:15,int:4,wis:12,cha:7,
    desc:'El pelaje está parcialmente podrido. Venas verdes brillan bajo la piel. La mandíbula parece deformada y los ojos emiten una luz Fell antinatural. Cada respiración suena como un gruñido roto.',
    attacks:[
      {name:'Mordida Corrupta',bonus:'+5',dmg:'1d10+3 perforante',note:'El lobo busca intimidar y derribar, no ejecutar inmediatamente.'}
    ],
    abilities:'Aura Fell Inestable: cuando baja de 30 HP y nuevamente al bajar de 15 HP, todos los jugadores cercanos tiran CON CD 11 o reciben 1d4 daño necrótico.',
    phases:[
      {name:'Fase 1 — Terror',desc:'Ramas rompiéndose, respiración pesada, ojos verdes entre la oscuridad.'},
      {name:'Fase 2 — Primer impacto',desc:'El lobo ataca brutalmente pero sin intención inmediata de matar.'},
      {name:'Fase 3 — Momento heroico',desc:'Los jugadores comienzan a coordinarse y usar sus habilidades.'},
      {name:'Fase 4 — Entrada de Zyren',desc:'A ~12 HP, el bosque queda silencioso. Dos ojos dorados aparecen entre los árboles. Zyren elimina al lobo con absoluta facilidad.'}
    ],
    rewards:'XP completa por encuentro narrativo. Recordar que Zyren intervino — los jugadores no terminaron el combate solos.',
    loot:[
      { name:'Colmillo corrupto', minRoll:0, qty:'1', note:'GARANTIZADO. Ingrediente clave para la Daga del Colmillo Corrompido de Esdas.' },
      { name:'Fragmentos de pelaje Fell', minRoll:0, qty:'1d4', note:'GARANTIZADO. Zyren los lleva al Grove para crear algo útil.' },
      { name:'Espíritu del lobo liberado', minRoll:0, qty:'1', note:'NARRATIVO — Boyd lo percibe, no es loot físico sino experiencia espiritual.' }
    ],
    notes:'Encuentro 1. Diseñado para nivel 1. Objetivo narrativo, no de muerte. Zyren interviene a ~12 HP restantes. El ataque de Mordida Corrupta está ajustado para nivel 1 — considerá reducir el daño si el grupo va muy justo.'
  },
  {
    id:'arana-madre',
    name:'Araña Madre Corrupta',
    type:'Monstruosidad',
    size:'Grande',
    cr:'3',
    ac:14,
    hpMax:52,
    speed:'30 ft, trepar 30 ft',
    atk:'+5',
    str:16,dex:15,con:16,int:5,wis:12,cha:6,
    desc:'Patas enormes cubiertas por venas verdes brillantes. Fragmentos de corrupción Fell recorren su abdomen, que parece pulsar como si respirara. Sus ojos reflejan una inteligencia perturbadora y antinatural.',
    attacks:[
      {name:'Mordida Corrupta',bonus:'+5',dmg:'1d8+3 perforante + 1d4 veneno',note:'Ajustado de 1d10 original para nivel 1-2. El veneno es el peligro real.'},
      {name:'Telaraña Fell',bonus:'—',dmg:'—',note:'Recarga 5-6. DEX CD 12 o quedan restringidos (velocidad 0, ataques con desventaja).'}
    ],
    abilities:'Crías corruptas (4-6): CA 12, HP 7, Atk +4, 1d4+2. Las crías rodean jugadores vulnerables y generan presión constante. Su objetivo es distraer y dividir.\nTerreno: telarañas entre árboles, suelo húmedo y resbaladizo, visibilidad reducida.',
    phases:[
      {name:'Fase 1 — Descubrimiento',desc:'Los jugadores encuentran restos envueltos en telarañas.'},
      {name:'Fase 2 — Emboscada',desc:'Las crías atacan desde múltiples ángulos.'},
      {name:'Fase 3 — Entrada de la Madre',desc:'La Araña Madre desciende lentamente desde los árboles.'},
      {name:'Fase 4 — Supervivencia',desc:'El grupo debe mantenerse unido mientras controla el caos.'},
      {name:'Llegada de Nira',desc:'Tras la derrota, el bosque queda en silencio. Una pantera sombría emerge lentamente.'}
    ],
    rewards:'XP completa por victoria. Recompensas materiales según tirada de loot abajo.',
    loot:[
      { name:'Corazón de araña', minRoll:0, qty:'1', note:'GARANTIZADO. Nira lo recoge — puede usarse para extraer veneno, crear poción o recurso alquímico.' },
      { name:'Colmillos venenosos', minRoll:0, qty:'1d4', note:'GARANTIZADO. Crafting futuro — ingrediente para pociones de veneno.' },
      { name:'Seda corrupta', minRoll:12, qty:'2d6 pies', note:'Material de crafting — resistente y ligera.' },
      { name:'Veneno en colmillo (1 dosis)', minRoll:15, qty:'1 dosis', note:'Raro — dosis única de veneno de araña Fell.' }
    ],
    notes:'Encuentro 2. HP reducido de 68 a 52 respecto al original — más apropiado para nivel 2. Con 1d10+3+veneno en el original podía one-shot a Esdas. La versión actual sigue siendo peligrosa. Nira aparece después de la pelea.'
  },
  {
    id:'guerrero-corrupto',
    name:'Guerrero Corrupto',
    type:'Humanoide',
    size:'Mediano',
    cr:'1',
    ac:15,
    hpMax:36,
    speed:'30 ft',
    atk:'+5',
    str:16,dex:12,con:14,int:8,wis:10,cha:8,
    desc:'Ex-soldado o mercenario absorbido por el Fell Lord. Sus ojos tienen un brillo verde apagado. Se mueve con disciplina militar pero con una frialdad inquietante. Porta armadura dañada con marcas del Fell grabadas.',
    attacks:[
      {name:'Golpe de espada',bonus:'+5',dmg:'1d8+3 cortante',note:'Ataque directo. Prioriza el frente.'}
    ],
    abilities:'Formación Fell: si hay otro Guerrero Corrupto adyacente, ambos tienen ventaja en ataques contra el mismo objetivo.\nTáctica: avanzan agresivamente para bloquear el frente y proteger a los arqueros y el pícaro.',
    phases:[
      {name:'Rol táctico',desc:'Crean línea frontal. Nunca retroceden voluntariamente. Intentan empujar al grupo hacia los arqueros.'}
    ],
    rewards:'XP por enemigo. Loot abajo (por cada guerrero derrotado).',
    loot:[
      { name:'Botas pesadas reforzadas', minRoll:0, qty:'1 par', note:'GARANTIZADO. Una para Rac, una para Tyrell — upgrade narrativo de equipo frontline.' },
      { name:'Guantes pesados reforzados', minRoll:0, qty:'1 par', note:'GARANTIZADO. Ídem — para los dos frontline.' },
      { name:'Espada de una mano dañada', minRoll:12, qty:'1', note:'Usable con reparación menor.' },
      { name:'Armadura pesada dañada (piezas)', minRoll:14, qty:'piezas sueltas', note:'No set completo.' },
      { name:'Símbolo del Fell Lord', minRoll:10, qty:'1', note:'Confirmación de afiliación organizada al Fell Lord.' }
    ],
    notes:'Encuentro 3. Se usa x2. Diseñado para nivel 2. Trabajan en equipo con el pícaro y los arqueros. NO actúan como monstruos independientes.'
  },
  {
    id:'picaro-fell',
    name:'Pícaro Fell',
    type:'Humanoide',
    size:'Mediano',
    cr:'1',
    ac:14,
    hpMax:28,
    speed:'35 ft',
    atk:'+6',
    str:11,dex:16,con:12,int:12,wis:11,cha:10,
    desc:'Delgado, silencioso, siempre en movimiento. Usa la corrupción Fell para mimetizarse con las sombras del bosque. Su sonrisa no llega a los ojos — que brillan con un tenue verde.',
    attacks:[
      {name:'Daga Fell',bonus:'+6',dmg:'1d6+4 perforante',note:'Si ataca a un objetivo con un aliado adyacente, agrega 2d6 Sneak Attack.'}
    ],
    abilities:'Sombra Fell: como acción bonus puede Disengage o Hide.\nFlanco constante: nunca ataca de frente. Busca jugadores heridos o aislados. Usa árboles, sombras y movimiento constante.',
    phases:[
      {name:'Rol táctico',desc:'Espera que los guerreros generen caos, luego flanquea. Objetivo prioritario: el personaje con menos HP o el caster aislado.'}
    ],
    rewards:'XP por enemigo. Loot abajo.',
    loot:[
      { name:'Daga Fell', minRoll:0, qty:'1', note:'GARANTIZADO. Más grande que los cuchillos de Boyd y Esdas. Base para la Daga del Colmillo Corrompido de Esdas si decide craftearla.' },
      { name:'Armadura de cuero ligera', minRoll:0, qty:'1', note:'GARANTIZADO. Útil para Boyd o Esdas — mejor que su malla liviana actual.' },
      { name:'Capucha y capa oscura', minRoll:10, qty:'1', note:'Útil para sigilo — Relyo podría quererla.' },
      { name:'Veneno en frasco pequeño', minRoll:15, qty:'1 dosis', note:'Una dosis de veneno de pícaro.' },
      { name:'Notas cifradas', minRoll:12, qty:'1', note:'Primer indicio de inteligencia organizada del Fell Lord.' }
    ],
    notes:'Encuentro 3. El más peligroso del grupo si lo dejan libre. Si los jugadores lo ignoran, puede bajar a Esdas o Boyd en 2 turnos. Zyren o Nira pueden interceptarlo si la situación se vuelve crítica.'
  },
  {
    id:'arquero-corrupto',
    name:'Arquero Corrupto',
    type:'Humanoide',
    size:'Mediano',
    cr:'1/2',
    ac:13,
    hpMax:20,
    speed:'30 ft',
    atk:'+4',
    str:10,dex:15,con:12,int:8,wis:10,cha:7,
    desc:'Arquero de posición. Busca altura y cobertura. Sus flechas tienen una punta ligeramente verdosa — impregnadas de una dosis menor de corrupción Fell.',
    attacks:[
      {name:'Arco largo corrupto',bonus:'+4',dmg:'1d8+2 perforante',note:'Rango 150/600 ft. Prefiere objetivos sin cobertura.'}
    ],
    abilities:'Posición elevada: al inicio del combate ocupa posición alta (árbol caído, rama). Si está en altura y sin movimiento ese turno, +1 al daño.\nObjetivo prioritario: casters y personajes sin armadura pesada.',
    phases:[
      {name:'Rol táctico',desc:'Disparan primero en la emboscada. Presionan casters desde lejos. Son el objetivo más fácil de eliminar pero el más peligroso si se los ignora.'}
    ],
    rewards:'XP por enemigo. Loot abajo (por arquero derrotado).',
    loot:[
      { name:'Armadura de tela reforzada', minRoll:0, qty:'1', note:'GARANTIZADO. Útil para Esdas o Boyd.' },
      { name:'Flechas corruptas', minRoll:8, qty:'1d6', note:'Comunes, fáciles de recuperar.' },
      { name:'Arco largo dañado', minRoll:12, qty:'1', note:'Usable con reparación menor.' },
      { name:'Guantes de arquero', minRoll:10, qty:'1', note:'Mejora menor para tiradas a distancia.' },
      { name:'Símbolo del Fell Lord', minRoll:10, qty:'1', note:'Confirmación de afiliación organizada.' }
    ],
    notes:'Encuentro 3. Se usa x2. Frágiles pero molestos. Si el grupo los ignora para concentrarse en los guerreros, pueden hacer mucho daño a Esdas y Boyd.'
  },
  {
    id:'comandante-fell',
    name:'Comandante Fell',
    type:'Humanoide',
    size:'Grande',
    cr:'5',
    ac:17,
    hpMax:85,
    speed:'30 ft',
    atk:'+7',
    str:20,dex:10,con:18,int:10,wis:8,cha:6,
    desc:'Ex-soldado de la Capital completamente transformado por el Fell. Más grande que un humano normal, venas verdes visibles bajo la armadura. Empuña una espada de casi dos metros con facilidad. Casi sin alma adentro.',
    attacks:[
      {name:'Espada gigante corrupta',bonus:'+7',dmg:'2d10+5 cortante',note:'Arma de dos manos. Reach 10 ft por tamaño. Daño masivo.'}
    ],
    abilities:'Presencia Fell: las criaturas no-Fell que lo vean por primera vez tiran WIS save DC 13 o frightened 1 turno.\nResistencia: 1/2 daño físico no-mágico (armadura Fell-reforzada).',
    phases:[
      {name:'Entrada cinematográfica',desc:'Aparece desde la oscuridad. Su presencia silencia el bosque. Los jugadores LO VEN — Zyren los aleja.'},
      {name:'Zyren vs Comandante',desc:'Pelea fuera de cámara mientras el grupo enfrenta el resto. Sonidos de impacto entre los árboles.'},
      {name:'Cuerpo en el suelo',desc:'Cuando llegan los jugadores, Zyren ya lo derrotó. Examen forense del cuerpo revela la insignia.'}
    ],
    rewards:'XP completa al ver el cuerpo derrotado por Zyren. Loot abajo, principalmente narrativo.',
    loot:[
      { name:'Espada gigante corrupta (~2 metros)', minRoll:0, qty:'1', note:'GARANTIZADO. Rac la quiere inmediatamente. Dañada. Con STR actual la puede levantar pero Speed reducida a 20ft. Smith podría repararla y adaptarla.' },
      { name:'Insignia del Fell Lord (collar)', minRoll:0, qty:'1', note:'GARANTIZADO. Círculo de hierro verde oscuro con líneas interlazadas y mini círculos en cada punta. Zyren la copia en scroll y se lo entrega a Esdas. ITEM NARRATIVO CLAVE.' },
      { name:'Fragmentos de armadura pesada corrupta', minRoll:12, qty:'piezas sueltas', note:'Piezas utilizables con marca Fell visible.' },
      { name:'Monedas con símbolo desconocido', minRoll:10, qty:'1d6', note:'Primera pista de que el Fell Lord tiene economía propia.' }
    ],
    notes:'Encuentro 3 — Boss. NO lo combate el grupo. Zyren lo enfrenta solo. El grupo lo ve después de derrotado. Diálogo clave de Zyren examinando el cuerpo: "Era un soldado de la Capital — su armadura lo delata" + "Eso les podría haber pasado" (mira a Rac y Esdas).'
  },
  {
    id:'bandido-comun',
    name:'Bandido Común',
    type:'Humanoide',
    size:'Mediano',
    cr:'1/8',
    ac:11,
    hpMax:11,
    speed:'30 ft',
    atk:'+3',
    str:11,dex:11,con:11,int:10,wis:10,cha:9,
    desc:'Humano desesperado, no malvado. Espada oxidada o cuchillo viejo, ropa de viaje desgastada. Sin armadura real. Cobarde — si dos caen, los otros huyen sin tirada.',
    attacks:[
      {name:'Espada oxidada',bonus:'+3',dmg:'1d6+1 cortante',note:'Arma vieja y mal mantenida.'}
    ],
    abilities:'Cobardía: si 2+ bandidos caen, los restantes huyen automáticamente sin tirada de moral.',
    phases:[
      {name:'Intimidación inicial',desc:'El líder habla. Los bandidos rodean al grupo amenazando con armas. Piden todo lo que tengan.'},
      {name:'Si el grupo muestra fuerza',desc:'Intercambian miradas nerviosas. El líder podría rendirse antes del combate (WIS save DC 12 vs intimidación).'},
      {name:'Combate o huida',desc:'Si pelean, son fáciles. Si el grupo es generoso o habla, hay información valiosa que ganar.'}
    ],
    rewards:'XP mínima por combate. Lo importante es lo narrativo — la decisión moral. Bandidos están conectados con Pip y Mila en Solmira.',
    loot:[
      { name:'Monedas de cobre', minRoll:8, qty:'2d6 cp', note:'Poco dinero entre todos.' },
      { name:'Mapa dibujado a mano', minRoll:12, qty:'1', note:'Caminos básicos del valle — útil.' },
      { name:'Carta personal sin terminar', minRoll:10, qty:'1', note:'El líder escribía a alguien — narrativo puro.' },
      { name:'Información sobre la aldea atacada', minRoll:0, qty:'1', note:'GARANTIZADO si el grupo habla con ellos. Aldea al norte del Valle Aethon — algo Fell atacó hace 3 meses, perdieron todo.' }
    ],
    notes:'Encuentro 5. Encuentro MORAL — primer enemigo que no es monstruo ni Fell.\n\nDecisiones consecuentes:\n• Si los matan: Pip y Mila lo saben. Relación fría/hostil en Solmira.\n• Si los dejan huir: relación más abierta. Uno podría aparecer en Solmira con info o gratitud.\n• Si son generosos: confianza con Pip rápidamente.'
  },
  {
    id:'lider-bandidos',
    name:'Líder de Bandidos',
    type:'Humanoide',
    size:'Mediano',
    cr:'1/2',
    ac:13,
    hpMax:22,
    speed:'30 ft',
    atk:'+4',
    str:13,dex:12,con:12,int:11,wis:10,cha:11,
    desc:'Espada en mejor estado, chaleco de cuero, pistola de humo única para huir si lo acorralan. Intenta intimidar primero. No pelea hasta la muerte — no tiene razón para hacerlo.',
    attacks:[
      {name:'Espada',bonus:'+4',dmg:'1d8+2 cortante',note:'Mejor mantenida que las de sus compañeros.'},
      {name:'Pistola de humo (escape)',bonus:'—',dmg:'—',note:'Crea nube de humo 15-ft, blinded en el área 1 turno. La usa para huir si está acorralado. 1 uso total.'}
    ],
    abilities:'Intimidación táctica: empieza el encuentro hablando, no atacando.\nRendición posible: si el grupo muestra superioridad clara, WIS save DC 12 — si falla, propone rendirse antes del combate.',
    phases:[
      {name:'Turno 1 — Habla',desc:'El líder habla e intenta intimidar al grupo. Pide todo lo que tengan.'},
      {name:'Si grupo muestra fuerza',desc:'Bandidos intercambian miradas nerviosas. Posible rendición.'},
      {name:'Huida',desc:'Si la cosa se pone fea para él, usa pistola de humo y huye. Su gente puede caer pero él escapa.'}
    ],
    rewards:'XP por encuentro. Lo importante son las consecuencias narrativas en Solmira.',
    loot:[
      { name:'Pistola de humo', minRoll:0, qty:'1', note:'GARANTIZADO si lo derrotan. Item menor útil para escapar o distracción. Usable 1 vez.' },
      { name:'Espada en mejor estado', minRoll:8, qty:'1', note:'Mejor que las espadas oxidadas de sus compañeros.' },
      { name:'Carta personal sin terminar', minRoll:10, qty:'1', note:'Escribía a alguien (familia? amante?). Pista narrativa.' },
      { name:'Mapa dibujado a mano', minRoll:12, qty:'1', note:'Mejor calidad que el de los bandidos comunes.' }
    ],
    notes:'Encuentro 5 — Líder del grupo de bandidos. No es malvado, es desesperado.'
  },
  {
    id:'hiena-fell',
    name:'Hiena Corrupta Fell',
    type:'Bestia',
    size:'Mediano',
    cr:'1',
    ac:13,
    hpMax:22,
    speed:'50 ft',
    atk:'+4',
    str:13,dex:14,con:12,int:4,wis:10,cha:5,
    desc:'PENDIENTE — stats a desarrollar cuando se confirme la sesión. Stats actuales son placeholder basados en Hiena estándar + tags Fell. Ajustá según necesidad.',
    attacks:[
      {name:'Mordida Fell',bonus:'+4',dmg:'1d8+2 perforante + 1d4 necrótico',note:'PLACEHOLDER — ajustá según el balance que necesite el Encuentro 4.'}
    ],
    abilities:'Manada Fell (PLACEHOLDER): ventaja en ataques contra criatura si otra hiena Fell está a 5 ft.\nVelocidad enloquecida: si bajada de 50% HP, +10 ft velocidad por turno.',
    phases:[
      {name:'A desarrollar',desc:'Stats y fases pendientes. Aparece en el Encuentro 4 — Ataque a Solmira.'}
    ],
    rewards:'A desarrollar.',
    loot:[
      { name:'Colmillos Fell de hiena', minRoll:8, qty:'1d2', note:'PLACEHOLDER. Material de crafting.' },
      { name:'Cuero corrupto', minRoll:10, qty:'1', note:'PLACEHOLDER. Material para armaduras leves.' }
    ],
    notes:'⚠ PLACEHOLDER — stats y loot a desarrollar cuando se confirme el Encuentro 4 (Ataque a Solmira). Forma parte de la fuerza Fell que ataca la ciudad junto con guerreros y un comandante inferior.'
  }
];

