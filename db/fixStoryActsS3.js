/**
 * fixStoryActsS3.js — Reescribe los actos del Capítulo 3 sin números mecánicos.
 * Corre UNA VEZ: node db/fixStoryActsS3.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const StoryAct  = require('../models/StoryAct');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Conectado\n');

  await StoryAct.deleteMany({ chapter: 3 });

  const acts = [
    {
      chapter: 3, order: 1,
      title: 'Acto I — La arena y los Brutos de Madera',
      body: [
        'Boyd entrenó con Nira por separado. Zyren llevó al resto a la arena de entrenamiento: una plataforma circular enorme con una sola entrada, marcada por garras, cortes y zonas quemadas de usos anteriores.',
        'Zyren levantó los brazos y creó dos constructos de madera enormes. <em>"Me parece que fue demasiado el golpe de antes para ustedes. Levántense y sigan peleando."</em>',
        'Esdas lanzó un Firebolt que impactó con toda su fuerza en la pierna de uno de los brutos — quedó temblando. Relyo golpeó al otro de codo y en ese momento sintió algo que no había sentido antes con control: pudo ver los puntos vitales del oponente, saber exactamente dónde concentraba su energía. <strong style="color:var(--gold)">Primer uso consciente del Ki en combate real.</strong>',
        'Uno de los brutos barrió con su tronco a todo el frente de una vez, dejando a varios en el suelo. Zyren intervino y los curó a todos antes de que el combate siguiera.',
        'Tyrell, en lugar de atacar, eligió proteger a Rac con Shield of Faith — primer spell de soporte lanzado conscientemente en mesa. Eligió escudar antes que golpear.',
        'El combate cerró con Esdas rematando al bruto caído con Magic Missile, y Tyrell descargando un golpe cargado de luz radiante que empujó al otro hacia atrás con fuerza de trueno. Relyo, en un momento de distracción, lanzó su báculo al aire para golpear y se le cayó. Zyren disolvió al segundo bruto.',
      ],
      highlight: '',
    },
    {
      chapter: 3, order: 2,
      title: 'Acto II — Zyren como oponente',
      body: [
        'Zyren se curó, se puso en el centro de la arena y les preguntó si estaban para un desafío más complicado. El grupo aceptó.',
        'Rac fue el primero en golpear — con toda su fuerza, sin dudar. Tyrell lo siguió con su espada, que brilló al impactar. Esdas intentó con Ray of Frost pero apenas lo rozó. Zyren sonrió, contento.',
        'Rac volvió a golpear aún más fuerte y rompió la armadura de madera que Zyren había generado. <em>"Muy bien, querido Bárbaro."</em> Entonces Zyren se transformó en forma híbrida León/Águila y corrió directamente hacia Esdas.',
        'El grito de pánico de Esdas al ver la forma híbrida corriendo hacia él generó algo inesperado: una <strong style="color:var(--gold)">onda arcana involuntaria que frenó a Zyren un instante</strong> — Tasha\'s Hideous Laughter, sin haberlo elegido, sin saber cómo. Zyren se sorprendió. Luego aplastó a Esdas contra el piso. <strong>Esdas se desmayó del miedo.</strong>',
        'Un zarpazo de garra noqueó a Tyrell. Relyo intentó golpear con el báculo con toda su fuerza — Zyren volvió a forma élfica, generó armadura de madera, y lo dejó noqueado con calma.',
      ],
      highlight: 'Zyren los limpió sin esfuerzo real — deliberadamente los dejó golpearlo para que aprendieran. La diferencia de poder quedó clara sin ser humillante.',
    },
    {
      chapter: 3, order: 3,
      title: 'Acto III — Lo que nació en la arena',
      body: [
        'Esdas se despertó. Nadie lo miraba. En silencio, concentró su magia y usó una mano arcana invisible para chequearse discretamente los pantalones. <strong style="color:var(--gold)">Aprendió Mage Hand.</strong> Primer uso: verificar si se había pillado de miedo.',
        'El patrón quedó confirmado esa sesión: la magia de Esdas no nace del estudio. Nace del pánico, de la vergüenza, de la desesperación. Su intelecto es enorme, pero el poder lo desborda emocionalmente — siempre llega antes de que lo llame.',
        'Inmediatamente después del entrenamiento, el grupo subió a <strong style="color:var(--gold)">Nivel 3.</strong> Zyren los reunió para volver a la plataforma principal con Nira y Boyd.',
      ],
      highlight: '',
    },
  ];

  await StoryAct.insertMany(acts);
  console.log(`✓ ${acts.length} actos del Capítulo 3 reescritos sin números mecánicos.`);

  // Agregar la regla también al Chapter 2 donde hay menciones de dados (Acto I)
  // El Acto I del cap 2 no tiene números mecánicos relevantes, así que solo cap 3.

  await mongoose.disconnect();
  console.log('✅ Listo.');
}

run().catch(err => { console.error(err); process.exit(1); });
