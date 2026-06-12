require('dotenv').config();
const mongoose = require('mongoose');
const Session = require('../models/Session');

mongoose.connect(process.env.MONGO_URI).then(async () => {

  // Sesión 2 — 29 de mayo
  await Session.findOneAndUpdate(
    { number: 2 },
    { $set: { date: new Date('2026-05-29') } }
  );
  console.log('✓ S2 fecha → 29/05/2026');

  // Sesión 3 — 5 de junio
  await Session.findOneAndUpdate(
    { number: 3 },
    { $set: { date: new Date('2026-06-05') } }
  );
  console.log('✓ S3 fecha → 05/06/2026');

  // Sesión 1 — 15 de mayo, con notas basadas en los StoryActs del Chapter 1
  const s1Notes = [
    {
      ts: new Date('2026-05-15T20:00:00'),
      type: 'narrative',
      text: 'El grupo despertó en un barco acercándose al puerto de Mina Zafira. Nadie sabía por qué estaba allí. En la taberna, Tyron el guardapuerta no los dejó entrar al verlos desarmados y sin dinero. Rac fue amable y honesto — Tyron les regaló pan. Un gato blanco y negro los guió por callejones desde la taberna hasta el borde del pueblo, internándose en el bosque.',
    },
    {
      ts: new Date('2026-05-15T20:30:00'),
      type: 'narrative',
      text: 'Boyd sintió una conexión especial con el bosque. Apareció el primer gran enemigo: un lobo corrupto con venas verdes y líquido Fell. Rac corrió sin armas y golpeó al lobo; Relyo salvó a Esdas durante el caos; Boyd usó raíces para inmovilizar una pata; Esdas frenó mentalmente al lobo. Cuando el lobo iba a matar a Rac, Zyren apareció en forma híbrida (león/águila) y lo arrastró lejos. Boyd percibió el espíritu del lobo agradeciendo su liberación.',
    },
    {
      ts: new Date('2026-05-15T21:00:00'),
      type: 'narrative',
      text: 'Zyren reveló el nombre del mundo, entregó 10 monedas de plata y cuestionó a Tyrell por no proteger al grupo. Regresaron a Mina Zafira. Reynera los invitó a comer y alojarse. Tyrell juró proteger la taberna y a Reynera. Cada personaje procesó la noche a su manera.',
    },
    {
      ts: new Date('2026-05-15T21:30:00'),
      type: 'narrative',
      text: 'Al día siguiente compraron equipo: Smith (herrero) simpatizó con Rac y prometió descuento futuro, pero se enemistó con Esdas. Farandon (armero) equipó a todo el grupo. Luego salieron hacia el bosque donde encontraron la Araña Madre Corrupta. Zyren usó su katana en forma de luz para el golpe final. Nira apareció tras el combate y curó a todos.',
    },
  ];

  await Session.findOneAndUpdate(
    { number: 1 },
    {
      $set: {
        number: 1,
        title: 'Mina Zafira — El despertar',
        date: new Date('2026-05-15'),
        notes: s1Notes,
      }
    },
    { upsert: true }
  );
  console.log('✓ S1 creada → 15/05/2026 con 4 notas narrativas');

  mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
