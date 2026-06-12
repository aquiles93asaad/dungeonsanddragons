/* ── PRESET MONSTERS: encuentros ── */

module.exports = [
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
  },
  {
    id:'guerrero-madera',
    name:'Guerrero de Madera',
    type:'Constructo',
    size:'Mediano',
    cr:'1',
    ac:14,
    hpMax:32,
    speed:'30 ft',
    atk:'+4',
    str:15,dex:8,con:14,int:3,wis:8,cha:1,
    desc:'Figura humanoide tallada en roble antiguo del Grove. Las articulaciones crujen con cada movimiento. No tiene rostro — solo una superficie lisa de madera con líneas de savia verde brillante que pulsan como venas. No piensa, no habla, no siente. Ejecuta.',
    attacks:[
      {name:'Estacazo',bonus:'+4',dmg:'1d8+3 contundente',note:'Golpe directo con el brazo de madera. Lento pero predecible — ideal para que los jugadores practiquen reacciones.'},
      {name:'Embestida',bonus:'+4',dmg:'1d6+3 contundente',note:'Se lanza hacia adelante. Si pega, DEX CD 12 o el objetivo es empujado 5 ft y pierde la acción bonus de su próximo turno.'}
    ],
    abilities:'Vulnerable al fuego: recibe el doble de daño de fuego. Una antorcha que pegue hace 1d4 extra.\n\nInmunidades de constructo: inmune a veneno, daño psíquico, encanto, miedo, parálisis y el estado inconsciente.\n\nSin reacción: no hace ataques de oportunidad — se mueve en línea recta hacia su objetivo sin esquivar.',
    phases:[
      {name:'Patrón de ataque',desc:'Avanza directo hacia el objetivo más cercano. Nunca cambia de objetivo voluntariamente — el DM puede usarlo para enseñar al grupo la importancia de controlar el aggro.'},
      {name:'Al llegar a 0 HP',desc:'Se fragmenta en astillas. No hay agonía, no hay caída dramática. Solo madera rota en el suelo. La savia verde se apaga.'}
    ],
    rewards:'Sin XP real — son constructos de entrenamiento creados por Zyren.',
    loot:[
      {name:'Astillas de roble del Grove',minRoll:0,qty:'un puñado',note:'NARRATIVO. Boyd puede percibir que la madera está imbuida de magia natural. Sin valor de crafting aún.'}
    ],
    notes:'Entrenamiento — creado por Zyren con magia del Grove. Se usa en grupos de 2-3 contra el equipo. Son predecibles por diseño: Zyren los hace así para que los jugadores aprendan a leer patrones. Si el grupo los domina fácil, el DM puede activar el Bruto de Madera.'
  },
  {
    id:'bruto-madera',
    name:'Bruto de Madera',
    type:'Constructo',
    size:'Grande',
    cr:'4',
    ac:16,
    hpMax:68,
    speed:'25 ft',
    atk:'+6',
    str:20,dex:6,con:18,int:3,wis:8,cha:1,
    desc:'Versión mayor del Guerrero de Madera — casi dos metros y medio, tronco en lugar de torso, ramas gruesas como brazos. El suelo tiembla levemente con cada paso. Las líneas de savia verde en su cuerpo son más anchas y brillan con más intensidad. Está hecho para que Zyren lo rompa.',
    attacks:[
      {name:'Manotazo',bonus:'+6',dmg:'2d8+5 contundente',note:'Reach 10 ft por tamaño. Un golpe directo que puede tirar al suelo a cualquier personaje de nivel 2.'},
      {name:'Pisotón',bonus:'+6',dmg:'2d6+5 contundente',note:'Objetivo en el suelo (prone) o adyacente. CON CD 14 o queda aturdido hasta el final de su próximo turno.'},
      {name:'Barrido de tronco (Recarga 5-6)',bonus:'+6',dmg:'1d10+5 contundente a todos en 10 ft',note:'DEX CD 14 o tumbado (prone). Zyren lo esquiva sin esfuerzo para mostrarlo.'}
    ],
    abilities:'Corteza endurecida: reduce todo daño físico no-mágico en 3 (mínimo 1).\n\nVulnerable al fuego: doble daño de fuego. Zyren usa esto para terminarlo rápido si quiere ser eficiente.\n\nInmunidades de constructo: igual que el Guerrero — veneno, psíquico, encanto, miedo, parálisis.\n\nPresencia intimidante: criatura que lo vea por primera vez tira WIS CD 12 o tiene desventaja en su primer ataque contra él.',
    phases:[
      {name:'Fase 1 — Amenaza lenta',desc:'Avanza sin apuro. Cada paso es un crujido. El grupo lo ve y entiende que los Guerreros eran el calentamiento.'},
      {name:'Fase 2 — Zyren entra',desc:'Zyren lo enfrenta solo. Lo que tarda el grupo en derrotar 3 Guerreros de Madera, Zyren lo resuelve en 2 turnos. El Bruto queda en astillas grandes.'}
    ],
    rewards:'Sin XP — constructo de demostración.',
    loot:[
      {name:'Fragmento de tronco imbuido',minRoll:0,qty:'1',note:'NARRATIVO. Un trozo del núcleo del Bruto — Boyd puede sentir la magia condensada dentro. Zyren podría explicar cómo se crea uno si alguien pregunta.'}
    ],
    notes:'SOLO para la demostración de Zyren. No lo manden contra el grupo de nivel 2 — uno solo puede derribar a cualquier personaje en un turno. Su propósito es ser el dummy que Zyren destruye para que el grupo entienda la diferencia de escala. DM: hacé que la pelea de Zyren dure exactamente 2 turnos y sea quirúrgica.'
  },
  {
    id:'zyren-entrenamiento',
    name:'Zyren (Entrenamiento)',
    type:'Élfico / Cambiaformas',
    size:'Mediano–Grande',
    cr:'—',
    ac:12,
    hpMax:110,
    speed:'40 ft (élfica/felina) · 40 ft + vuelo 30 ft (híbrida)',
    atk:'+9',
    str:20,dex:20,con:18,int:16,wis:20,cha:14,
    desc:'Zyren en modo entrenamiento — contiene su poder pero no su precisión. Cambia de forma según el desempeño del grupo: élfica para evaluar, pantera para presionar, híbrida (león/águila) cuando quiere que entiendan la escala real de lo que existe en el mundo.',
    attacks:[
      {name:'Golpe élfico (forma élfica)',bonus:'+9',dmg:'1d8+5 contundente',note:'Ataque desarmado de precisión. No busca dañar, busca enseñar. Si pega, el objetivo entiende exactamente por qué falló.'},
      {name:'Zarpazo de pantera (forma felina)',bonus:'+9',dmg:'1d10+5 cortante',note:'Rápido y silencioso. Cambia de objetivo cada turno para obligar a que todos estén en alerta.'},
      {name:'Garra de León (forma híbrida)',bonus:'+9',dmg:'2d6+5 cortante',note:'Reach 10 ft. Zyren no suaviza este daño — es el recordatorio de qué pasa cuando el grupo pierde la concentración.'},
      {name:'Zarpazo de Águila (forma híbrida)',bonus:'+9',dmg:'1d8+5 perforante',note:'DEX CD 15 o empujado 10 ft. Lo usa específicamente para mostrar la importancia del posicionamiento.'}
    ],
    abilities:'Cambiaformas (Bonus Action): puede cambiar entre forma élfica, pantera e híbrida sin costo de acción. Cada forma tiene movilidad diferente.\n\nVisión del Guardián: no puede ser sorprendido. Ventaja en Perception e Insight.\n\nContención deliberada: solo hace UN ataque por turno durante el entrenamiento. Si el grupo va muy mal, reduce el daño a la mitad sin aviso. Si van excepcionalmente bien, puede subir la intensidad.\n\nCortar el entrenamiento: si algún personaje llega a 0 HP, Zyren detiene el combate inmediatamente, los estabiliza con magia de naturaleza. "Hasta acá."',
    phases:[
      {name:'Fase 1 — Evaluación (forma élfica)',desc:'Pelea desarmado, en silencio. No ataca primero — espera que ellos inicien. Observa cómo se posicionan, si coordinan o cada uno hace lo suyo. Sus golpes son limpios y precisos. No duele tanto como enseña.'},
      {name:'Fase 2 — Presión (forma pantera)',desc:'Cuando el grupo se acomodó, cambia de forma sin aviso. Más veloz, más silencioso. Nunca presiona al mismo objetivo dos veces seguidas — obliga a que todos tengan que estar atentos.'},
      {name:'Fase 3 — Forma híbrida',desc:'Solo si el grupo está coordinando bien. Zyren les muestra por qué es el guardián del Velo Elmyra. Mayor alcance, más daño, presencia imponente. No es para asustarlos — es para que tengan un benchmark real de lo que existe en el mundo.'},
      {name:'Fin del entrenamiento',desc:'Zyren detiene el combate cuando decidió que aprendieron lo suficiente — no cuando el grupo lo derrota. "Suficiente." Vuelve a forma élfica, los observa en silencio unos segundos. Entonces habla.'}
    ],
    rewards:'Sin XP mecánica. Recompensa narrativa: cada jugador nombra UNA cosa que aprendió sobre su personaje en el combate. Eso se convierte en una ventaja narrativa para el próximo encuentro real.',
    loot:[],
    notes:'ENTRENAMIENTO — no es un encuentro de combate real. El objetivo es revelar el nivel de poder de Zyren de forma experiencial, no solo narrativa. El grupo lo ve en acción por primera vez.\n\nDM: Zyren sabe lo que el grupo hará antes de que lo hagan — usá eso para hacer comentarios precisos durante la pelea, no para humillarlos sino para enseñarles. Si el grupo pregunta después cuánto de su poder usó: "Menos de la mitad."'
  }
];

