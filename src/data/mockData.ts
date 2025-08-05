import { Note, Shortcut, RecentItem, NavigationItem } from '../types';

export const notes: Note[] = [
  {
    id: '1',
    title: 'Outdoor Living Space Ideas',
    content: 'Ideas for creating beautiful outdoor spaces...',
    preview: 'Transform your backyard into a peaceful retreat with these design ideas...',
    date: '9/11/20',
    thumbnail: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['outdoor', 'design'],
    isPinned: false,
    category: 'lifestyle'
  },
  {
    id: '2',
    title: 'Business Strategy',
    content: 'Goal: Capture the green homes market...',
    preview: 'Goal: Capture the green homes market in the Bay Area and establish ourselves as the premier provider of eco-friendly housing solutions.',
    date: '7/21/20',
    thumbnail: 'https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['business', 'strategy'],
    isPinned: true,
    category: 'business'
  },
  {
    id: '3',
    title: 'Property Listings',
    content: 'Current property listings and market analysis...',
    preview: 'Review of current property listings in the target market area...',
    date: '7/21/20',
    thumbnail: 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['real-estate'],
    isPinned: false,
    category: 'business'
  },
  {
    id: '4',
    title: 'Vacation Itinerary',
    content: 'Summer vacation planning and itinerary...',
    preview: 'Detailed itinerary for summer vacation including flights, hotels, and activities...',
    date: '7/29/20',
    thumbnail: 'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['travel', 'vacation'],
    isPinned: false,
    category: 'personal'
  }
];

export const shortcuts: Shortcut[] = [
  { id: '1', name: 'Business', icon: 'briefcase' },
  { id: '2', name: 'Clients', icon: 'users' },
  { id: '3', name: 'Contacts', icon: 'user-check' },
  { id: '4', name: 'Promo', icon: 'search' },
  { id: '5', name: 'Meeting Notes', icon: 'file-text' },
  { id: '6', name: 'Business Stra...', icon: 'trending-up' },
  { id: '7', name: 'To-do List', icon: 'check-square' },
  { id: '8', name: 'Personal Proj...', icon: 'user' },
  { id: '9', name: 'Maui', icon: 'search' },
  { id: '10', name: 'Leads', icon: 'trending-up' }
];

export const recentItems: RecentItem[] = [
  {
    id: '1',
    title: 'Contract Document',
    type: 'document',
    thumbnail: 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=200',
    timestamp: '9/21/20'
  },
  {
    id: '2',
    title: 'Emerald Furniture',
    type: 'image',
    thumbnail: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=200',
    timestamp: '1 minute ago'
  }
];

export const navigationItems: NavigationItem[] = [
  { id: 'home', name: 'Home', icon: 'home' },
  { id: 'shortcuts', name: 'Shortcuts', icon: 'zap', badge: 3 },
  { id: 'notes', name: 'All Notes', icon: 'file-text' },
  { id: 'notebooks', name: 'Notebooks', icon: 'book' },
  { id: 'shared', name: 'Shared with Me', icon: 'users' },

  { id: 'tags', name: 'Tags', icon: 'tag' },
  { id: 'trash', name: 'Trash', icon: 'trash-2' }
];