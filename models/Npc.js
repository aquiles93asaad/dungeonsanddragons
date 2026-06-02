const { Schema, model } = require('mongoose');

const NpcSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  name:        String,
  icon:        String,
  faction:     String,
  role:        String,
  status:      String,
  statusLabel: String,
  desc:        String,
  extra:       String,
}, { timestamps: true });

module.exports = model('Npc', NpcSchema);
