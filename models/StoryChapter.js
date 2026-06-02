const { Schema, model } = require('mongoose');

const StoryChapterSchema = new Schema({
  number: { type: Number, required: true, unique: true },
  title:  { type: String, default: '' }, // el DM puede nombrar el capítulo o dejarlo vacío
}, { timestamps: true });

module.exports = model('StoryChapter', StoryChapterSchema);
