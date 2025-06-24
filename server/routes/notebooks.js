import express from 'express';
import Notebook from '../models/Notebook.js';
import Note from '../models/Note.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all notebooks
router.get('/', auth, async (req, res) => {
  try {
    const notebooks = await Notebook.find({ userId: req.userId })
      .sort({ isDefault: -1, createdAt: -1 });

    res.json(notebooks);
  } catch (error) {
    console.error('Get notebooks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single notebook
router.get('/:id', auth, async (req, res) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    res.json(notebook);
  } catch (error) {
    console.error('Get notebook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notebook
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, color, icon, isDefault } = req.body;

    const notebook = new Notebook({
      name,
      description: description || '',
      userId: req.userId,
      color: color || '#3B82F6',
      icon: icon || 'book',
      isDefault: isDefault || false
    });

    await notebook.save();

    res.status(201).json(notebook);
  } catch (error) {
    console.error('Create notebook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update notebook
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, color, icon, isDefault, coverImage } = req.body;

    const notebook = await Notebook.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    // Update fields
    if (name !== undefined) notebook.name = name;
    if (description !== undefined) notebook.description = description;
    if (color !== undefined) notebook.color = color;
    if (icon !== undefined) notebook.icon = icon;
    if (isDefault !== undefined) notebook.isDefault = isDefault;
    if (coverImage !== undefined) notebook.coverImage = coverImage;

    await notebook.save();

    res.json(notebook);
  } catch (error) {
    console.error('Update notebook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notebook
router.delete('/:id', auth, async (req, res) => {
  try {
    const notebook = await Notebook.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    if (notebook.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default notebook' });
    }

    // Move all notes to default notebook
    const defaultNotebook = await Notebook.findOne({
      userId: req.userId,
      isDefault: true
    });

    if (defaultNotebook) {
      await Note.updateMany(
        { notebookId: req.params.id },
        { notebookId: defaultNotebook._id }
      );

      // Update note counts
      const noteCount = await Note.countDocuments({ notebookId: req.params.id });
      defaultNotebook.noteCount += noteCount;
      await defaultNotebook.save();
    }

    await Notebook.findByIdAndDelete(req.params.id);

    res.json({ message: 'Notebook deleted' });
  } catch (error) {
    console.error('Delete notebook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notes in notebook
router.get('/:id/notes', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

    const notebook = await Notebook.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notebook) {
      return res.status(404).json({ message: 'Notebook not found' });
    }

    const notes = await Note.find({
      notebookId: req.params.id,
      userId: req.userId,
      isDeleted: false
    })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Note.countDocuments({
      notebookId: req.params.id,
      userId: req.userId,
      isDeleted: false
    });

    res.json({
      notebook,
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get notebook notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;