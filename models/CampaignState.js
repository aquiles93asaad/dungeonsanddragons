const { Schema, model } = require('mongoose');

// Documento único — estado dinámico del juego en tiempo real
// HP, recursos, spell slots usados, condiciones activas, etc.
const CampaignStateSchema = new Schema({
  characters: { type: Schema.Types.Mixed, default: {} },
  // estructura: { rac: { hp, resources: {rage:2}, spellSlots: {1:2}, conditions:[] }, ... }

  combat: { type: Schema.Types.Mixed, default: null },
  // estado del combate activo (null si no hay combate)

  money: { type: Schema.Types.Mixed, default: {} },
  // { group: {cp,sp,gp,pp}, rac: {cp,sp,gp,pp}, ... }

  misc: { type: Schema.Types.Mixed, default: {} },
  // cualquier clave extra de localStorage que no encaje en otra colección

  wildShapeForms: { type: [Schema.Types.Mixed], default: [] },
  // formas salvajes custom agregadas por el DM (las base vienen del preset de Boyd)
}, { timestamps: true });

module.exports = model('CampaignState', CampaignStateSchema);
