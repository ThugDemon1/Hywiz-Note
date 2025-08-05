import express from 'express';
import Note from '../models/Note.js';
import Notebook from '../models/Notebook.js';
import Tag from '../models/Tag.js';
import auth from '../middleware/auth.js';
import SavedSearch from '../models/SavedSearch.js';

const router = express.Router();

// Search across all content
router.get('/', auth, async (req, res) => {
  try {
    const { 
      q: query, 
      type = 'all',
      notebook,
      tags,
      dateFrom,
      dateTo,
      hasAttachments,

      page = 1,
      limit = 20
    } = req.query;

    if (!query || query.trim().length === 0) {
      return res.json({
        notes: [],
        notebooks: [],
        tags: [],
        total: 0
      });
    }

    const results = {};

    // Search notes
    if (type === 'all' || type === 'notes') {
      const noteQuery = {
        userId: req.userId,
        isDeleted: false,
        $text: { $search: query }
      };

      // Apply filters
      if (notebook) noteQuery.primaryNotebookId = notebook;
      if (tags) noteQuery.tags = { $in: tags.split(',') };
      if (dateFrom || dateTo) {
        noteQuery.createdAt = {};
        if (dateFrom) noteQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) noteQuery.createdAt.$lte = new Date(dateTo);
      }
      if (hasAttachments === 'true') {
        noteQuery['attachments.0'] = { $exists: true };
      }


      let notes = await Note.find(noteQuery, { score: { $meta: 'textScore' } })
        .populate('primaryNotebookId', 'name color')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      let notesTotal = await Note.countDocuments(noteQuery);

      // Fallback to regex if no results
      if (notes.length === 0) {
        const regex = new RegExp(query, 'i');
        const regexQuery = {
          userId: req.userId,
          isDeleted: false,
          $or: [
            { title: regex },
            { content: regex },
            { plainTextContent: regex }
          ]
        };
        if (notebook) regexQuery.primaryNotebookId = notebook;
        if (tags) regexQuery.tags = { $in: tags.split(',') };
        if (dateFrom || dateTo) {
          regexQuery.createdAt = {};
          if (dateFrom) regexQuery.createdAt.$gte = new Date(dateFrom);
          if (dateTo) regexQuery.createdAt.$lte = new Date(dateTo);
        }
        if (hasAttachments === 'true') {
          regexQuery['attachments.0'] = { $exists: true };
        }

        notes = await Note.find(regexQuery)
          .populate('primaryNotebookId', 'name color')
          .limit(limit * 1)
          .skip((page - 1) * limit);
        notesTotal = await Note.countDocuments(regexQuery);
      }

      results.notes = notes;
      results.notesTotal = notesTotal;
    }

    // Search notebooks
    if (type === 'all' || type === 'notebooks') {
      const notebooks = await Notebook.find({
        userId: req.userId,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }).limit(10);

      results.notebooks = notebooks;
    }

    // Search tags
    if (type === 'all' || type === 'tags') {
      const tags = await Tag.find({
        userId: req.userId,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }).limit(10);

      results.tags = tags;
    }

    // Calculate total results
    results.total = (results.notes?.length || 0) + 
                   (results.notebooks?.length || 0) + 
                   (results.tags?.length || 0);

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get search suggestions
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const suggestions = [];

    // Get recent note titles
    const recentNotes = await Note.find({
      userId: req.userId,
      isDeleted: false,
      title: { $regex: query, $options: 'i' }
    })
      .select('title')
      .sort({ lastViewedAt: -1 })
      .limit(5);

    suggestions.push(...recentNotes.map(note => ({
      type: 'note',
      text: note.title,
      id: note._id
    })));

    // Get matching tags
    const matchingTags = await Tag.find({
      userId: req.userId,
      name: { $regex: query, $options: 'i' }
    })
      .select('name')
      .limit(5);

    suggestions.push(...matchingTags.map(tag => ({
      type: 'tag',
      text: tag.name,
      id: tag._id
    })));

    // Get matching notebooks
    const matchingNotebooks = await Notebook.find({
      userId: req.userId,
      name: { $regex: query, $options: 'i' }
    })
      .select('name')
      .limit(3);

    suggestions.push(...matchingNotebooks.map(notebook => ({
      type: 'notebook',
      text: notebook.name,
      id: notebook._id
    })));

    res.json(suggestions.slice(0, 10));
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save search query
router.post('/save', auth, async (req, res) => {
  try {
    const { query, filters } = req.body;

    // This could be expanded to save search history
    // For now, just return success
    res.json({ message: 'Search saved' });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Saved Searches CRUD
// Get all saved searches
router.get('/saved-searches', auth, async (req, res) => {
  try {
    const searches = await SavedSearch.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(searches);
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create saved search
router.post('/saved-searches', auth, async (req, res) => {
  try {
    const { name, query, filters } = req.body;
    const saved = await SavedSearch.create({ userId: req.userId, name, query, filters });
    res.status(201).json(saved);
  } catch (error) {
    console.error('Create saved search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update saved search
router.put('/saved-searches/:id', auth, async (req, res) => {
  try {
    const { name, query, filters } = req.body;
    const updated = await SavedSearch.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, query, filters },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Saved search not found' });
    res.json(updated);
  } catch (error) {
    console.error('Update saved search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete saved search
router.delete('/saved-searches/:id', auth, async (req, res) => {
  try {
    const deleted = await SavedSearch.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ message: 'Saved search not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;