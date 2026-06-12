/* ── NPCs data-driven ── */

module.exports = [
  // ── VELO ELMYRA ──
  { id:'zyren', name:'Zyren', icon:'✦', faction:'Velo Elmyra',
    role:'Líder y guardián principal del Velo Elmyra · Cambiaformas',
    status:'friendly', statusLabel:'Aliado',
    desc:'Se presentó como gato blanco y negro, luego forma híbrida (león/águila) y finalmente elfo. Sintió la resonancia del grupo al llegar al mundo. Prueba al grupo antes de confiar.',
    extra:'Inteligente, misterioso, protege sin revelar todo su poder. Tiene los materiales del lobo (piel, pelo, colmillos) — los espera en Aether Grove con algo útil. Después del Encuentro 3 se separa del grupo con Nira: vuelven al Grove para investigar la insignia Fell con Isis. Mencionó "una druida más sabia y más antigua que yo".\n\nDiálogos canon:\n• "Cuando entraron en Ardaetheros, sentí una resonancia."\n• "Eso les podría haber pasado" (mirando a Rac y Esdas tras el comandante)\n• "Si no llego antes de que necesiten ayuda, mandaré a Zael."' },

  { id:'nira', name:'Nira', icon:'🐆', faction:'Velo Elmyra',
    role:'Guardiana exterior de Aether Grove · Sanadora de campo · Cambiaformas',
    status:'friendly', statusLabel:'Aliada',
    desc:'Elfa de piel oscura, elegante, sigilosa. Pantera negra en su forma animal. Disfruta generar tensión antes de revelar su naturaleza protectora. Llegó por pedido de Zyren y purgó el veneno Fell de Rac y Esdas.',
    extra:'Combate exclusivamente sigiloso. Puede volverse invisible fundiéndose con el bosque en forma de pantera. Magia de naturaleza orientada a sanación.\n\nEnseña a Boyd las bases de la sanación con magia de naturaleza — conexión personal clave con el druida del grupo. Su energía es distinta a Zyren: más druida/guardiana de sombra.' },

  { id:'zael', name:'Zael', icon:'🐯', faction:'Velo Elmyra',
    role:'Druida del Velo Elmyra · Cambiaformas (tigre blanco)',
    status:'friendly', statusLabel:'Aliado',
    desc:'Vago filosóficamente. Habla en frases cortas. Se recuesta en cualquier superficie disponible. En terreno vertical se transforma — escala por instinto puro con agilidad que no corresponde a alguien siempre a punto de dormirse.',
    extra:'Inspiración: Tae — gato blanco y gris de Relyo.\n\nRelaciones:\n• Zyren — hermano menor no de sangre. Zyren cree en su potencial más que él mismo.\n• Nira — enamorado de ella obvio para todos. Nira lo trata como hermana mayor (le revuelve el pelo, ignora sus comentarios románticos).\n• Idris — rival y compañero. Se respetan sin admitirlo. Entrenan juntos peleando.\n• Relyo — conexión especial que ninguno sabría explicar.\n\nPrimer encuentro: Aether Grove, Sesión 2-3 — probablemente dormido. Acompaña al grupo en Jabal Thalos — primera transformación en tigre blanco en momento crítico de las montañas.' },

  { id:'idris', name:'Idris', icon:'🐅', faction:'Velo Elmyra',
    role:'Druida combatiente del Velo Elmyra · Cambiaformas (tigre de selva)',
    status:'friendly', statusLabel:'Aliado',
    desc:'Se deja acercar pero tiene un límite claro y poco aviso antes de cruzarlo. Después del conflicto es leal y cálido — pero hay que ganarse ese lugar. Poca paciencia con la mediocridad, mucho respeto por quien demuestra valor real.',
    extra:'Inspiración: Natalio — gato atigrado de Boyd.\n\nNivel de poder similar a Zael — por debajo de Zyren y Nira. No domina aún las formas mezcladas.\n\nRelaciones:\n• Zael — rival y compañero. El grupo lo escucha mencionado en las montañas antes de conocerlo.\n\nPrimer encuentro: misión del valle boscoso junto a Sakura para buscar plantas raras. Primer contacto tenso, confianza ganada en combate.' },

  { id:'isis', name:'Isis', icon:'🌙', faction:'Velo Elmyra',
    role:'Druida sabia · Guardiana del conocimiento antiguo · La más antigua del Grove',
    status:'neutral', statusLabel:'Distante',
    desc:'Piel blanca, ojos grises claros, movimiento lento y sereno. No se mueve por nadie ni nada que no considere digno. Ignora al grupo con indiferencia total — no con hostilidad. Solo Boyd puede acercarse, y solo porque ella lo permite.',
    extra:'Inspiración: gata más vieja de Boyd — blanquita, ojos grises.\n\nSus consejos nunca son directos — son semillas que Boyd tendrá que descifrar solo.\n\nRol narrativo clave:\n• Primera mención del origen de los Owling en la otra parte del mundo — solo a Boyd, solo una vez\n• Guía indirecta de la evolución druídica de Boyd — explica sin explicar\n• El grupo aprenderá rápido que preguntarle directamente no funciona\n• Habla con Zyren sobre el símbolo Fell después del Encuentro 3\n\nPrimer encuentro: Aether Grove, Sesión 2-3 — de lejos cerca de un pozo de agua, en paz.' },

  // ── SUNBOUND DRUIDS ──
  { id:'sura', name:'Sura', icon:'☀', faction:'Sunbound Druids',
    role:'Líder/figura fundadora de los Sunbound Druids',
    status:'friendly', statusLabel:'Por conocer',
    desc:'Piel muy oscura, físicamente imponente, movimiento lento pero presencia enorme. Calor profundo sin sentimentalismo. Sabiduría ganada a golpes. Cuando entra a una sala la gente baja la voz sin que ella pida nada.',
    extra:'Inspiración: Ollie — perra de Relyo.\n\nNo necesita demostrar nada — lo que es se siente.\n\nRol narrativo: primera figura que habla del Fell Lord sin evasivas. Da al grupo el contexto real de lo que está pasando en Ardaetheros. Relyo siente algo familiar en ella que no puede explicar.\n\nRelaciones:\n• Barek — lo respeta como druida y persona. Pegamento social del grupo.\n\nPrimer encuentro: Solmira — ciudad del valle, en el Hall de los Sunbound.' },

  { id:'barek', name:'Barek', icon:'🍞', faction:'Sunbound Druids',
    role:'Druida miembro de los Sunbound · Figura querida y respetada',
    status:'friendly', statusLabel:'Por conocer',
    desc:'Corpulento, cara amable, siempre con algo para comer. Se mueve con agilidad que no corresponde a su tamaño. Genuinamente bueno sin fachada. Le importa la gente, recuerda nombres.',
    extra:'Inspiración: gato de Tyrell — gordo, vago, muy bueno.\n\nSin ambición de poder — eso hace que todos confíen en él.\n\nRelaciones:\n• Sura — ella lo respeta como druida y persona\n• Aela — amigos de infancia. La única persona a quien Aela da información gratis (él no lo menciona para no arruinar su reputación)\n• Barak — hermanos. Uno druida Sunbound, uno paladín. Caminos opuestos con misma raíz — alto potencial narrativo cuando estén en la misma sala\n\nPrimer encuentro: Solmira — primera cara amigable al llegar. A través de él el grupo llega a Sura.' },

  // ── INDEPENDIENTES ──
  { id:'sakura', name:'Sakura', icon:'🌸', faction:'Independiente',
    role:'Herbalista y comerciante itinerante',
    status:'friendly', statusLabel:'Por conocer',
    desc:'Piel dorada, siempre con alguna flor en el cabello o bolsillo. Bolsa enorme con hierbas, raíces, flores secas y frascos que tintinean. Curiosa, directa, sin ansiedad social. Se sienta con extraños como si los conociera. Nada la perturba demasiado.',
    extra:'Inspiración: Nanami — gata de Rac.\n\nRol mecánico: vendedora recurrente de ingredientes para pociones, plantas medicinales, cataplasmas, aloe y materiales de crafting alquímico. Tiene relación con la florería del mercado de Solmira.\n\nRol narrativo:\n• Primer enlace entre Velo Elmyra y Sunbound — vende a ambas facciones\n• Primera mención de los Sunbound para el grupo\n• Momento de gracia con Rac: fascinación con el tatuaje de Ati en su mano\n• Se suma a la misión del valle boscoso con Idris para buscar plantas raras\n\nPrimer encuentro: Aether Grove, Sesión 2-3.' },

  { id:'aela', name:'Aela', icon:'🗝', faction:'Independiente',
    role:'Informante independiente · Red de contactos propia',
    status:'neutral', statusLabel:'Por conocer',
    desc:'Piel clara, ojos celestes muy llamativos. Siempre arreglada. Primera impresión: cálida. Segunda impresión: ya sabe más de vos de lo que vos sabés de ella.',
    extra:'Inspiración: Janis — gata blanca de Tyrell, ojos celestes.\n\nPersonalidad: carismática y genuinamente afectuosa — no es fachada. Su afecto y su información tienen el mismo sistema de precio. Nunca pide algo imposible pero siempre algo que duela un poco.\n\nTrasfondo: creció con amigos que despertaron poderes. Ella no. Construyó su poder de otra manera — información sobre los que sí lo tienen.\n\nRelaciones:\n• Barek — amigo de infancia, única persona que recibe info gratis\n• Barak — amigo de infancia (hermano de Barek, paladín de la Capital)\n• 2 paladines de la Capital — amigos de infancia\n\nRol mecánico: fuente de rumores, secretos e información de facciones. Precio variable — dinero, favores o algo personal. El símbolo Fell que lleva el grupo puede generar una escena muy interesante con ella. Reconoce a Tyrell de alguna manera al verlo (contexto a definir).' },

  { id:'pip', name:'Pip', icon:'🗡', faction:'Ladrones nobles',
    role:'Líder menor de los ladrones nobles',
    status:'neutral', statusLabel:'Por conocer',
    desc:'Humano joven, blanco, bajo de altura, muy ágil. Irritable, lleno de energía, desafía constantemente pero con lealtad feroz debajo. Cabrón y juguetón a la vez.',
    extra:'Inspiración: Molti — caniche de infancia de Tyrell.\n\nRol narrativo: ESPEJO DEL PASADO DE TYRELL — abandonado, sobreviviendo en las calles, robando comida. La diferencia es que a Tyrell lo encontraron los paladines; a Pip todavía no lo encontró nadie. Conexión emocional clave para Tyrell.\n\nLos 5 bandidos del camino a Solmira están relacionados con él y Mila — la decisión del grupo afectará directamente cómo Pip y Mila los reciben:\n• Si los matan: relación inicial fría/hostil\n• Si los dejan huir: relación abierta\n• Si son generosos: confianza rápida\n\nPrimer encuentro: Solmira — junto a Mila.' },

  { id:'mila', name:'Mila', icon:'🪶', faction:'Ladrones nobles',
    role:'Niña compañera de Pip en los ladrones nobles',
    status:'neutral', statusLabel:'Por conocer',
    desc:'Pelo gris largo, expresión curiosa pero esquiva. Curiosa y tímida. Se acerca con fascinación pero desaparece cuando se siente expuesta.',
    extra:'Inspiración: Chapi — gata de Boyd, pelo gris largo.\n\nSolo Boyd la atrae genuinamente — le fascinan sus plumas de Owling. Ese momento de conexión es tierno y narrativamente útil para el personaje de Boyd.\n\nPrimer encuentro: Solmira, junto a Pip. Mila está presente pero observa desde lejos.' },

  // ── PALADINES DE LA CAPITAL ──
  { id:'barak', name:'Barak', icon:'⚔', faction:'Paladines de la Capital',
    role:'Paladín respetado de la Capital',
    status:'friendly', statusLabel:'Por conocer',
    desc:'Humano morocho, alto, fuerte, leal. Físicamente imponente con energía noble. Moral muy clara, blanco y negro en su forma de ver el mundo. Leal hasta el final.',
    extra:'Inspiración: Coco — perro de Tyrell.\n\nProbablemente conecta con Tyrell por el sentido del deber y el juramento.\n\nRelaciones:\n• Barek — hermanos. Caminos opuestos (uno druida Sunbound, uno paladín). La dinámica cuando el grupo los ponga en la misma sala tiene mucho potencial — mismo origen, caminos completamente distintos.\n• Aela — amigo de infancia.\n\nPrimer encuentro: La Capital (sesiones medias).' },

  { id:'sova', name:'Sova', icon:'🕊', faction:'Paladines de la Capital',
    role:'Priest de los Paladines de la Capital · Apoyo espiritual, no combatiente',
    status:'friendly', statusLabel:'Por conocer',
    desc:'Humana rubia, alta, de edad avanzada. Presencia serena y espiritual. Conexión profunda con la luz. Sabiduría acumulada sin necesidad de demostrarse.',
    extra:'Inspiración: Cata — perra de Tyrell.\n\nRol narrativo: puede reconocer el despertar de Tyrell como paladín antes que él mismo. Figura clave para su desarrollo espiritual y su conexión con la luz.\n\nPrimer encuentro: La Capital.' },

  // ── NOBLEZA ──
  { id:'ramis', name:'Ramis Al-Nasir', icon:'💎', faction:'Nobleza',
    role:'Noble independiente de la Capital · Familia Al-Nasir',
    status:'neutral', statusLabel:'Por conocer',
    desc:'Humano de rasgos egipcios/árabes. Cuidado, elegante, siempre presentable. Sabe exactamente lo que vale. Carismático y mimoso en el sentido social — sabe cómo hacer que la gente se sienta especial cuando le conviene.',
    extra:'Inspiración: Biscocho — gato siamés de Boyd.\n\nLa familia Al-Nasir construyó su poder apoyando a reyes — acceso a casi todo, lealtad a casi nadie en particular.\n\nRol narrativo: su posición privilegiada abre puertas que el grupo no podría abrir solo. El precio de su ayuda no será dinero — algo más interesante a definir según el momento de la campaña.\n\nPrimer encuentro: La Capital.' },

  // ── SOLMIRA ──
  { id:'caeron', name:'Caeron', icon:'🛡', faction:'Solmira',
    role:'Alcalde de Solmira',
    status:'neutral', statusLabel:'Frío inicial',
    desc:'Humano guerrero tradicional, físicamente imponente, marcas de batallas pasadas. Empieza cerrado y prejuicioso con el grupo.',
    extra:'Actitud inicial por personaje:\n• Rac — desconfianza (lo ve como bárbaro sin modales del norte)\n• Relyo — respeto frío (elfo, útil, sabe magia)\n• Tyrell — incomodidad e ignorancia (nunca vio un draconoide)\n• Boyd — incomodidad e ignorancia (nunca vio un Owlin)\n• Esdas — respeto frío (elfo, mago)\n\nDuda de los Sunbound institucionalmente pero respeta a Sura personalmente.\n\nArco narrativo: si el grupo defiende Solmira en el Encuentro 4, ese muro se rompe. No se vuelve su mejor amigo — pero los mira diferente. El cambio tiene que sentirse ganado.' },

  // ── MINA ZAFIRA ──
  { id:'reynera', name:'Reynera', icon:'🍺', faction:'Mina Zafira',
    role:'Innkeeper — Taberna de Mina Zafira',
    status:'friendly', statusLabel:'Amistosa',
    desc:'Cálida y hospitalaria. Invitó a comer, beber y alojarse al grupo. Tyron habla bien del grupo ante ella.',
    extra:'Viuda de un aventurero. Tyrell le hizo juramento de protección. Tiene gran reputación en Mina Zafira.\n\n⚠ Hilo latente: su marido aparecerá como figura corrupta del Fell Lord en el futuro. Punto de quiebre emocional para Tyrell.' },

  { id:'tyron', name:'Tyron', icon:'🚪', faction:'Mina Zafira',
    role:'Guardapuerta — Taberna de Mina Zafira',
    status:'friendly', statusLabel:'Amistoso',
    desc:'Observador y moralmente atento. Primero no los dejó entrar; luego les regaló pan. Los recibió bien a su regreso por haber alimentado al gato.',
    extra:'Primer NPC que respondió a la conducta moral del grupo. Funciona como termómetro del comportamiento de la party en Mina Zafira.' },

  { id:'smith', name:'Smith', icon:'🔨', faction:'Mina Zafira',
    role:'Herrero / Artesano — Mina Zafira',
    status:'neutral', statusLabel:'Mixto',
    desc:'Clave para crafting futuro. Le simpatizó Rac, prometió descuento si trae recursos. Se enemistó con Esdas por falta de respeto.',
    extra:'Puede hacer armas enormes con los materiales correctos. Rac le pidió una espada de dos metros — posible en el futuro.\n\n⚠ Conexión narrativa: podría reparar y adaptar la espada gigante del Comandante Fell (Encuentro 3) para Rac. También podría hacer la parte física de la Daga del Colmillo Corrompido si recibe ayuda arcana.' },

  { id:'farandon', name:'Farandon', icon:'⚔', faction:'Mina Zafira',
    role:'Vendedor de armas y armaduras — Mina Zafira',
    status:'friendly', statusLabel:'Amistoso',
    desc:'Alto, respetuoso y experimentado. Lee bien a la party. Respeta a Reynera, lo que ayudó al trato con el grupo. Equipa con criterio, no con avaricia.',
    extra:'Equipó al grupo con ~8 monedas de plata. Punto de referencia para compras de equipo mundano en Mina Zafira.' }
];
