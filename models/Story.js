const { Schema, model } = require('mongoose');

// Documento único — siempre se lee/escribe el mismo (_id fijo)
const StorySchema = new Schema({
  content: { type: String, default: '' }, // resumen de historia escrito por el DM
}, { timestamps: true });

module.exports = model('Story', StorySchema);
