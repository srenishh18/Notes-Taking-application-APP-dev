import test from 'node:test';
import assert from 'node:assert/strict';
import Note from './models/Note.js';
import sampleNotes from './sampleNotes.js';

test('note schema supplies defaults and timestamps', () => {
  const note = new Note({ title: '  A quick thought  ' });

  assert.equal(note.title, 'A quick thought');
  assert.equal(note.content, '');
  assert.equal(note.color, 'butter');
  assert.equal(note.pinned, false);
  assert.equal(Note.schema.options.timestamps, true);
});

test('note schema rejects a blank title and unsupported colors', () => {
  const note = new Note({ title: '  ', color: 'neon' });
  const error = note.validateSync();

  assert.ok(error?.errors.title);
  assert.ok(error?.errors.color);
});

test('sample notes satisfy the note schema', () => {
  assert.equal(sampleNotes.length, 5);
  for (const sample of sampleNotes) {
    assert.equal(new Note(sample).validateSync(), undefined);
  }
});
