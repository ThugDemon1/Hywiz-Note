import express from 'express';
import Tag from '../models/Tag.js';
import Note from '../models/Note.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all tags
router.get('/', auth, async (req, res) => {
  try {
    const tags = await Tag.find({ userId: req.userId })
      .sort({ noteCount: -1, name: 1 });

    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create tag
router.post('/', auth, async (req, res) => {
  try {
    const { name, color, description } = req.body;

    const existingTag = await Tag.findOne({
      name: name.toLowerCase(),
      userId: req.userId
    });

    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists' });
    }

    const tag = new Tag({
      name: name.toLowerCase(),
      userId: req.userId,
      color: color || '#10B981',
      description: description || ''
    });

    await tag.save();
    // Emit real-time update
    req.io.emit('tag-created', { tag, userId: req.userId });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update tag
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, color, description } = req.body;

    const tag = await Tag.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    const oldName = tag.name;

    // Update fields
    if (name !== undefined) tag.name = name.toLowerCase();
    if (color !== undefined) tag.color = color;
    if (description !== undefined) tag.description = description;

    await tag.save();
    // Emit real-time update
    req.io.emit('tag-updated', { tag, userId: req.userId });

    // Update tag name in all notes if name changed
    if (name && name.toLowerCase() !== oldName) {
      await Note.updateMany(
        { userId: req.userId, tags: oldName },
        { $set: { "tags.$": name.toLowerCase() } }
      );
    }

    res.json(tag);
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete tag
router.delete('/:id', auth, async (req, res) => {
  try {
    const tag = await Tag.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // Remove tag from all notes
    await Note.updateMany(
      { userId: req.userId, tags: tag.name },
      { $pull: { tags: tag.name } }
    );

    await Tag.findByIdAndDelete(req.params.id);
    // Emit real-time update
    req.io.emit('tag-deleted', { tagId: req.params.id, userId: req.userId });

    res.json({ message: 'Tag deleted' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notes with specific tag
router.get('/:name/notes', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    const tagName = req.params.name.toLowerCase();

    const notes = await Note.find({
      userId: req.userId,
      tags: tagName,
      isDeleted: false
    })
      .populate('notebookId', 'name color')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Note.countDocuments({
      userId: req.userId,
      tags: tagName,
      isDeleted: false
    });

    res.json({
      tag: tagName,
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tag notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update tag counts (utility endpoint)
router.post('/update-counts', auth, async (req, res) => {
  try {
    const tags = await Tag.find({ userId: req.userId });

    for (const tag of tags) {
      const count = await Note.countDocuments({
        userId: req.userId,
        tags: tag.name,
        isDeleted: false
      });
      tag.noteCount = count;
      await tag.save();
    }

    res.json({ message: 'Tag counts updated' });
  } catch (error) {
    console.error('Update tag counts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;