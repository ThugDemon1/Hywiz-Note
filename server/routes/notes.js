import express from 'express';
import Note from '../models/Note.js';
import Notebook from '../models/Notebook.js';
import auth from '../middleware/auth.js';
import Tag from '../models/Tag.js';
import path from 'path';
import { promises as fs } from 'fs';
import multer from 'multer';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import SharedNote from '../models/SharedNote.js';
import * as Y from 'yjs';
import { Buffer } from 'buffer';
import { htmlToProseMirrorJSON } from '../utils/htmlToProseMirrorJSON.js';

const router = express.Router();
const upload = multer({ dest: 'server/uploads/' });

// Helper function to map frontend permissions to backend permissions
const mapPermission = (frontendPermission) => {
  const mapping = {
    'view': 'read',
    'edit': 'write',
    'full': 'admin'
  };
  return mapping[frontendPermission] || 'read';
};

// Helper function to map backend permissions to frontend permissions
const mapPermissionBack = (backendPermission) => {
  const mapping = {
    'read': 'view',
    'write': 'edit',
    'admin': 'full'
  };
  return mapping[backendPermission] || 'view';
};

// Get all notes
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'updatedAt', 
      sortOrder = 'desc',
      notebook,
      tags,
      search,
      pinned,
      deleted = false
    } = req.query;

    const query = { 
      userId: req.userId,
      isDeleted: deleted === 'true'
    };

    if (notebook) query.primaryNotebookId = notebook;
    if (tags) query.tags = { $in: tags.split(',') };
    if (pinned !== undefined) query.isPinned = pinned === 'true';
    if (search) {
      query.$text = { $search: search };
    }
    // Additional filters
    if (req.query.createdFrom || req.query.createdTo) {
      query.createdAt = {};
      if (req.query.createdFrom) {
        query.createdAt.$gte = new Date(req.query.createdFrom);
      }
      if (req.query.createdTo) {
        query.createdAt.$lte = new Date(req.query.createdTo);
      }
    }

    if (req.query.hasAttachments) {
      query['attachments.0'] = { $exists: true };
    }

    const notes = await Note.find(query)
      .populate('primaryNotebookId', 'name color')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Note.countDocuments(query);

    res.json({
      notes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single note
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('primaryNotebookId', 'name color');
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const isOwner = note.userId.toString() === req.userId;
    const isCollaborator = note.collaborators && note.collaborators.some(c => c.userId.toString() === req.userId);
    const isPublicEditor = note.shareSettings?.isPublic && note.shareSettings?.allowEdit;
    if (!isOwner && !isCollaborator && !isPublicEditor) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Merge sharing/collaborator info from SharedNote
    const sharedNote = await SharedNote.findOne({ noteId: note._id });
    if (sharedNote) {
      note._doc.sharedWith = sharedNote.sharedWith;
      note._doc.isPublic = sharedNote.isPublic;
      note._doc.publicUrl = sharedNote.publicUrl;
    }
    // Update last viewed
    note.lastViewedAt = new Date();
    await note.save();
    // --- Return yjsUpdate as base64 string and fallback content ---
    const noteObj = note.toObject();
    try {
      noteObj.yjsUpdate = note.yjsUpdate ? note.yjsUpdate.toString('base64') : undefined;
    } catch (err) {
      noteObj.yjsUpdate = undefined;
      noteObj.yjsError = 'Corrupted Yjs data';
    }
    // Always include fallback content for editor initialization
    noteObj.fallbackContent = note.content || '';
    noteObj.fallbackPlainText = note.plainTextContent || '';
    res.json(noteObj);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create note
router.post('/', auth, async (req, res) => {
  try {
    const { title, notebookId, primaryNotebookId, tags } = req.body;

    // Get default notebook if none specified
    let targetNotebookId = primaryNotebookId || notebookId;
    if (!targetNotebookId) {
      let defaultNotebook = await Notebook.findOne({
        userId: req.userId,
        isDefault: true
      });
      // If no default notebook exists, create one
      if (!defaultNotebook) {
        console.log('No default notebook found, creating one for user:', req.userId);
        defaultNotebook = new Notebook({
          name: 'My Notes',
          userId: req.userId,
          isDefault: true,
          color: '#3B82F6'
        });
        await defaultNotebook.save();
      }
      targetNotebookId = defaultNotebook._id;
    }

    // --- Yjs: Generate canonical update for initial content ---
    let yjsUpdateBuffer = undefined;
    try {
      const ydoc = new Y.Doc();
      const yXml = ydoc.getXmlFragment('prosemirror');
      if (content) {
        // Convert HTML to plain text and create a simple paragraph structure
        const plainText = content.replace(/<[^>]*>/g, '').trim();
        if (plainText) {
          // Create a simple paragraph with text content that YJS can handle
          const paragraphContent = {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: plainText
              }
            ]
          };
          yXml.insert(0, [paragraphContent]);
        } else {
          // Insert empty paragraph
          const emptyParagraph = {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: ''
              }
            ]
          };
          yXml.insert(0, [emptyParagraph]);
        }
      }
      // Optionally, set title as well (if you use Y.Text for title)
      // const yTitle = ydoc.getText('title');
      // if (title) yTitle.insert(0, title);
      yjsUpdateBuffer = Buffer.from(Y.encodeStateAsUpdate(ydoc));
    } catch (e) {
      console.error('[YJS] Failed to generate initial Yjs update:', e);
    }

    const note = new Note({
      noteId: new mongoose.Types.ObjectId().toString(), // Ensure unique noteId
      title: typeof title === 'string' ? title : '',
      userId: req.userId,
      primaryNotebookId: targetNotebookId,
      notebookIds: [targetNotebookId],
      tags: tags || [],
      yjsUpdate: yjsUpdateBuffer
    });

    await note.save();
    await note.populate('primaryNotebookId', 'name color');

    // Update notebook note count
    await Notebook.findByIdAndUpdate(targetNotebookId, {
      $inc: { noteCount: 1 }
    });

    // Increment noteCount for each tag
    if (tags && tags.length > 0) {
      await Tag.updateMany({ _id: { $in: tags } }, { $inc: { noteCount: 1 } });
    }

    // Emit real-time update
    req.io.emit('note-created', { note, userId: req.userId });

    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update note
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, notebookId, primaryNotebookId, tags, isPinned } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const isOwner = note.userId.toString() === req.userId;
    const isCollaborator = note.collaborators && note.collaborators.some(c => c.userId.toString() === req.userId && (c.permission === 'admin' || c.permission === 'write'));
    const isPublicEditor = note.shareSettings?.isPublic && note.shareSettings?.allowEdit;
    if (!isOwner && !isCollaborator && !isPublicEditor) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const oldNotebookId = note.primaryNotebookId;
    const oldTags = note.tags.map(t => t.toString());

    
    // Handle notebook assignment (support both old and new field names)
    const newNotebookId = primaryNotebookId || notebookId;
    
    // Update note
    Object.assign(note, {
      title: title !== undefined ? title : note.title,
      primaryNotebookId: newNotebookId !== undefined ? newNotebookId : note.primaryNotebookId,
      tags: tags !== undefined ? tags : note.tags,
      isPinned: isPinned !== undefined ? isPinned : note.isPinned,

    });
    
    // Update notebookIds if primaryNotebookId changed
    if (newNotebookId && oldNotebookId && oldNotebookId.toString() !== newNotebookId) {
      note.notebookIds = [newNotebookId];
    }
    
    await note.save();
    await note.populate('primaryNotebookId', 'name color');
    // Update notebook counts if notebook changed
    if (newNotebookId && oldNotebookId && oldNotebookId.toString() !== newNotebookId) {
      await Notebook.findByIdAndUpdate(oldNotebookId, { $inc: { noteCount: -1 } });
      await Notebook.findByIdAndUpdate(newNotebookId, { $inc: { noteCount: 1 } });
    }
    // Update tag noteCounts
    if (tags) {
      const newTags = tags.map(t => t.toString());
      const addedTags = newTags.filter(t => !oldTags.includes(t));
      const removedTags = oldTags.filter(t => !newTags.includes(t));
      if (addedTags.length > 0) {
        await Tag.updateMany({ _id: { $in: addedTags } }, { $inc: { noteCount: 1 } });
      }
      if (removedTags.length > 0) {
        await Tag.updateMany({ _id: { $in: removedTags } }, { $inc: { noteCount: -1 } });
      }
    }
    // Emit real-time update
    req.io.emit('note-updated', { note, userId: req.userId });
    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete note (move to trash)
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.isDeleted = true;
    note.deletedAt = new Date();
    await note.save();

    // Update notebook note count (only if primaryNotebookId exists)
    if (note.primaryNotebookId) {
      await Notebook.findByIdAndUpdate(note.primaryNotebookId, {
        $inc: { noteCount: -1 }
      });
    }

    // Decrement noteCount for each tag
    if (note.tags && note.tags.length > 0) {
      await Tag.updateMany({ _id: { $in: note.tags } }, { $inc: { noteCount: -1 } });
    }

    // Emit real-time update
    req.io.emit('note-deleted', { noteId: req.params.id, userId: req.userId });

    res.json({ message: 'Note moved to trash' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Restore note from trash
router.post('/:id/restore', auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.userId,
      isDeleted: true
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found in trash' });
    }

    note.isDeleted = false;
    note.deletedAt = undefined;
    await note.save();

    // Update notebook note count (only if primaryNotebookId exists)
    if (note.primaryNotebookId) {
      await Notebook.findByIdAndUpdate(note.primaryNotebookId, {
        $inc: { noteCount: 1 }
      });
    }

    // Emit real-time update
    req.io.emit('note-restored', { note, userId: req.userId });

    res.json({ message: 'Note restored' });
  } catch (error) {
    console.error('Restore note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Permanently delete note
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
      isDeleted: true
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found in trash' });
    }

    // Emit real-time update
    req.io.emit('note-permanently-deleted', { noteId: req.params.id, userId: req.userId });

    res.json({ message: 'Note permanently deleted' });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Duplicate note
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const originalNote = await Note.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!originalNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const duplicatedNote = new Note({
      title: `${originalNote.title} (Copy)`,
      content: originalNote.content,
      plainTextContent: originalNote.plainTextContent,
      userId: req.userId,
      primaryNotebookId: originalNote.primaryNotebookId,
      notebookIds: [originalNote.primaryNotebookId],
      tags: [...originalNote.tags]
    });

    await duplicatedNote.save();
    await duplicatedNote.populate('primaryNotebookId', 'name color');

    // Update notebook note count
    await Notebook.findByIdAndUpdate(originalNote.primaryNotebookId, {
      $inc: { noteCount: 1 }
    });

    res.status(201).json(duplicatedNote);
  } catch (error) {
    console.error('Duplicate note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save shared note to user's account
router.post('/:id/save-shared', auth, async (req, res) => {
  try {
    // First try to get the note as a shared note
    const sharedNote = await Note.findById(req.params.id)
      .populate('userId', 'name email')
      .select('-__v');
    
    if (!sharedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note is public or user is a collaborator
    const isPublic = sharedNote.shareSettings?.isPublic;
    let isCollaborator = false;
    let hasAdminAccess = false;
    
    if (sharedNote.collaborators) {
      const collaborator = sharedNote.collaborators.find(c => {
        if (!c.userId) return false;
        if (typeof c.userId.equals === 'function') {
          return c.userId.equals(req.userId);
        }
        return c.userId.toString() === req.userId;
      });
      
      if (collaborator) {
        isCollaborator = true;
        hasAdminAccess = collaborator.permission === 'admin';
      }
    }

    // Only allow saving if user is owner, has admin access, or note is public with edit access
    const canSave = sharedNote.userId.toString() === req.userId || 
                   hasAdminAccess || 
                   (isPublic && sharedNote.shareSettings?.allowEdit);

    if (!canSave) {
      return res.status(403).json({ message: 'You do not have permission to save this note' });
    }

    // Get user's default notebook
    let defaultNotebook = await Notebook.findOne({
      userId: req.userId,
      isDefault: true
    });
    
    if (!defaultNotebook) {
      defaultNotebook = new Notebook({
        name: 'My Notes',
        userId: req.userId,
        isDefault: true,
        color: '#3B82F6'
      });
      await defaultNotebook.save();
    }

    // Create new note in user's account
    const newNote = new Note({
      title: `${sharedNote.title} (Shared)`,
      content: sharedNote.content,
      plainTextContent: sharedNote.plainTextContent,
      userId: req.userId,
      primaryNotebookId: defaultNotebook._id,
      notebookIds: [defaultNotebook._id],
      tags: [...sharedNote.tags]
    });

    await newNote.save();
    await newNote.populate('primaryNotebookId', 'name color');

    // Update notebook note count
    await Notebook.findByIdAndUpdate(defaultNotebook._id, {
      $inc: { noteCount: 1 }
    });

    res.status(201).json(newNote);
  } catch (error) {
    console.error('Save shared note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk operations
router.post('/bulk', auth, async (req, res) => {
  try {
    const { action, noteIds, data } = req.body;

    const query = {
      _id: { $in: noteIds },
      userId: req.userId
    };

    let result;
    switch (action) {
      case 'delete':
        result = await Note.updateMany(query, {
          isDeleted: true,
          deletedAt: new Date()
        });
        break;
      case 'restore':
        result = await Note.updateMany(
          { ...query, isDeleted: true },
          { isDeleted: false, $unset: { deletedAt: 1 } }
        );
        break;
      case 'move':
        result = await Note.updateMany(query, {
          primaryNotebookId: data.primaryNotebookId
        });
        break;
      case 'tag':
        result = await Note.updateMany(query, {
          $addToSet: { tags: { $each: data.tags } }
        });
        break;
      case 'pin':
        result = await Note.updateMany(query, {
          isPinned: data.isPinned
        });
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    res.json({ message: `Bulk ${action} completed`, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Get share settings for a note
router.get('/:id/share', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const isOwner = note.userId.toString() === req.userId;
    const isCollaborator = note.collaborators && note.collaborators.some(c => c.userId.toString() === req.userId);
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json({
      settings: {
        isPublic: note.shareSettings?.isPublic || false,
        allowEdit: note.shareSettings?.allowEdit || false,
        allowComments: note.shareSettings?.allowComments || false,
        passwordProtected: note.shareSettings?.passwordProtected || false,
        password: note.shareSettings?.password || '',
        expiresAt: note.shareSettings?.expiresAt || ''
      },
      shareLink: `${req.protocol}://${req.get('host')}/note/${req.params.id}`
    });
  } catch (error) {
    console.error('Get share settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update share settings for a note
router.put('/:id/share', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const isOwner = note.userId.toString() === req.userId;
    const isCollaborator = note.collaborators && note.collaborators.some(c => c.userId.toString() === req.userId && (c.permission === 'admin' || c.permission === 'write'));
    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { isPublic, allowEdit, allowComments, passwordProtected, password, expiresAt } = req.body;
    // Update share settings
    if (!note.shareSettings) {
      note.shareSettings = {};
    }
    note.shareSettings.isPublic = isPublic || false;
    note.shareSettings.allowEdit = allowEdit || false;
    note.shareSettings.allowComments = allowComments || false;
    note.shareSettings.passwordProtected = passwordProtected || false;
    note.shareSettings.password = password || '';
    note.shareSettings.expiresAt = expiresAt || '';
    await note.save();
    const updatedNote = await Note.findById(req.params.id);
    req.io.emit('note-shared', updatedNote);
    console.log('[SOCKET EMIT] note-shared', note._id, 'after share settings update');
    res.json({
      shareLink: `${req.protocol}://${req.get('host')}/note/${req.params.id}`,
      settings: note.shareSettings
    });
  } catch (error) {
    console.error('Update share settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get collaborators for a note
router.get('/:id/collaborators', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    // Populate collaborator details
    const populatedNote = await Note.findById(req.params.id)
      .populate('collaborators.userId', 'name email avatar');
    
    // Map permissions to frontend format
    const mappedCollaborators = (populatedNote.collaborators || []).map(collab => ({
      _id: collab._id,
      userId: collab.userId,
      email: collab.userId.email,
      permission: mapPermissionBack(collab.permission),
      status: 'pending',
      invitedAt: collab.addedAt
    }));
    
    res.json({
      collaborators: mappedCollaborators
    });
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add collaborator to a note
router.post('/:id/collaborators', auth, async (req, res) => {
  console.log('[DEBUG] Entered POST /notes/:id/collaborators', req.body);
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      console.log('[DEBUG] Note not found for collaborator add', req.params.id);
      return res.status(404).json({ message: 'Note not found' });
    }
    const { email, permission } = req.body;
    if (!email || !email.trim()) {
      console.log('[DEBUG] Email missing for collaborator add');
      return res.status(400).json({ message: 'Email is required' });
    }
    // Find user by email
    const User = mongoose.model('User');
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('[DEBUG] Collaborator user not found', email);
      return res.status(400).json({ message: 'User not found with this email address' });
    }
    // Prevent duplicate
    if (note.collaborators && note.collaborators.some(c => c.userId.toString() === user._id.toString())) {
      console.log('[DEBUG] Collaborator already exists', user._id);
      return res.status(400).json({ message: 'Collaborator already added' });
    }
    // Add collaborator
    note.collaborators = note.collaborators || [];
    note.collaborators.push({
      userId: user._id,
      permission: mapPermission(permission) || 'read',
      addedAt: new Date()
    });
    console.log('[DEBUG] Before save (add collaborator)', note.collaborators);
    await note.save();
    const updatedNoteWithCollab = await Note.findById(req.params.id);
    console.log('[DEBUG] After save (add collaborator)', note.collaborators);
    req.io.emit('collaborator-updated', updatedNoteWithCollab);
    console.log('[SOCKET EMIT] collaborator-updated', note._id, 'after DB update');
    res.json(note);
  } catch (err) {
    console.error('Add collaborator error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update collaborator permission
router.put('/:id/collaborators/:collaboratorId', auth, async (req, res) => {
  console.log('[DEBUG] Entered PUT /notes/:id/collaborators/:collaboratorId', req.body);
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      console.log('[DEBUG] Note not found for collaborator update', req.params.id);
      return res.status(404).json({ message: 'Note not found' });
    }
    const { permission } = req.body;
    const collaborator = note.collaborators && note.collaborators.find(c => c._id.toString() === req.params.collaboratorId);
    if (!collaborator) {
      console.log('[DEBUG] Collaborator not found for update', req.params.collaboratorId);
      return res.status(404).json({ message: 'Collaborator not found' });
    }
    collaborator.permission = mapPermission(permission) || collaborator.permission;
    console.log('[DEBUG] Before save (update collaborator)', note.collaborators);
    await note.save();
    const updatedNoteWithCollab = await Note.findById(req.params.id);
    console.log('[DEBUG] After save (update collaborator)', note.collaborators);
    req.io.emit('collaborator-updated', updatedNoteWithCollab);
    console.log('[SOCKET EMIT] collaborator-updated', note._id, 'after DB update');
    res.json(note);
  } catch (err) {
    console.error('Update collaborator error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove collaborator from a note
router.delete('/:id/collaborators/:collaboratorId', auth, async (req, res) => {
  console.log('[DEBUG] Entered DELETE /notes/:id/collaborators/:collaboratorId');
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      console.log('[DEBUG] Note not found for collaborator remove', req.params.id);
      return res.status(404).json({ message: 'Note not found' });
    }
    const beforeCount = note.collaborators ? note.collaborators.length : 0;
    note.collaborators = (note.collaborators || []).filter(c => c._id.toString() !== req.params.collaboratorId);
    const afterCount = note.collaborators.length;
    console.log(`[DEBUG] Collaborators before: ${beforeCount}, after: ${afterCount}`);
    await note.save();
    const updatedNoteAfterRemove = await Note.findById(req.params.id);
    console.log('[DEBUG] After save (remove collaborator)', note.collaborators);
    req.io.emit('collaborator-updated', updatedNoteAfterRemove);
    console.log('[SOCKET EMIT] collaborator-updated', note._id, 'after DB update');
    res.json(note);
  } catch (err) {
    console.error('Remove collaborator error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List notes shared with the user
router.get('/shared/with-me', auth, async (req, res) => {
  try {
    const notes = await Note.find({
      'collaborators.userId': req.userId,
      isDeleted: false
    }).populate('userId', 'name email');
    res.json(notes);
  } catch (error) {
    console.error('List shared with me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List notes shared by the user
router.get('/shared/by-me', auth, async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.userId,
      'collaborators.0': { $exists: true },
      isDeleted: false
    }).populate('collaborators.userId', 'name email');
    res.json(notes);
  } catch (error) {
    console.error('List shared by me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk permanent delete
router.post('/bulk-permanent', auth, async (req, res) => {
  try {
    const { noteIds } = req.body;
    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({ message: 'No noteIds provided' });
    }
    const result = await Note.deleteMany({
      _id: { $in: noteIds },
      userId: req.userId,
      isDeleted: true
    });
    res.json({ message: 'Notes permanently deleted', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Bulk permanent delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add attachment to a note
router.post('/:id/attachments', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const { attachment } = req.body; // expects { filename, originalName, url, type, size, uploadedAt }
    if (!attachment || !attachment.filename) {
      return res.status(400).json({ message: 'Invalid attachment data' });
    }
    note.attachments.push(attachment);
    await note.save();
    res.json(note.attachments);
  } catch (error) {
    console.error('Add attachment error:', error);
    res.status(500).json({ message: 'Failed to add attachment' });
  }
});

// Remove attachment from a note
router.delete('/:id/attachments/:filename', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const filename = req.params.filename;
    const attachmentIndex = note.attachments.findIndex(att => att.filename === filename);
    if (attachmentIndex === -1) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    // Remove from array
    note.attachments.splice(attachmentIndex, 1);
    await note.save();
    // Optionally delete file from disk
    const filePath = path.join(process.cwd(), 'server/uploads', filename);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Ignore if file doesn't exist
    }
    res.json(note.attachments);
  } catch (error) {
    console.error('Remove attachment error:', error);
    res.status(500).json({ message: 'Failed to remove attachment' });
  }
});

// Get backlinks for a note
router.get('/:id/backlinks', auth, async (req, res) => {
  try {
    const noteId = req.params.id;
    // Find notes that link to this note (by noteId in content)
    // Looks for /notes?note=NOTE_ID or data-note-id="NOTE_ID"
    const regex = new RegExp(`(\\?note=${noteId}|data-note-id=\\"${noteId}\\")`, 'i');
    const backlinks = await Note.find({
      userId: req.userId,
      isDeleted: false,
      content: { $regex: regex }
    }, 'title _id');
    res.json(backlinks);
  } catch (error) {
    console.error('Get backlinks error:', error);
    res.status(500).json({ message: 'Failed to fetch backlinks' });
  }
});

// Export notes
router.post('/export', auth, async (req, res) => {
  try {
    const { noteIds, format } = req.body;
    if (!Array.isArray(noteIds) || !format) {
      return res.status(400).json({ message: 'Missing noteIds or format' });
    }
    const notes = await Note.find({ _id: { $in: noteIds }, userId: req.userId });
    let data, mime, ext;
    if (format === 'json') {
      data = JSON.stringify(notes, null, 2);
      mime = 'application/json';
      ext = 'json';
    } else if (format === 'txt') {
      data = notes.map(n => `${n.title}\n${n.plainTextContent}`).join('\n\n---\n\n');
      mime = 'text/plain';
      ext = 'txt';
    } else if (format === 'md') {
      data = notes.map(n => `# ${n.title}\n\n${n.plainTextContent}`).join('\n\n---\n\n');
      mime = 'text/markdown';
      ext = 'md';
    } else {
      return res.status(400).json({ message: 'Unsupported format' });
    }
    res.setHeader('Content-Disposition', `attachment; filename=notes-export.${ext}`);
    res.setHeader('Content-Type', mime);
    res.send(data);
  } catch (error) {
    console.error('Export notes error:', error);
    res.status(500).json({ message: 'Failed to export notes' });
  }
});

// Import notes
router.post('/import', auth, upload.single('file'), async (req, res) => {
  try {
    const { format } = req.body;
    const file = req.file;
    if (!file || !format) {
      return res.status(400).json({ message: 'Missing file or format' });
    }
    const content = await fs.readFile(file.path, 'utf-8');
    let notes = [];
    if (format === 'json') {
      notes = JSON.parse(content);
    } else if (format === 'txt' || format === 'md') {
      // Split by ---
      const rawNotes = content.split(/\n---\n/);
      notes = rawNotes.map(raw => {
        const [title, ...body] = raw.trim().split('\n');
        return {
          title: title.replace(/^# /, '').trim() || 'Untitled',
          content: body.join('\n').trim(),
          plainTextContent: body.join('\n').trim(),
        };
      });
    } else {
      return res.status(400).json({ message: 'Unsupported format' });
    }
    // Create notes for user
    for (const n of notes) {
      await Note.create({
        title: n.title || 'Untitled',
        content: n.content || '',
        plainTextContent: n.plainTextContent || '',
        userId: req.userId,
        primaryNotebookId: n.primaryNotebookId || undefined,
        notebookIds: n.notebookIds || [n.primaryNotebookId || undefined],
        tags: n.tags || [],
      });
    }
    // Remove uploaded file
    await fs.unlink(file.path);
    res.json({ message: 'Notes imported successfully', count: notes.length });
  } catch (error) {
    console.error('Import notes error:', error);
    res.status(500).json({ message: 'Failed to import notes' });
  }
});

// Get shared note (public access or collaborator)
router.get('/:id/shared', async (req, res) => {
  try {
    console.log('[DEBUG] Shared note request for ID:', req.params.id);
    
    // Require authentication for all shared note access
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
        console.log('[DEBUG] Authenticated user ID:', userId);
      } catch (e) {
        console.log('[DEBUG] JWT verification failed:', e.message);
        return res.status(403).json({ message: 'Authentication required to view shared notes.' });
      }
    } else {
      console.log('[DEBUG] No authorization header provided');
      return res.status(403).json({ message: 'Authentication required to view shared notes.' });
    }

    const note = await Note.findById(req.params.id)
      .populate('userId', 'name email')
      .select('-__v');
    
    if (!note) {
      console.log('[DEBUG] Note not found in database:', req.params.id);
      return res.status(404).json({ message: 'Note not found' });
    }

    console.log('[DEBUG] Note found:', {
      id: note._id,
      title: note.title,
      ownerId: note.userId._id,
      isPublic: note.shareSettings?.isPublic,
      collaborators: note.collaborators?.length || 0
    });

    // Check if note is public
    const isPublic = note.shareSettings?.isPublic;
    
    // Check if user is a collaborator or owner (if logged in)
    let isCollaborator = false;
    let isOwner = false;
    
    // Check if user is the owner
    isOwner = note.userId._id.toString() === userId;
    // Check if user is a collaborator
    isCollaborator = note.collaborators && note.collaborators.some(c => {
      if (!c.userId) return false;
      if (typeof c.userId.equals === 'function') {
        return c.userId.equals(userId);
      }
      return c.userId.toString() === userId;
    });

    console.log('[DEBUG] Access check:', {
      isOwner,
      isCollaborator,
      isPublic,
      userId,
      ownerId: note.userId._id.toString()
    });

    // Determine edit access and permission level
    let canEdit = false;
    let permission = 'none';
    let canSave = false;
    
    if (isOwner) {
      canEdit = true; // Owner always has edit access
      permission = 'owner';
      canSave = true; // Owner can always save
    } else if (isCollaborator) {
      // Find collaborator permission
      const collab = note.collaborators.find(c => c.userId.toString() === userId);
      if (collab) {
        permission = collab.permission;
        canEdit = collab.permission === 'admin' || collab.permission === 'write';
        canSave = collab.permission === 'admin'; // Only admin can save to their account
      }
    } else if (isPublic && note.shareSettings?.allowEdit) {
      canEdit = true;
      permission = 'public';
      canSave = true; // Public edit access can save
    }

    console.log('[DEBUG] Final access granted:', {
      canEdit,
      permission,
      canSave,
      hasYjsUpdate: !!note.yjsUpdate
    });

    // Return the note with access information (always up-to-date)
    const noteObject = note.toObject();
    try {
      noteObject.yjsUpdate = note.yjsUpdate ? note.yjsUpdate.toString('base64') : undefined;
    } catch(e) {
      console.error('[DEBUG] Error converting yjsUpdate to base64:', e);
      noteObject.yjsUpdate = undefined;
    }

    res.json({
      note: {
        ...noteObject,
        owner: {
          name: note.userId.name,
          email: note.userId.email
        }
      },
      access: {
        canEdit,
        canComment: note.shareSettings?.allowComments || false,
        isExpired: false,
        requiresPassword: false,
        permission,
        canSave
      }
    });
  } catch (error) {
    console.error('Get shared note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify password for shared note
router.post('/:id/shared/verify-password', async (req, res) => {
  try {
    const { password } = req.body;
    const note = await Note.findById(req.params.id)
      .populate('userId', 'name email')
      .select('-__v');
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note is shared and password protected
    if (!note.shareSettings?.isPublic || !note.shareSettings?.passwordProtected) {
      return res.status(400).json({ message: 'Note is not password protected' });
    }

    // Check if note has expired
    if (note.shareSettings.expiresAt && new Date() > new Date(note.shareSettings.expiresAt)) {
      return res.status(410).json({ message: 'This shared note has expired' });
    }

    // Verify password
    if (note.shareSettings.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Store verification in session (if using sessions) or return success
    if (!req.session) req.session = {};
    if (!req.session.verifiedNotes) req.session.verifiedNotes = [];
    req.session.verifiedNotes.push(note._id.toString());

    // Return the note with access information
    res.json({
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        shareSettings: note.shareSettings,
        owner: {
          name: note.userId.name,
          email: note.userId.email
        }
      },
      access: {
        canEdit: note.shareSettings.allowEdit,
        canComment: note.shareSettings.allowComments,
        isExpired: false,
        requiresPassword: false
      }
    });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH endpoint to save canonical Yjs update
router.patch('/:id/yjs-update', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const { yjsUpdate } = req.body;
    if (!yjsUpdate) return res.status(400).json({ message: 'Missing yjsUpdate' });
    const yjsBuffer = Buffer.from(yjsUpdate, 'base64');
    // MongoDB document size limit is 16MB
    if (yjsBuffer.length > 15 * 1024 * 1024) {
      return res.status(413).json({ message: 'Yjs update too large to save' });
    }
    // Simple lock to prevent race conditions (atomicity)
    if (note._yjsLock) {
      return res.status(429).json({ message: 'Another Yjs update is in progress' });
    }
    note._yjsLock = true;
    note.yjsUpdate = yjsBuffer;
    await note.save();
    note._yjsLock = false;
    res.json({ message: 'Yjs update saved' });
  } catch (error) {
    console.error('Save Yjs update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;