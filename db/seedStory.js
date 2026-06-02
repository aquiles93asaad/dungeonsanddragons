require('dotenv').config();
const mongoose     = require('mongoose');
const StoryChapter = require('../models/StoryChapter');
const StoryAct     = require('../models/StoryAct');

const chapters = [
  { number: 1, title: '' },
  { number: 2, title: '' },
];

const acts = [
  // ── CAPÍTULO 1 ──────────────────────────────────────────────────────────
  {
    chapter: 1, order: 1,
    title: 'Acto I — Despertar en el barco y llegada a Mina Zafira',
    body: [
      'El grupo despertó en un barco acercándose al puerto de Mina Zafira. Nadie sabía por qué estaba allí. Relyo, Tyrell y Esdas se mostraron desconfiados; Rac fue más directo e impulsivo; Boyd permaneció vigilante y observador.',
      'En la taberna, Tyron el guardapuerta no los dejó entrar al verlos desarmados y sin dinero. Rac fue amable y honesto — Tyron les regaló pan. <em>Primer momento donde el mundo respondió a la conducta de los personajes.</em>',
      'Un gato blanco y negro los guió por callejones desde la taberna hasta el borde del pueblo, internándose en el bosque y desapareciendo entre los árboles.',
    ],
    highlight: '',
  },
  {
    chapter: 1, order: 2,
    title: 'Acto II — El Bosque y el Lobo Corrupto',
    body: [
      'Boyd sintió una conexión especial con el bosque. La atmósfera se volvió densa e inquietante. Apareció el primer gran enemigo: un lobo corrupto con venas verdes y líquido Fell.',
      'Rac corrió sin armas — esquivó una pata enorme y golpeó al lobo en la cara. El lobo lo derribó. Relyo intentó un ataque acrobático desde un árbol; el lobo esquivó. Relyo salvó a Esdas durante el caos. Boyd usó raíces para inmovilizar una pata. Esdas frenó mentalmente al lobo por un instante. Tyrell observó desde un árbol.',
      'Cuando el lobo iba a matar a Rac, Zyren apareció en forma híbrida (león/águila) y lo arrastró lejos. Luego volvió en forma élfica.',
      'Zyren reveló el nombre del mundo, entregó 10 monedas de plata y cuestionó a Tyrell por no proteger al grupo. Boyd percibió el espíritu del lobo agradeciendo su liberación.',
    ],
    highlight: '',
  },
  {
    chapter: 1, order: 3,
    title: 'Acto III — Regreso a Mina Zafira',
    body: [
      'Tyron los recibió recordando que habían alimentado al gato. Reynera, la innkeeper, los invitó a comer y a alojarse. Contó que su marido había sido aventurero.',
      'Tyrell juró proteger la taberna y a Reynera. Cada personaje procesó la noche a su manera: Boyd reflexionó sobre el lobo, Relyo meditó, Rac habló con Ati, Tyrell sintió vergüenza y reconexión con la luz, Esdas sintió impotencia y deuda hacia Relyo.',
    ],
    highlight: '',
  },
  {
    chapter: 1, order: 4,
    title: 'Acto IV — Equipo en Mina Zafira',
    body: [
      'Smith (herrero): le simpatizó Rac, prometió descuento futuro. Se enemistó con Esdas por falta de respeto. Farandon (armero): equipó a todo el grupo con ~8 monedas de plata.',
    ],
    highlight: '',
  },

  // ── CAPÍTULO 2 ──────────────────────────────────────────────────────────
  {
    chapter: 2, order: 1,
    title: 'Acto V — Entierro del lobo y promesa de Zyren',
    body: [
      'El grupo volvió al lobo, retiró piel/pelo/colmillos y lo enterró para honrarlo. Tyrell oró. Zyren reapareció: llevará los materiales y los esperará en Aether Grove con algo útil.',
    ],
    highlight: '',
  },
  {
    chapter: 2, order: 2,
    title: 'Acto VI — Entrenamiento e introspección',
    body: [
      'Boyd, Tyrell y Rac practicaron sinergia táctica (raíces + escudo + hacha). Relyo meditó. Esdas se conectó con el agua en una cascada como foco de magia. Fue el único en bañarse.',
    ],
    highlight: '',
  },
  {
    chapter: 2, order: 3,
    title: 'Acto VII — La Madre Araña',
    body: [
      'El camino se perdió de noche. Apareció la Madre Araña corrupta con sus spiderlings. Rac atacó directo. Esdas sintió fuego en sus manos — la araña lo apuntó con veneno. Tyrell se interpuso con su escudo.',
      'Un spiderling saltó al pecho de Rac; otro al hombro/cuello de Esdas. Tyrell tiró crítico: golpeó el escudo contra el suelo y despertó un <strong style="color:var(--gold)">aura de luz</strong> que repelió las arañas y destruyó varios spiderlings.',
      'Esdas lanzó Firebolt — <strong style="color:var(--gold)">20 natural</strong>. La araña quedó girando. Relyo, desde el árbol, sintió el punto vulnerable y ejecutó su golpe de monje aéreo, arrancando el corazón de la Madre Araña.',
    ],
    highlight: '',
  },
  {
    chapter: 2, order: 4,
    title: 'Acto VIII — Veneno Fell y aparición de Nira',
    body: [
      'Rac y Esdas cayeron intoxicados por veneno Fell. Boyd y Tyrell no pudieron purgarlo. Una pantera negra se acercó — se transformó en <strong style="color:var(--gold)">Nira</strong>: elfa de piel oscura, elegante y sigilosa.',
      'Nira purgó el veneno con magia de naturaleza. En Rac llegaba hasta el brazo izquierdo; en Esdas subía por el hombro/cuello. Quedaron cicatrices. Nira dijo que Zyren la envió y que sin él "ya no serían los mismos".',
      'Nira los invitó a seguirla hacia Aether Grove. <em>Fin de la Sesión 1.</em>',
    ],
    highlight: 'El Fell no solo mata — transforma.',
  },
];

async function seedStory() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado. Seeding historia...\n');

  await StoryChapter.deleteMany({});
  await StoryChapter.insertMany(chapters);
  console.log(`✓ Capítulos: ${chapters.length}`);

  await StoryAct.deleteMany({});
  await StoryAct.insertMany(acts);
  console.log(`✓ Actos: ${acts.length}`);

  console.log('\n✅ Historia seedeada.');
  await mongoose.disconnect();
}

seedStory().catch(err => {
  console.error(err);
  process.exit(1);
});
