const { Schema, model } = require('mongoose');

const ItemSchema = new Schema({
  id:         { type: String, required: true, unique: true },
  name:       String,
  nameEs:     String,
  category:   String,
  damage:     String,
  damageType: String,
  atkStat:    String,
  dmgStat:    String,
  proficient: Boolean,
  properties: [String],
  range:      String,
  rarity:     String,
  desc:       String,
  known:      { type: Boolean, default: false },
}, { timestamps: true });

module.exports = model('Item', ItemSchema);
