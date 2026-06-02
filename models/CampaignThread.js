const { Schema, model } = require('mongoose');

const CampaignThreadSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  name:        String,
  status:      { type: String, default: 'dormant' }, // 'active' | 'emerging' | 'dormant' | 'resolved'
  description: String,
  characters:  [String],
}, { timestamps: true });

module.exports = model('CampaignThread', CampaignThreadSchema);
