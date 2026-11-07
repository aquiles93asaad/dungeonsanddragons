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
  locationIds: [String], // lugares donde se lo puede encontrar (CampaignLocation.id)
}, { timestamps: true });

module.exports = model('Npc', NpcSchema);
