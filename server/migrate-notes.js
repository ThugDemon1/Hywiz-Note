import mongoose from 'mongoose';
import Note from './models/Note.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateNotes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notes-app');
    console.log('Connected to MongoDB');

    // Find all notes that still have the old notebookId field
    const notes = await Note.find({ notebookId: { $exists: true } });
    console.log(`Found ${notes.length} notes to migrate`);

    for (const note of notes) {
      // Create the new structure
      const update = {
        $set: {
          primaryNotebookId: note.notebookId,
          notebookIds: [note.notebookId]
        },
        $unset: {
          notebookId: 1
        }
      };

      await Note.findByIdAndUpdate(note._id, update);
      console.log(`Migrated note: ${note._id}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateNotes(); 