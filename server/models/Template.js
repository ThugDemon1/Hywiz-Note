import mongoose from 'mongoose';
import crypto from 'crypto';

const templateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    default: 'general',
    trim: true
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    permission: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  shareLink: {
    type: String,
    unique: true,
    sparse: true
  },
  shareExpiry: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  yjsUpdate: {
    type: Buffer, // Store the canonical Yjs update as a binary Buffer
    required: false
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
templateSchema.index({ userId: 1, isDeleted: 1 });
templateSchema.index({ userId: 1, isPinned: 1, updatedAt: -1 });
templateSchema.index({ userId: 1, isArchived: 1 });
templateSchema.index({ isPublic: 1, isDeleted: 1 });
templateSchema.index({ shareLink: 1 });
templateSchema.index({ 'collaborators.userId': 1, isDeleted: 1 });
templateSchema.index({ tags: 1, isDeleted: 1 });
templateSchema.index({ category: 1, isDeleted: 1 });
templateSchema.index({ title: 'text', description: 'text' });

// Generate share link
templateSchema.methods.generateShareLink = function() {
  this.shareLink = crypto.randomBytes(16).toString('hex');
  return this.shareLink;
};

// Check if user has permission
templateSchema.methods.hasPermission = function(userId, permission = 'read') {
  if (this.userId.toString() === userId.toString()) {
    return true; // Owner has all permissions
  }
  
  const collaborator = this.collaborators.find(c => c.userId.toString() === userId.toString());
  if (!collaborator) return false;
  
  const permissions = ['read', 'write', 'admin'];
  const userPermissionIndex = permissions.indexOf(collaborator.permission);
  const requiredPermissionIndex = permissions.indexOf(permission);
  
  return userPermissionIndex >= requiredPermissionIndex;
};

// Add collaborator
templateSchema.methods.addCollaborator = function(userId, permission = 'read') {
  const existingIndex = this.collaborators.findIndex(c => c.userId.toString() === userId.toString());
  
  if (existingIndex >= 0) {
    this.collaborators[existingIndex].permission = permission;
  } else {
    this.collaborators.push({ userId, permission });
  }
  
  return this.save();
};

// Remove collaborator
templateSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(c => c.userId.toString() !== userId.toString());
  return this.save();
};

// Update collaborator permission
templateSchema.methods.updateCollaboratorPermission = function(userId, permission) {
  const collaborator = this.collaborators.find(c => c.userId.toString() === userId.toString());
  if (collaborator) {
    collaborator.permission = permission;
    return this.save();
  }
  return Promise.reject(new Error('Collaborator not found'));
};

// Increment usage count
templateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Add rating
templateSchema.methods.addRating = function(rating) {
  const totalRating = (this.rating * this.ratingCount) + rating;
  this.ratingCount += 1;
  this.rating = totalRating / this.ratingCount;
  return this.save();
};

// Pre-save middleware to generate share link if public
templateSchema.pre('save', function(next) {
  if (this.isPublic && !this.shareLink) {
    this.generateShareLink();
  }
  next();
});

// Virtual for formatted dates
templateSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString();
});

templateSchema.virtual('formattedUpdatedAt').get(function() {
  return this.updatedAt.toLocaleDateString();
});

// Ensure virtuals are included in JSON output
templateSchema.set('toJSON', { virtuals: true });
templateSchema.set('toObject', { virtuals: true });

const Template = mongoose.model('Template', templateSchema);

export default Template; 