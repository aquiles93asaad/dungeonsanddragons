const { Schema, model } = require('mongoose');

const PlayerSchema = new Schema({
  username:     { type: String, required: true, unique: true },
  characterId:  { type: String, required: true }, // 'rac', 'relyo', etc.
  accessToken:  { type: String, required: true, unique: true },
  privateNotes: { type: String, default: '' },
}, { timestamps: true });

module.exports = model('Player', PlayerSchema);
