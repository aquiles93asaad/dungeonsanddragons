const { Schema, model } = require('mongoose');

const NoteSchema = new Schema({
  ts:       { type: Date, default: Date.now },
  type:     String, // 'combat' | 'narrative' | 'loot' | 'rest' | 'note'
  text:     String,
  data:     { type: Schema.Types.Mixed }, // datos extra opcionales
}, { _id: false });

const SessionSchema = new Schema({
  number:  { type: Number, required: true, unique: true },
  date:    Date,
  title:   String,
  notes:   [NoteSchema], // stream completo de la sesión live
}, { timestamps: true });

module.exports = model('Session', SessionSchema);
