const { Schema, model } = require('mongoose');

const MonsterSchema = new Schema({
  id:        { type: String, required: true, unique: true },
  name:      String,
  type:      String,
  size:      String,
  cr:        String,
  ac:        Number,
  hpMax:     Number,
  speed:     String,
  atk:       String,
  str: Number, dex: Number, con: Number,
  int: Number, wis: Number, cha: Number,
  desc:      String,
  attacks:   { type: Schema.Types.Mixed, default: [] },
  abilities: String,
  phases:    { type: Schema.Types.Mixed, default: [] },
  rewards:   String,
  loot:      { type: Schema.Types.Mixed, default: [] },
  notes:     String,
  hpCurrent: Number,
  showInLive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = model('Monster', MonsterSchema);
