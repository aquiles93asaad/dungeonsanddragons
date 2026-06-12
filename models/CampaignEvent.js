const { Schema, model } = require('mongoose');

const CampaignEventSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  title:       String,
  status:      { type: String, default: 'planned' }, // 'planned' | 'done'
  session:     String,
  description: String,
  order:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = model('CampaignEvent', CampaignEventSchema);
