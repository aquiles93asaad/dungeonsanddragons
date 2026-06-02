const { Schema, model } = require('mongoose');

const CampaignEventSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  title:       String,
  status:      { type: String, default: 'planned' }, // 'planned' | 'done'
  session:     String,
  description: String,
}, { timestamps: true });

module.exports = model('CampaignEvent', CampaignEventSchema);
