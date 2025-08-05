import express from 'express';
import SharedNote from '../models/SharedNote.js';
import Note from '../models/Note.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import Template from '../models/Template.js';

const router = express.Router();

// Get shared content
router.get('/', auth, async (req, res) => {
  try {
    const { type = 'with-me' } = req.query;

    let sharedNotes = [];

    if (type === 'with-me') {
      // Notes shared with current user
      sharedNotes = await SharedNote.find({
        'sharedWith.userId': req.userId,
        'sharedWith.status': 'accepted'
      })
        .populate({
          path: 'noteId',
          populate: {
            path: 'notebookId',
            select: 'name color'
          }
        })
        .populate('ownerId', 'name email avatar');
    } else if (type === 'by-me') {
      // Notes shared by current user
      sharedNotes = await SharedNote.find({
        ownerId: req.userId
      })
        .populate({
          path: 'noteId',
          populate: {
            path: 'notebookId',
            select: 'name color'
          }
        })
        .populate('sharedWith.userId', 'name email avatar');
    } else if (type === 'pending') {
      // Pending invitations for current user
      sharedNotes = await SharedNote.find({
        'sharedWith.userId': req.userId,
        'sharedWith.status': 'pending'
      })
        .populate({
          path: 'noteId',
          populate: {
            path: 'notebookId',
            select: 'name color'
          }
        })
        .populate('ownerId', 'name email avatar');
    }

    res.json(sharedNotes);
  } catch (error) {
    console.error('Get shared content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share note
router.post('/notes/:noteId', auth, async (req, res) => {
  console.log('[DEBUG] Entered POST /notes/:noteId', req.body);
  try {
    const { emails, permission = 'read', message } = req.body;
    const noteId = req.params.noteId;

    // Verify note ownership
    const note = await Note.findOne({
      _id: noteId,
      userId: req.userId
    });

    if (!note) {
      console.log('[DEBUG] Note not found for sharing', noteId);
      return res.status(404).json({ message: 'Note not found' });
    }

    // Find or create shared note record
    let sharedNote = await SharedNote.findOne({
      noteId,
      ownerId: req.userId
    });

    if (!sharedNote) {
      sharedNote = new SharedNote({
        noteId,
        ownerId: req.userId,
        sharedWith: []
      });
    }

    // Process each email
    const results = [];
    for (const email of emails) {
      try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
          results.push({ email, status: 'user-not-found' });
          continue;
        }

        // Check if already shared
        const existingShare = sharedNote.sharedWith.find(
          share => share.userId.toString() === user._id.toString()
        );

        if (existingShare) {
          // Update permission if different
          if (existingShare.permission !== permission) {
            existingShare.permission = permission;
            results.push({ email, status: 'permission-updated' });
          } else {
            results.push({ email, status: 'already-shared' });
          }
        } else {
          // Add new share, auto-accept for demo/testing
          sharedNote.sharedWith.push({
            userId: user._id,
            email: email.toLowerCase(),
            permission,
            invitedAt: new Date(),
            status: 'accepted', // auto-accept
            acceptedAt: new Date() // auto-accept
          });
          results.push({ email, status: 'invited-and-accepted' });
        }
      } catch (err) {
        results.push({ email, status: 'error' });
      }
    }

    console.log('[DEBUG] Before save', sharedNote);
    await sharedNote.save();
    console.log('[DEBUG] After save', sharedNote);
    // Emit event for share update
    const updatedNote = await Note.findById(noteId);
    req.io.emit('note-shared', updatedNote);
    console.log('[SOCKET EMIT] note-shared', noteId, 'after DB update');

    // TODO: Send email notifications
    // This would integrate with an email service like SendGrid or Nodemailer

    res.json({
      message: 'Sharing invitations sent',
      results
    });
  } catch (error) {
    console.error('Share note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept sharing invitation
router.post('/accept/:shareId', auth, async (req, res) => {
  console.log('[DEBUG] Entered POST /accept/:shareId', req.body);
  try {
    const sharedNote = await SharedNote.findById(req.params.shareId);

    if (!sharedNote) {
      console.log('[DEBUG] Sharing invitation not found', req.params.shareId);
      return res.status(404).json({ message: 'Sharing invitation not found' });
    }

    const shareIndex = sharedNote.sharedWith.findIndex(
      share => share.userId.toString() === req.userId && share.status === 'pending'
    );

    if (shareIndex === -1) {
      console.log('[DEBUG] Invitation not found or already processed', req.params.shareId);
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    sharedNote.sharedWith[shareIndex].status = 'accepted';
    sharedNote.sharedWith[shareIndex].acceptedAt = new Date();

    console.log('[DEBUG] Before save', sharedNote);
    await sharedNote.save();
    console.log('[DEBUG] After save', sharedNote);
    // Emit event for collaborator update
    const updatedNoteOnAccept = await Note.findById(sharedNote.noteId);
    req.io.emit('collaborator-updated', updatedNoteOnAccept);
    console.log('[SOCKET EMIT] collaborator-updated', sharedNote.noteId, 'after DB update');

    res.json({ message: 'Invitation accepted' });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline sharing invitation
router.post('/decline/:shareId', auth, async (req, res) => {
  console.log('[DEBUG] Entered POST /decline/:shareId', req.body);
  try {
    const sharedNote = await SharedNote.findById(req.params.shareId);

    if (!sharedNote) {
      console.log('[DEBUG] Sharing invitation not found', req.params.shareId);
      return res.status(404).json({ message: 'Sharing invitation not found' });
    }

    const shareIndex = sharedNote.sharedWith.findIndex(
      share => share.userId.toString() === req.userId && share.status === 'pending'
    );

    if (shareIndex === -1) {
      console.log('[DEBUG] Invitation not found or already processed', req.params.shareId);
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    sharedNote.sharedWith[shareIndex].status = 'declined';
    console.log('[DEBUG] Before save', sharedNote);
    await sharedNote.save();
    console.log('[DEBUG] After save', sharedNote);
    // Emit event for collaborator update
    const updatedNoteOnDecline = await Note.findById(sharedNote.noteId);
    req.io.emit('collaborator-updated', updatedNoteOnDecline);
    console.log('[SOCKET EMIT] collaborator-updated', sharedNote.noteId, 'after DB update');

    res.json({ message: 'Invitation declined' });
  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update permission
router.put('/permission/:shareId', auth, async (req, res) => {
  console.log('[DEBUG] Entered PUT /permission/:shareId', req.body);
  try {
    const { userId, permission } = req.body;

    const sharedNote = await SharedNote.findOne({
      _id: req.params.shareId,
      ownerId: req.userId
    });

    if (!sharedNote) {
      console.log('[DEBUG] Shared note not found', req.params.shareId);
      return res.status(404).json({ message: 'Shared note not found' });
    }

    const shareIndex = sharedNote.sharedWith.findIndex(
      share => share.userId.toString() === userId
    );

    if (shareIndex === -1) {
      console.log('[DEBUG] User not found in sharing list', userId);
      return res.status(404).json({ message: 'User not found in sharing list' });
    }

    sharedNote.sharedWith[shareIndex].permission = permission;
    console.log('[DEBUG] Before save', sharedNote);
    await sharedNote.save();
    console.log('[DEBUG] After save', sharedNote);
    // Emit event for collaborator update
    const updatedNoteOnPermission = await Note.findById(sharedNote.noteId);
    req.io.emit('collaborator-updated', updatedNoteOnPermission);
    console.log('[SOCKET EMIT] collaborator-updated', sharedNote.noteId, 'after DB update');

    res.json({ message: 'Permission updated' });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke access
router.delete('/revoke/:shareId', auth, async (req, res) => {
  console.log('[DEBUG] Entered DELETE /revoke/:shareId', req.body);
  try {
    const { userId } = req.body;

    const sharedNote = await SharedNote.findOne({
      _id: req.params.shareId,
      ownerId: req.userId
    });

    if (!sharedNote) {
      console.log('[DEBUG] Shared note not found', req.params.shareId);
      return res.status(404).json({ message: 'Shared note not found' });
    }

    sharedNote.sharedWith = sharedNote.sharedWith.filter(
      share => share.userId.toString() !== userId
    );

    if (sharedNote.sharedWith.length === 0 && !sharedNote.isPublic) {
      await SharedNote.findByIdAndDelete(req.params.shareId);
      console.log('[DEBUG] SharedNote deleted', req.params.shareId);
    } else {
      console.log('[DEBUG] Before save', sharedNote);
      await sharedNote.save();
      console.log('[DEBUG] After save', sharedNote);
    }
    // Emit event for collaborator update
    const updatedNoteOnRevoke = await Note.findById(sharedNote.noteId);
    req.io.emit('collaborator-updated', updatedNoteOnRevoke);
    console.log('[SOCKET EMIT] collaborator-updated', sharedNote.noteId, 'after DB update');

    res.json({ message: 'Access revoked' });
  } catch (error) {
    console.error('Revoke access error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create public link
router.post('/public/:noteId', auth, async (req, res) => {
  console.log('[DEBUG] Entered POST /public/:noteId', req.body);
  try {
    const noteId = req.params.noteId;

    // Verify note ownership
    const note = await Note.findOne({
      _id: noteId,
      userId: req.userId
    });

    if (!note) {
      console.log('[DEBUG] Note not found for public link', noteId);
      return res.status(404).json({ message: 'Note not found' });
    }

    let sharedNote = await SharedNote.findOne({
      noteId,
      ownerId: req.userId
    });

    if (!sharedNote) {
      sharedNote = new SharedNote({
        noteId,
        ownerId: req.userId,
        sharedWith: []
      });
    }

    sharedNote.isPublic = true;
    sharedNote.publicUrl = uuidv4();

    console.log('[DEBUG] Before save', sharedNote);
    await sharedNote.save();
    console.log('[DEBUG] After save', sharedNote);
    // Emit event for share update
    const updatedNoteOnPublic = await Note.findById(noteId);
    req.io.emit('note-shared', updatedNoteOnPublic);
    console.log('[SOCKET EMIT] note-shared', noteId, 'after DB update');

    res.json({
      publicUrl: `${req.protocol}://${req.get('host')}/public/${sharedNote.publicUrl}`,
      shareId: sharedNote._id
    });
  } catch (error) {
    console.error('Create public link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove public link
router.delete('/public/:shareId', auth, async (req, res) => {
  console.log('[DEBUG] Entered DELETE /public/:shareId', req.body);
  try {
    const sharedNote = await SharedNote.findOne({
      _id: req.params.shareId,
      ownerId: req.userId
    });

    if (!sharedNote) {
      console.log('[DEBUG] Shared note not found', req.params.shareId);
      return res.status(404).json({ message: 'Shared note not found' });
    }

    sharedNote.isPublic = false;
    sharedNote.publicUrl = undefined;

    if (sharedNote.sharedWith.length === 0) {
      await SharedNote.findByIdAndDelete(req.params.shareId);
      console.log('[DEBUG] SharedNote deleted', req.params.shareId);
    } else {
      console.log('[DEBUG] Before save', sharedNote);
      await sharedNote.save();
      console.log('[DEBUG] After save', sharedNote);
    }
    // Emit event for share update
    const updatedNoteOnRemovePublic = await Note.findById(sharedNote.noteId);
    req.io.emit('note-shared', updatedNoteOnRemovePublic);
    console.log('[SOCKET EMIT] note-shared', sharedNote.noteId, 'after DB update');

    res.json({ message: 'Public link removed' });
  } catch (error) {
    console.error('Remove public link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch all collaborative notes and templates for the current user
router.get('/collaborative', auth, async (req, res) => {
  try {
    const notes = await Note.find({
      'collaborators.userId': req.userId,
      isDeleted: false
    })
      .populate('userId', 'name email avatar')
      .populate('notebookIds', 'name color')
      .lean();
    const templates = await Template.find({
      'collaborators.userId': req.userId,
      isDeleted: false,
      userId: { $ne: req.userId }
    })
      .populate('userId', 'name email')
      .populate('tags', 'name color')
      .lean();
    // Add type field
    const notesWithType = notes.map(n => ({ ...n, type: 'note' }));
    const templatesWithType = templates.map(t => ({ ...t, type: 'template' }));
    // Merge and sort by updatedAt desc
    const all = [...notesWithType, ...templatesWithType].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(all);
  } catch (error) {
    console.error('Get collaborative notes/templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-accept invitation when user opens a shared note
router.get('/collaborative/:noteId', auth, async (req, res) => {
  try {
    const sharedNote = await SharedNote.findOne({
      noteId: req.params.noteId,
      'sharedWith.userId': req.userId
    });
    if (!sharedNote) {
      return res.status(404).json({ message: 'Shared note not found' });
    }
    // Find the share entry for this user
    const shareEntry = sharedNote.sharedWith.find(
      share => share.userId.toString() === req.userId && share.status === 'pending'
    );
    if (shareEntry) {
      shareEntry.status = 'accepted';
      shareEntry.acceptedAt = new Date();
      await sharedNote.save();
    }
    // Populate note and owner
    await sharedNote.populate({
      path: 'noteId',
      populate: { path: 'notebookId', select: 'name color' }
    });
    await sharedNote.populate('ownerId', 'name email avatar');
    res.json(sharedNote);
  } catch (error) {
    console.error('Auto-accept collaborative note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;