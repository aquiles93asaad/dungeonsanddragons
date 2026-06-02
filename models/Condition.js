const { Schema, model } = require('mongoose');

const ConditionSchema = new Schema({
  id:         { type: String, required: true, unique: true },
  name:       String,
  nameEs:     String,
  icon:       String,
  color:      String,
  mechanical: { type: Schema.Types.Mixed, default: {} },
  desc:       String,
}, { timestamps: true });

module.exports = model('Condition', ConditionSchema);
