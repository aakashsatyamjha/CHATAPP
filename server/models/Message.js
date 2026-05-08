const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
