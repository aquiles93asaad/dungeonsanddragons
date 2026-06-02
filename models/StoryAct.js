const { Schema, model } = require('mongoose');

const StoryActSchema = new Schema({
  chapter:   { type: Number, required: true }, // referencia al número de capítulo
  order:     { type: Number, required: true }, // posición dentro del capítulo (1, 2, 3...)
  title:     { type: String, required: true }, // "Acto I — Despertar en el barco..."
  body:      [String],                          // array de párrafos (HTML permitido)
  highlight: { type: String, default: '' },     // frase destacada opcional
}, { timestamps: true });

// índice compuesto para ordenar fácil
StoryActSchema.index({ chapter: 1, order: 1 });

module.exports = model('StoryAct', StoryActSchema);
