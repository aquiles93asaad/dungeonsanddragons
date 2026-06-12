const { Schema, model } = require('mongoose');

const CampaignThreadSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  name:        String,
  status:      { type: String, default: 'dormant' }, // 'active' | 'emerging' | 'dormant' | 'resolved'
  description: String,
  characters:  [String],
  order:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = model('CampaignThread', CampaignThreadSchema);
