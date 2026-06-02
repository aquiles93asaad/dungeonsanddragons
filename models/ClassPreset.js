const { Schema, model } = require('mongoose');

// Schema flexible — la estructura interna de cada personaje es compleja
// y varía (spells, resources, levelFeatures, cantripsData, etc.)
const ClassPresetSchema = new Schema({
  charId:    { type: String, required: true, unique: true }, // 'rac', 'relyo', etc.
  data:      { type: Schema.Types.Mixed, required: true },   // el objeto completo del personaje
}, { timestamps: true });

module.exports = model('ClassPreset', ClassPresetSchema);
