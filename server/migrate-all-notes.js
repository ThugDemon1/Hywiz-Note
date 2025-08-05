// Migration script to generate and store canonical Yjs updates for all notes
// Run with: node server/migrate-all-notes.js

import mongoose from 'mongoose';
import Note from './models/Note.js';
import * as Y from 'yjs';
import { Buffer } from 'buffer';
import { htmlToProseMirrorJSON } from './utils/htmlToProseMirrorJSON.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/your-db-name';

const migrateAllNotes = async () => {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const notes = await Note.find({});
  let updated = 0;
  let skipped = 0;
  for (const note of notes) {
    if (note.yjsUpdate) {
      skipped++;
      continue;
    }
    try {
      const ydoc = new Y.Doc();
      const yXml = ydoc.getXmlFragment('prosemirror');
      let pmJson;
      if (note.content) {
        pmJson = htmlToProseMirrorJSON(note.content);
        yXml.insert(0, pmJson.content);
      }
      note.yjsUpdate = Buffer.from(Y.encodeStateAsUpdate(ydoc));
      await note.save();
      updated++;
      console.log(`[MIGRATE] Updated note ${note._id}`);
    } catch (e) {
      console.error(`[MIGRATE] Failed for note ${note._id}:`, e);
    }
  }
  console.log(`Migration complete. Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
};

// Add a one-time migration to fix missing noteId fields
const fixMissingNoteIds = async () => {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const notes = await Note.find({ $or: [ { noteId: { $exists: false } }, { noteId: null } ] });
  let updated = 0;
  for (const note of notes) {
    note.noteId = note._id.toString();
    await note.save();
    updated++;
    console.log(`[FIX] Set noteId for note ${note._id}`);
  }
  console.log(`NoteId fix complete. Updated: ${updated}`);
  await mongoose.disconnect();
};

export default migrateAllNotes;

// If run directly, execute the migration
if (process.argv[1] === new URL(import.meta.url).pathname) {
  migrateAllNotes();
}

// Run this fix if called directly
if (process.argv[2] === '--fix-noteids') {
  fixMissingNoteIds();
} 