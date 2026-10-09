import { Router } from 'express';
import mongoose from 'mongoose';
import Note from '../models/Note.js';

const router = Router();
const editableFields = ['title', 'content', 'color', 'pinned'];

function readNoteFields(body) {
  return Object.fromEntries(
    editableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]),
  );
}

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.pinned === 'true') filter.pinned = true;

  const notes = await Note.find(filter).sort({ updatedAt: -1 }).lean();
  res.json(notes);
});

router.post('/', async (req, res) => {
  const note = await Note.create(readNoteFields(req.body ?? {}));
  res.status(201).json(note);
});

router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid note id.' });
  }

  const note = await Note.findByIdAndUpdate(
    req.params.id,
    { $set: readNoteFields(req.body ?? {}) },
    { new: true, runValidators: true },
  );

  if (!note) return res.status(404).json({ message: 'Note not found.' });
  res.json(note);
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid note id.' });
  }

  const note = await Note.findByIdAndDelete(req.params.id);
  if (!note) return res.status(404).json({ message: 'Note not found.' });
  res.status(204).end();
});

export default router;
