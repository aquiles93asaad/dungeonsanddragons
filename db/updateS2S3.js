/**
 * updateS2S3.js — Carga directa a MongoDB post-Sesiones 2 y 3.
 * Corre UNA VEZ: node db/updateS2S3.js
 * No toca el seed.js ni los archivos de data.
 */
require('dotenv').config();
const mongoose      = require('mongoose');
const Session       = require('../models/Session');
const CampaignEvent = require('../models/CampaignEvent');
const StoryChapter  = require('../models/StoryChapter');
const StoryAct      = require('../models/StoryAct');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Conectado a MongoDB\n');

  // ─────────────────────────────────────────────────────────────────
  // 1. SESSIONS — insertar S2 y S3
  // ─────────────────────────────────────────────────────────────────
  console.log('── Sessions ──');

  await Session.findOneAndUpdate(
    { number: 2 },
    {
      number: 2,
      title: 'Aether Grove — Descanso y aprendizaje',
      date: null,
      notes: [
        { type: 'narrative', text: 'Continuación del encuentro con Nira. Rac y Esdas conscientes pero sin poder moverse solos — el veneno Fell fue detenido pero no curado del todo.' },
        { type: 'narrative', text: 'Relyo intenta activar los puntos vitales de Rac y Esdas con la misma técnica usada contra la Araña Madre. Los lastima a ambos y empeora su situación. Nira: "Esta técnica tuya no parece que fue hecha para sanar de esta forma. Es letal."' },
        { type: 'narrative', text: 'Relyo toma el corazón de la Araña Madre y dos colmillos intactos con Fell interlazado.' },
        { type: 'narrative', text: 'Tyrell lleva a Esdas en sus espaldas (para generar confianza). Relyo lleva a Rac. Nira juzga: "Qué raro que el dragonoide grandote no llevó al otro grandote."' },
        { type: 'narrative', text: 'En el camino al Grove, Nira llama a Boyd a solas. Le dice que su conexión inmediata con el bosque es lo más importante de un druida. "Lo que me viste hacer para salvar a tus compañeros lo podés hacer vos también." Boyd siente más confianza en sus poderes.' },
        { type: 'narrative', text: 'Llegada a Aether Grove. Suben ~20 metros por raíces naturales hasta una plataforma sólida entre los árboles — un pueblo tallado en la madera. Figuras élficas los observan desde arriba sin molestar.' },
        { type: 'narrative', text: 'Encuentro con Sakura — herbalista humana de Solmira, amiga de Nira desde chica (Nira en forma pantera la salvó de un lobo normal hace más de 10 años). Primera mención de Solmira. Sakura les regala una flor a cada uno.' },
        { type: 'narrative', text: 'Reencuentro con Zyren y Nira. Zyren confirma que lo ocurrido no fue normal y que parece que no fue el único en sentir la resonancia. Promete respuestas después del descanso.' },
        { type: 'narrative', text: 'Noche en el Grove — la fuente de meditación. Zyren le ofrece el lugar a Relyo, que rechaza dos veces. Boyd sí va y se encuentra con Isis, quien le habla con cariño genuino sobre el origen de los Owling y le dice que confíe en su conexión con la naturaleza. Boyd medita a solas.' },
        { type: 'narrative', text: 'Relyo y Esdas van luego a la fuente. Ven a Isis pero deliberadamente no los deja acercarse. Esdas intenta tocar el agua — Zyren lo prohíbe. Segunda vez que Esdas intenta — Isis aparece imponente: "NO TOQUES ESTE AGUA." A Relyo lo ignora completamente. Tres tratos distintos en la misma noche: Boyd (cariño), Esdas (grito), Relyo (ignorancia).' },
        { type: 'narrative', text: 'Mañana siguiente. Boyd le cuenta a Zyren que habló con Isis — Zyren se sorprende genuinamente. Zyren mira a Boyd: "Su compañero druida tiene la capacidad de curarlos como hizo Nira."' },
        { type: 'combat',    text: 'Boyd intenta curar a Rac — lo logra. Luego cura a Esdas. Primer spell de curación aprendido en mesa de forma completamente narrativa: Cure Wounds.' },
        { type: 'narrative', text: 'Zyren anuncia el plan: ir a Solmira para hablar con los Sunbound Druids sobre el Fell. Pero primero necesitan entrenarse. "No quiero que estén más en peligro fatal, en caso que ni Nira ni yo ni nadie más del Grove esté cerca para ayudarlos." — Fin de Sesión 2.' },
      ],
    },
    { upsert: true, new: true }
  );
  console.log('  ✓ Sesión 2 insertada/actualizada');

  await Session.findOneAndUpdate(
    { number: 3 },
    {
      number: 3,
      title: 'Entrenamiento en la arena — Subida a Nivel 3',
      date: new Date('2026-06-05'),
      notes: [
        { type: 'narrative', text: 'Boyd ausente — entrenó con Nira por separado (contenido a definir con el jugador). Zyren divide al grupo: Rac, Relyo, Tyrell y Esdas van con Zyren a la arena de entrenamiento.' },
        { type: 'narrative', text: 'La arena: plataforma circular enorme, una sola entrada, marcas visibles de uso real — garras, cortes, zonas quemadas.' },
        { type: 'combat',    text: 'Combate 1 — Dos Brutos de Madera (CA 16, 68 HP c/u). Iniciativa: Rac 19 · Esdas 10 · Tyrell 8 · Relyo 6. Round 1: Esdas Firebolt nat 20 (15 dmg). Relyo golpe de codo (10 dmg) — primer Ki controlado en combate real, siente los puntos vitales. Round 2: Bruto #2 Barrida de Tronco nat 20 — barre a Tyrell, Esdas y Relyo (6 dmg c/u). Zyren los cura a todos a HP pleno. Round 3: Tyrell usa Shield of Faith en Rac — primer spell de soporte en mesa, elige proteger en vez de atacar. Round 4: Esdas Magic Missile (13 dmg), Tyrell Thunderous Smite (7 dmg radiante). Relyo pifia nat 1 — se le cae el báculo (momento cómico). Round 5: Esdas Magic Missile golpe de gracia (11 dmg). Bruto #2 cae. Zyren disuelve el Bruto #1.' },
        { type: 'narrative', text: 'Entre combates: Zyren sana a todos. "¿Están para un desafío más complicado?" — el grupo acepta.' },
        { type: 'combat',    text: 'Combate 2 — Zyren como oponente (HP 110, CA 12). Round 1: Rac 12 dmg, Tyrell 8 dmg radiante, Esdas Ray of Frost 1 dmg. Zyren golpea a Rac (6 dmg). Round 2: Rac 16 dmg — rompe armadura de madera. Zyren se transforma en forma híbrida León/Águila, corre hacia Esdas. El grito de pánico de Esdas genera una onda arcana involuntaria — Tasha\'s Hideous Laughter (primera vez). Zyren aplasta a Esdas — se desmaya del miedo. Tyrell noqueado de un zarpazo. Rac queda con 1 HP. Round 3: Relyo intenta golpear con báculo — Zyren vuelve a forma élfica y lo noquea. Resultado: 37 dmg total de 110 HP. Zyren cura a todos.' },
        { type: 'narrative', text: 'Esdas se despierta — nadie lo mira. Usa una mano arcana invisible para chequearse los pantalones discretamente. Aprende Mage Hand — canon. Primer uso: verificar si se pilló de miedo.' },
        { type: 'narrative', text: 'Spells confirmados de Esdas al cierre de S3: Firebolt (cantrip, S1), Impulso telequinético (narrativo, S1), Ray of Frost (cantrip, S3), Tasha\'s Hideous Laughter (Nv1, S3), Magic Missile (Nv1, S3), Mage Hand (cantrip, S3).' },
        { type: 'narrative', text: 'Subida a Nivel 3 — canon. HP Nv3: Rac 27 · Tyrell 21 · Relyo 16 · Boyd 15 · Esdas 12. Subclases a definir con los jugadores antes de S4.' },
        { type: 'narrative', text: 'Zyren: "Volvamos a la plataforma donde estaban así nos agrupamos de nuevo con Nira y Boyd." — Fin de Sesión 3.' },
      ],
    },
    { upsert: true, new: true }
  );
  console.log('  ✓ Sesión 3 insertada/actualizada');

  // ─────────────────────────────────────────────────────────────────
  // 2. CAMPAIGN EVENTS — actualizar status/session + crear nuevos
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Campaign Events ──');

  // Marcar como "done" los que ocurrieron en S2
  const markDone = [
    'evt-aether-grove',
    'evt-sakura-aparece',
    'evt-isis-pozo',
    'evt-nira-sanacion-boyd',
    'evt-mision-zyren-solmira',
  ];
  for (const id of markDone) {
    await CampaignEvent.findOneAndUpdate({ id }, { status: 'done' });
    console.log(`  ✓ ${id} → done`);
  }

  // Subida nivel 3 ocurrió en S3
  await CampaignEvent.findOneAndUpdate({ id: 'evt-subida-nivel-3' }, { status: 'done', session: '3' });
  console.log('  ✓ evt-subida-nivel-3 → done (S3)');

  // Corregir session de eventos que son S4, no S2
  const moveToS4 = [
    'evt-sirvientes-fell',
    'evt-revelacion-comandante',
    'evt-zyren-nira-se-van',
    'evt-bandidos-camino',
    'evt-llegada-solmira',
    'evt-zael-dormido',
  ];
  for (const id of moveToS4) {
    await CampaignEvent.findOneAndUpdate({ id }, { session: '4' });
    console.log(`  ✓ ${id} → session 4`);
  }

  // Nuevos eventos S2
  const newEvents = [
    {
      id: 'evt-relyo-intenta-sanar',
      title: 'Relyo intenta activar puntos vitales — los lastima',
      description: 'Relyo intenta reanimar a Rac y Esdas con la técnica usada contra la Araña Madre. Los lastima a ambos. Nira: "Esta técnica no fue hecha para sanar. Es letal." Relyo sigue sin entender el poder que usó.',
      status: 'done',
      session: '2',
      order: 18,
    },
    {
      id: 'evt-camino-grove-boyd-nira',
      title: 'Camino al Grove — Nira y Boyd hablan a solas',
      description: 'Nira llama a Boyd en el camino. Le dice que su conexión inmediata con el bosque es lo más importante de un druida. "Lo que me viste hacer para salvar a tus compañeros lo podés hacer vos también." Boyd siente más confianza en sus poderes.',
      status: 'done',
      session: '2',
      order: 19,
    },
    {
      id: 'evt-isis-boyd-noche',
      title: 'Isis habla con Boyd en la fuente — origen Owling',
      description: 'Noche en el Grove. Boyd va a la fuente de meditación y se encuentra con Isis. Le dice que hace muchísimos años no vio nadie de su especie, que los Owling son originalmente de muy lejos. "Confiá más en vos mismo y en tu conexión con la naturaleza." Boyd ve su reflejo en el agua y siente más seguridad. A Esdas la gritó "NO TOQUES ESTE AGUA". A Relyo lo ignoró completamente.',
      status: 'done',
      session: '2',
      order: 20,
    },
    // Nuevos eventos S3
    {
      id: 'evt-entrenamiento-brutos',
      title: 'Entrenamiento S3 — Combate 1: Brutos de Madera',
      description: 'Zyren crea dos Brutos de Madera (CA 16, 68 HP). Primer Ki controlado de Relyo en combate real. Tyrell usa Shield of Faith por primera vez. Esdas con Magic Missile y Thunderous Smite de Tyrell derriban al Bruto #2. Zyren disuelve el primero.',
      status: 'done',
      session: '3',
      order: 21,
    },
    {
      id: 'evt-combate-zyren',
      title: 'Entrenamiento S3 — Combate 2: Zyren como oponente',
      description: 'Zyren se enfrenta al grupo de 4. El grito de pánico de Esdas genera Tasha\'s Hideous Laughter involuntario — primera vez. Zyren en forma híbrida noquea a Esdas, Tyrell y Relyo. Rac queda con 1 HP. El grupo le hizo 37 dmg de 110 HP. La diferencia de poder quedó clara.',
      status: 'done',
      session: '3',
      order: 22,
    },
    {
      id: 'evt-esdas-mage-hand',
      title: 'Esdas aprende Mage Hand post-desmayo',
      description: 'Esdas se despierta del desmayo. Nadie lo mira. Usa una mano arcana invisible para chequearse los pantalones. Aprende Mage Hand canon. Primer uso: verificar si se pilló de miedo. Patrón confirmado: magia que brota de emociones, no de estudio.',
      status: 'done',
      session: '3',
      order: 23,
    },
  ];

  for (const evt of newEvents) {
    const exists = await CampaignEvent.findOne({ id: evt.id });
    if (!exists) {
      await CampaignEvent.create(evt);
      console.log(`  ✓ Creado: ${evt.id}`);
    } else {
      console.log(`  ~ Ya existe: ${evt.id} (omitido)`);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. STORY — Capítulos 2 y 3 + sus actos
  // ─────────────────────────────────────────────────────────────────
  console.log('\n── Story Chapters & Acts ──');

  // Capítulo 2 — Sesión 2
  await StoryChapter.findOneAndUpdate(
    { number: 2 },
    { number: 2, title: 'Aether Grove — Descanso y aprendizaje' },
    { upsert: true, new: true }
  );
  console.log('  ✓ Capítulo 2 actualizado');

  // Capítulo 3 — Sesión 3
  await StoryChapter.findOneAndUpdate(
    { number: 3 },
    { number: 3, title: 'La arena de entrenamiento' },
    { upsert: true, new: true }
  );
  console.log('  ✓ Capítulo 3 creado');

  // Actos del Capítulo 2
  const actsS2 = [
    {
      chapter: 2, order: 1,
      title: 'Acto I — El intento de Relyo y la carga al Grove',
      body: [
        'Rac y Esdas recuperaron la conciencia pero no podían moverse solos — el veneno Fell fue detenido por Nira pero no curado del todo.',
        'Relyo, aún desconfiando del Velo Elmyra a pesar de todo lo que hicieron Zyren y Nira, intentó la misma técnica de golpe concentrado que usó contra la Araña Madre para reanimar a sus compañeros. Los lastimó a ambos, empeorando su situación. Nira fue directa: <em>"Esta técnica tuya no parece que fue hecha para sanar de esta forma. Es letal."</em>',
        'Relyo tomó el corazón de la araña y dos colmillos intactos con Fell interlazado. Tyrell decidió cargar a Esdas en sus espaldas — una decisión del jugador para generar confianza con el mago. Relyo cargó a Rac. <em>"Gracias por llevarme Relyo, qué mamado que estás que me podés llevar."</em> Relyo se rió y flexionó los brazos.',
      ],
      highlight: '',
    },
    {
      chapter: 2, order: 2,
      title: 'Acto II — Nira y Boyd en el camino',
      body: [
        'Nira llamó a Boyd para hablar a solas mientras el grupo marchaba. Después de un coqueteo torpe de Boyd, Nira fue al punto: <em>"Nunca vi alguien de tu raza. Cuando Zyren me contó de vos me dijo que, como nosotros, sos druida."</em>',
        '<em>"Eso me dicen"</em>, respondió Boyd. Nira: <em>"Sentiste conexión con este bosque casi inmediatamente, ¿no? Eso es lo más importante de un druida. Lo que me viste hacer para salvar a tus compañeros lo podés hacer vos también."</em>',
        'Boyd sintió algo más de confianza en sus poderes pero no dijo nada.',
      ],
      highlight: '',
    },
    {
      chapter: 2, order: 3,
      title: 'Acto III — Llegada a Aether Grove',
      body: [
        'El grupo llegó a un punto donde algo cambió — los árboles eran más grandes, las ramas enormes. Nira agarró una rama y subió siguiendo la escalera natural que formaban las raíces de un árbol colosal.',
        'Veinte metros arriba: una plataforma sólida y amplia entre los árboles. Un pueblo tallado dentro de la arboleda — espacios esculpidos en la madera, algunos grandes otros pequeños, conectados por plataformas en distintos niveles. Figuras élficas los observaban desde arriba sin acercarse, viendo que venían con Nira.',
        'Del otro lado de la plataforma, una humana miraba con curiosidad junto a un elfo. Era Sakura.',
      ],
      highlight: '',
    },
    {
      chapter: 2, order: 4,
      title: 'Acto IV — Sakura y la primera mención de Solmira',
      body: [
        'Antes de tener un minuto de descanso apareció la humana. Ojos achinados, piel blanca, pelo lacio, flor rosa en la oreja, mochila enorme pero cómoda con ella. <em>"¡Holaa chicos! Soy Sakura."</em>',
        'Relyo fue el primero en hablar, sospechoso y sin saludar. Sakura se sintió intimidada. Esdas la defendió. Rac se presentó con Ati y le preguntó si tenía comida. Ella se rió: <em>"Me causás gracia vos y Ati. No tengo comida, solo flores y plantas."</em>',
        'Contó su historia: de chica, Nira en forma pantera la salvó de un lobo normal al borde del bosque. Ese lobo no tenía líquido verde. Desde ese momento se hicieron amigas. Con el tiempo se volvió herbalista como su padre. Es de <strong style="color:var(--gold)">Solmira</strong> — primera vez que el grupo escucha el nombre. <em>"En un día se puede llegar. Desde que salen del bosque se puede ver en el valle."</em>',
        'Antes de irse sacó una flor para cada uno. Rac la puso en la oreja como Sakura. Tyrell la puso en su breastplate. Relyo la olió y reflexionó sobre cómo le había hablado.',
      ],
      highlight: '',
    },
    {
      chapter: 2, order: 5,
      title: 'Acto V — Zyren, la fuente y los tres tratos de Isis',
      body: [
        'Zyren volvió junto a Nira con sopa de hongos y agua pura. Confirmó que lo ocurrido no fue normal: algo raro estaba pasando, y no fue el único en sentir la resonancia cuando apareció el grupo. Prometió respuestas después del descanso.',
        'Esa noche, Zyren le ofreció a Relyo la fuente de meditación sagrada del árbol. Relyo rechazó dos veces — prefirió hacer guardia. Boyd fue en su lugar.',
        'Boyd se encontró con Isis junto al agua. Ella le habló con cariño genuino: hacía muchísimos años no veía a nadie de su especie. Los Owling son originalmente de muy lejos — no de esta parte del mundo. <em>"Confiá más en vos mismo y en tu conexión con la naturaleza."</em> Boyd vio su reflejo en el agua y sintió más seguridad. Se quedó a meditar a solas.',
        'Relyo y Esdas fueron luego. Vieron a Isis a lo lejos pero ella deliberadamente no se dejó alcanzar. Esdas intentó tocar el agua — Zyren lo prohibió. Segunda vez que intentó — Isis apareció imponente, más grande, más aterradora: <strong style="color:var(--gold)">"NO TOQUES ESTE AGUA."</strong> Relyo intentó preguntarle algo. Ella lo ignoró completamente.',
      ],
      highlight: 'La misma noche, tres tratos distintos: Boyd recibió cariño, Esdas un grito, Relyo silencio total.',
    },
    {
      chapter: 2, order: 6,
      title: 'Acto VI — Boyd aprende Cure Wounds',
      body: [
        'A la mañana siguiente, Boyd le contó a Zyren que había hablado con Isis. Zyren se sorprendió genuinamente — que Isis eligiera hablar con alguien era inusual y muy significativo.',
        'Zyren miró a Boyd: <em>"Su compañero druida tiene la capacidad de curarlos como hizo Nira. Intentá canalizar la naturaleza y copiar lo que hizo Nira con estos dos."</em>',
        'Boyd intentó curar a Rac. Lo logró. Luego curó a Esdas. Primer spell de curación aprendido en mesa de forma completamente narrativa.',
        'Zyren anunció el plan: ir a Solmira para hablar con los Sunbound Druids y su líder sobre el Fell. Pero primero, entrenamiento. <em>"No quiero que estén más en peligro fatal, en caso que ni Nira ni yo ni nadie más del Grove esté cerca para ayudarlos."</em>',
      ],
      highlight: 'Boyd aprendió Cure Wounds sin estudio — canalizando lo que vio hacer a Nira.',
    },
  ];

  // Limpiar actos S2 existentes (capítulo 2) y reinsertar
  await StoryAct.deleteMany({ chapter: 2 });
  await StoryAct.insertMany(actsS2);
  console.log(`  ✓ ${actsS2.length} actos de Capítulo 2 insertados`);

  // Actos del Capítulo 3
  const actsS3 = [
    {
      chapter: 3, order: 1,
      title: 'Acto I — La arena y los Brutos de Madera',
      body: [
        'Boyd entrenó con Nira por separado. Zyren llevó al resto a la arena: una plataforma circular enorme, una sola entrada, con marcas reales de combate — garras, cortes, zonas quemadas.',
        'Zyren levantó los brazos y creó dos Brutos de Madera enormes. <em>"Me parece que fue demasiado el golpe de antes para ustedes. Levántense y sigan peleando."</em>',
        'Round 1: Esdas lanzó Firebolt y sacó un <strong style="color:var(--gold)">20 natural</strong> — 15 de daño, la pierna del Bruto quedó temblando. Relyo golpeó de codo al segundo Bruto — 10 de daño. En ese momento sintió que podía ver los puntos vitales del oponente. <strong style="color:var(--gold)">Primer Ki controlado en combate real.</strong>',
        'Round 2: El Bruto #2 usó Barrida de Tronco con <strong style="color:var(--gold)">20 natural</strong> — barrio a Tyrell, Esdas y Relyo de una vez. Zyren intervino y los curó a todos a HP pleno.',
        'Round 3: Tyrell usó Shield of Faith en Rac en lugar de atacar — primer spell de soporte elegido conscientemente en mesa. Eligió proteger antes que golpear.',
        'Rondas 4 y 5: Esdas con Magic Missile y Tyrell con Thunderous Smite — daño radiante que empujó al Bruto hacia atrás. Relyo tiró un <strong style="color:var(--gold)">1 natural</strong> e intentó lanzar el báculo — se le cayó. Esdas remató con Magic Missile: Bruto #2 inmóvil. Zyren disolvió el primero.',
      ],
      highlight: '',
    },
    {
      chapter: 3, order: 2,
      title: 'Acto II — Zyren como oponente',
      body: [
        'Zyren se curó, se puso en el centro de la arena. <em>"¿Están para un desafío más complicado?"</em> El grupo aceptó.',
        'Round 1: Rac golpeó fuerte — 12 de daño. Tyrell lo siguió con su espada brillando — 8 de daño radiante. Esdas tiró Ray of Frost: apenas 1 de daño, pero Zyren sonrió contento. Zyren golpeó a Rac en el pecho, aflojando el golpe deliberadamente.',
        'Round 2: Rac volvió a golpear con toda su fuerza — 16 de daño, rompió la armadura de madera de Zyren. <em>"Muy bien, querido Bárbaro."</em> Entonces Zyren se transformó en forma híbrida León/Águila y corrió hacia Esdas. El grito de pánico de Esdas generó una <strong style="color:var(--gold)">onda arcana involuntaria — Tasha\'s Hideous Laughter.</strong> Zyren frenó un instante sorprendido. Luego aplastó a Esdas contra el piso. Esdas se desmayó del miedo. Un zarpazo noqueó a Tyrell. Rac quedó con 1 HP.',
        'Round 3: Relyo intentó golpear con el báculo de costado. Zyren volvió a forma élfica, generó armadura de madera, y noqueó a Relyo con calma.',
      ],
      highlight: 'El grupo le hizo 37 de daño a Zyren de 110 HP en entrenamiento controlado. Zyren los limpió en dos rondas sin esfuerzo real — deliberadamente.',
    },
    {
      chapter: 3, order: 3,
      title: 'Acto III — Lo que nació en la arena',
      body: [
        'Esdas se despertó. Nadie lo miraba. En silencio, concentró su magia y usó una mano arcana invisible para chequearse discretamente los pantalones. <strong style="color:var(--gold)">Aprendió Mage Hand.</strong> Primer uso: verificar si se había pillado de miedo.',
        'Spells que Esdas dominaba al cierre de la sesión: Firebolt (cantrip, S1), impulso telequinético (narrativo, S1), Ray of Frost (cantrip, S3), Tasha\'s Hideous Laughter (Nv1, S3 — involuntario), Magic Missile (Nv1, S3), Mage Hand (cantrip, S3).',
        'Inmediatamente después del entrenamiento, el grupo subió a <strong style="color:var(--gold)">Nivel 3.</strong> HP: Rac 27 · Tyrell 21 · Relyo 16 · Boyd 15 · Esdas 12. Subclases pendientes de definir antes de la próxima sesión.',
        'Zyren: <em>"Volvamos a la plataforma donde estaban así nos agrupamos de nuevo con Nira y Boyd."</em>',
      ],
      highlight: 'La magia de Esdas no nace del estudio — nace de las emociones. INT 17, pero el poder lo desborda.',
    },
  ];

  await StoryAct.deleteMany({ chapter: 3 });
  await StoryAct.insertMany(actsS3);
  console.log(`  ✓ ${actsS3.length} actos de Capítulo 3 insertados`);

  // ─────────────────────────────────────────────────────────────────
  // DONE
  // ─────────────────────────────────────────────────────────────────
  console.log('\n✅ Todo actualizado correctamente.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
