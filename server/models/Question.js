const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['user', 'generated'], default: 'user' },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);