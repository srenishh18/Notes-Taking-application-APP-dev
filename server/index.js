import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Note from './models/Note.js';
import notesRouter from './routes/notes.js';
import sampleNotes from './sampleNotes.js';

const app = express();
const port = Number(process.env.PORT) || 4000;
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/little-notes';

app.use(express.json({ limit: '32kb' }));
app.get('/api/health', (_req, res) => {
  res.json({ status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.use('/api/notes', (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'MongoDB is not connected. Start your local MongoDB server or check MONGODB_URI.' });
  }
  next();
}, notesRouter);

app.use((error, _req, res, _next) => {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'Request body must be valid JSON.' });
  }
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.resolve(projectRoot, '../dist');
  app.use(express.static(clientBuild));
  app.get('*splat', (_req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

function start() {
  app.listen(port, () => console.log(`Notes API listening on http://localhost:${port}`));

  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB.');
      const noteCount = await Note.countDocuments();
      if (noteCount === 0) {
        await Note.insertMany(sampleNotes);
        console.log(`Added ${sampleNotes.length} sample notes to the empty database.`);
      }
    })
    .catch((error) => console.error(`MongoDB startup failed: ${error.message}`));
}

start();
