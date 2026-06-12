const { Schema, model } = require('mongoose');

const CampaignLocationSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  name:        String,
  description: String,
  state:       String,
  order:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = model('CampaignLocation', CampaignLocationSchema);
