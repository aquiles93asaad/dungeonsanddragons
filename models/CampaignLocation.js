const { Schema, model } = require('mongoose');

const CampaignLocationSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  name:        String,
  description: String,
  state:       String,
  parentId:    { type: String, default: null }, // lugar que lo contiene (ej: la taverna → Solmira)
  order:       { type: Number, default: 0 },
}, { timestamps: true });

module.exports = model('CampaignLocation', CampaignLocationSchema);
