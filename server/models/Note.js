const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: String, default: 'User' },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);