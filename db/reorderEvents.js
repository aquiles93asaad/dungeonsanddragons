require('dotenv').config();
const mongoose = require('mongoose');
const CampaignEvent = require('../models/CampaignEvent');

const ORDER = [
  { id: 'evt-mina-zafira' },
  { id: 'evt-zyren-gato' },
  { id: 'evt-lobo-corrupto' },
  { id: 'evt-dialogos-zyren' },
  { id: 'evt-regreso-mina' },
  { id: 'evt-arana-madre' },
  { id: 'evt-aparicion-nira' },
  { id: 'evt-relyo-intenta-sanar' },
  { id: 'evt-camino-grove-boyd-nira' },
  { id: 'evt-aether-grove' },
  { id: 'evt-sakura-aparece' },
  { id: 'evt-isis-pozo' },
  { id: 'evt-isis-boyd-noche' },
  { id: 'evt-nira-sanacion-boyd' },
  { id: 'evt-entrenamiento-brutos' },
  { id: 'evt-combate-zyren' },
  { id: 'evt-esdas-mage-hand' },
  { id: 'evt-subida-nivel-3' },
  { id: 'evt-mision-zyren-solmira' },
  { id: 'evt-sirvientes-fell',       session: '4' },
  { id: 'evt-revelacion-comandante', session: '4' },
  { id: 'evt-zyren-nira-se-van',     session: '4' },
  { id: 'evt-bandidos-camino',       session: '4', title: 'Encuentro 4 — Bandidos del camino' },
  { id: 'evt-llegada-solmira',       session: '4' },
  { id: 'evt-escuela-magos',         session: '4' },
  { id: 'evt-pip-mila',              session: '4' },
  { id: 'evt-aela-precio-info',      session: '4' },
  { id: 'evt-barek-cara-amigable',   session: '4' },
  { id: 'evt-caeron-frio',           session: '4' },
  { id: 'evt-sura-fell-lord',        session: '4' },
  { id: 'evt-ataque-solmira',        session: '4', title: 'Encuentro 5 — Ataque a Solmira' },
  { id: 'evt-zael-dormido',          session: '4', newId: 'evt-zael', title: 'Encuentro con Zael' },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Conectado. Aplicando cambios...\n');
  let ok = 0, err = 0;

  for (let i = 0; i < ORDER.length; i++) {
    const { id, newId, title, session } = ORDER[i];
    const update = { order: i };
    if (title)   update.title   = title;
    if (session) update.session = session;
    if (newId)   update.id      = newId;

    const doc = await CampaignEvent.findOneAndUpdate({ id }, { $set: update }, { new: true });
    if (doc) {
      console.log(`✓ [${i.toString().padStart(2)}] ${(newId||id).padEnd(32)} order=${i}${title?' title='+title:''}${session?' ses='+session:''}`);
      ok++;
    } else {
      console.log(`✗ [${i.toString().padStart(2)}] NOT FOUND: ${id}`);
      err++;
    }
  }

  console.log(`\nDone: ${ok} actualizados, ${err} no encontrados.`);
  mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
