import mongoose from 'mongoose';
import Template from './models/Template.js';
import User from './models/User.js';

// Sample templates data based on the NoteTemplates component
const sampleTemplates = [
  {
    title: 'Meeting Notes',
    content: `
      <h2>Meeting Notes</h2>
      <p><strong>Date:</strong> [Date]</p>
      <p><strong>Time:</strong> [Time]</p>
      <p><strong>Location:</strong> [Location/Platform]</p>
      <p><strong>Attendees:</strong></p>
      <ul>
        <li>[Attendee 1]</li>
        <li>[Attendee 2]</li>
        <li>[Attendee 3]</li>
      </ul>
      
      <h3>Agenda</h3>
      <ol>
        <li>[Agenda Item 1]</li>
        <li>[Agenda Item 2]</li>
        <li>[Agenda Item 3]</li>
      </ol>
      
      <h3>Discussion Points</h3>
      <ul>
        <li><strong>Topic 1:</strong> [Discussion details]</li>
        <li><strong>Topic 2:</strong> [Discussion details]</li>
        <li><strong>Topic 3:</strong> [Discussion details]</li>
      </ul>
      
      <h3>Action Items</h3>
      <ul>
        <li>[ ] [Action Item 1] - [Assignee] - [Due Date]</li>
        <li>[ ] [Action Item 2] - [Assignee] - [Due Date]</li>
        <li>[ ] [Action Item 3] - [Assignee] - [Due Date]</li>
      </ul>
      
      <h3>Next Meeting</h3>
      <p><strong>Date:</strong> [Next Meeting Date]</p>
      <p><strong>Time:</strong> [Next Meeting Time]</p>
    `,
    plainTextContent: `Meeting Notes\n\nDate: [Date]\nTime: [Time]\nLocation: [Location/Platform]\n\nAttendees:\n- [Attendee 1]\n- [Attendee 2]\n- [Attendee 3]\n\nAgenda:\n1. [Agenda Item 1]\n2. [Agenda Item 2]\n3. [Agenda Item 3]\n\nDiscussion Points:\n- Topic 1: [Discussion details]\n- Topic 2: [Discussion details]\n- Topic 3: [Discussion details]\n\nAction Items:\n- [ ] [Action Item 1] - [Assignee] - [Due Date]\n- [ ] [Action Item 2] - [Assignee] - [Due Date]\n- [ ] [Action Item 3] - [Assignee] - [Due Date]\n\nNext Meeting:\nDate: [Next Meeting Date]\nTime: [Next Meeting Time]`,
    description: 'Structured template for capturing meeting notes with agenda, attendees, and action items',
    category: 'business',
    icon: 'users',
    color: '#3B82F6',
    isPublic: true
  },
  {
    title: 'Project Plan',
    content: `
      <h2>Project Plan</h2>
      <p><strong>Project Name:</strong> [Project Name]</p>
      <p><strong>Project Manager:</strong> [Project Manager]</p>
      <p><strong>Start Date:</strong> [Start Date]</p>
      <p><strong>End Date:</strong> [End Date]</p>
      
      <h3>Project Overview</h3>
      <p>[Brief description of the project goals and objectives]</p>
      
      <h3>Stakeholders</h3>
      <ul>
        <li><strong>Primary:</strong> [Primary Stakeholder]</li>
        <li><strong>Secondary:</strong> [Secondary Stakeholder]</li>
        <li><strong>Technical:</strong> [Technical Stakeholder]</li>
      </ul>
      
      <h3>Project Phases</h3>
      <ol>
        <li><strong>Phase 1: Planning</strong>
          <ul>
            <li>Duration: [Duration]</li>
            <li>Deliverables: [Deliverables]</li>
            <li>Milestones: [Milestones]</li>
          </ul>
        </li>
        <li><strong>Phase 2: Development</strong>
          <ul>
            <li>Duration: [Duration]</li>
            <li>Deliverables: [Deliverables]</li>
            <li>Milestones: [Milestones]</li>
          </ul>
        </li>
        <li><strong>Phase 3: Testing</strong>
          <ul>
            <li>Duration: [Duration]</li>
            <li>Deliverables: [Deliverables]</li>
            <li>Milestones: [Milestones]</li>
          </ul>
        </li>
        <li><strong>Phase 4: Deployment</strong>
          <ul>
            <li>Duration: [Duration]</li>
            <li>Deliverables: [Deliverables]</li>
            <li>Milestones: [Milestones]</li>
          </ul>
        </li>
      </ol>
      
      <h3>Risk Assessment</h3>
      <table>
        <tr>
          <th>Risk</th>
          <th>Probability</th>
          <th>Impact</th>
          <th>Mitigation</th>
        </tr>
        <tr>
          <td>[Risk 1]</td>
          <td>[High/Medium/Low]</td>
          <td>[High/Medium/Low]</td>
          <td>[Mitigation Strategy]</td>
        </tr>
        <tr>
          <td>[Risk 2]</td>
          <td>[High/Medium/Low]</td>
          <td>[High/Medium/Low]</td>
          <td>[Mitigation Strategy]</td>
        </tr>
      </table>
      
      <h3>Success Criteria</h3>
      <ul>
        <li>[Success Criterion 1]</li>
        <li>[Success Criterion 2]</li>
        <li>[Success Criterion 3]</li>
      </ul>
    `,
    plainTextContent: `Project Plan\n\nProject Name: [Project Name]\nProject Manager: [Project Manager]\nStart Date: [Start Date]\nEnd Date: [End Date]\n\nProject Overview:\n[Brief description of the project goals and objectives]\n\nStakeholders:\n- Primary: [Primary Stakeholder]\n- Secondary: [Secondary Stakeholder]\n- Technical: [Technical Stakeholder]\n\nProject Phases:\n1. Phase 1: Planning\n   - Duration: [Duration]\n   - Deliverables: [Deliverables]\n   - Milestones: [Milestones]\n\n2. Phase 2: Development\n   - Duration: [Duration]\n   - Deliverables: [Deliverables]\n   - Milestones: [Milestones]\n\n3. Phase 3: Testing\n   - Duration: [Duration]\n   - Deliverables: [Deliverables]\n   - Milestones: [Milestones]\n\n4. Phase 4: Deployment\n   - Duration: [Duration]\n   - Deliverables: [Deliverables]\n   - Milestones: [Milestones]\n\nRisk Assessment:\n- Risk 1: [Risk Description] - Probability: [High/Medium/Low] - Impact: [High/Medium/Low] - Mitigation: [Strategy]\n- Risk 2: [Risk Description] - Probability: [High/Medium/Low] - Impact: [High/Medium/Low] - Mitigation: [Strategy]\n\nSuccess Criteria:\n- [Success Criterion 1]\n- [Success Criterion 2]\n- [Success Criterion 3]`,
    description: 'Comprehensive project planning template with phases, risks, and success criteria',
    category: 'business',
    icon: 'target',
    color: '#10B981',
    isPublic: true
  },
  {
    title: 'Daily Journal',
    content: `
      <h2>Daily Journal</h2>
      <p><strong>Date:</strong> [Date]</p>
      <p><strong>Weather:</strong> [Weather]</p>
      <p><strong>Mood:</strong> [Mood]</p>
      
      <h3>Gratitude</h3>
      <p>Today I'm grateful for:</p>
      <ol>
        <li>[Gratitude Item 1]</li>
        <li>[Gratitude Item 2]</li>
        <li>[Gratitude Item 3]</li>
      </ol>
      
      <h3>Today's Highlights</h3>
      <ul>
        <li>[Highlight 1]</li>
        <li>[Highlight 2]</li>
        <li>[Highlight 3]</li>
      </ul>
      
      <h3>Challenges & Lessons</h3>
      <p><strong>Challenge:</strong> [Describe a challenge you faced today]</p>
      <p><strong>Lesson Learned:</strong> [What did you learn from this challenge?]</p>
      
      <h3>Goals & Progress</h3>
      <ul>
        <li><strong>Goal 1:</strong> [Progress update]</li>
        <li><strong>Goal 2:</strong> [Progress update]</li>
        <li><strong>Goal 3:</strong> [Progress update]</li>
      </ul>
      
      <h3>Tomorrow's Focus</h3>
      <p>[What do you want to focus on tomorrow?]</p>
      
      <h3>Reflection</h3>
      <p>[Overall reflection on the day - what went well, what could be improved]</p>
    `,
    plainTextContent: `Daily Journal\n\nDate: [Date]\nWeather: [Weather]\nMood: [Mood]\n\nGratitude:\nToday I'm grateful for:\n1. [Gratitude Item 1]\n2. [Gratitude Item 2]\n3. [Gratitude Item 3]\n\nToday's Highlights:\n- [Highlight 1]\n- [Highlight 2]\n- [Highlight 3]\n\nChallenges & Lessons:\nChallenge: [Describe a challenge you faced today]\nLesson Learned: [What did you learn from this challenge?]\n\nGoals & Progress:\n- Goal 1: [Progress update]\n- Goal 2: [Progress update]\n- Goal 3: [Progress update]\n\nTomorrow's Focus:\n[What do you want to focus on tomorrow?]\n\nReflection:\n[Overall reflection on the day - what went well, what could be improved]`,
    description: 'Personal daily journal template for reflection and gratitude practice',
    category: 'personal',
    icon: 'book-open',
    color: '#F59E0B',
    isPublic: true
  },
  {
    title: 'Recipe Notes',
    content: `
      <h2>Recipe Notes</h2>
      <p><strong>Recipe Name:</strong> [Recipe Name]</p>
      <p><strong>Cuisine:</strong> [Cuisine Type]</p>
      <p><strong>Prep Time:</strong> [Prep Time]</p>
      <p><strong>Cook Time:</strong> [Cook Time]</p>
      <p><strong>Servings:</strong> [Number of Servings]</p>
      <p><strong>Difficulty:</strong> [Easy/Medium/Hard]</p>
      
      <h3>Ingredients</h3>
      <ul>
        <li>[Ingredient 1] - [Amount]</li>
        <li>[Ingredient 2] - [Amount]</li>
        <li>[Ingredient 3] - [Amount]</li>
        <li>[Ingredient 4] - [Amount]</li>
        <li>[Ingredient 5] - [Amount]</li>
      </ul>
      
      <h3>Instructions</h3>
      <ol>
        <li>[Step 1]</li>
        <li>[Step 2]</li>
        <li>[Step 3]</li>
        <li>[Step 4]</li>
        <li>[Step 5]</li>
      </ol>
      
      <h3>Cooking Tips</h3>
      <ul>
        <li>[Tip 1]</li>
        <li>[Tip 2]</li>
        <li>[Tip 3]</li>
      </ul>
      
      <h3>Variations</h3>
      <p><strong>Variation 1:</strong> [Description of variation]</p>
      <p><strong>Variation 2:</strong> [Description of variation]</p>
      
      <h3>Notes & Modifications</h3>
      <p>[Any personal notes, modifications, or observations about the recipe]</p>
      
      <h3>Rating</h3>
      <p><strong>Overall Rating:</strong> [1-5 stars]</p>
      <p><strong>Would Make Again:</strong> [Yes/No]</p>
    `,
    plainTextContent: `Recipe Notes\n\nRecipe Name: [Recipe Name]\nCuisine: [Cuisine Type]\nPrep Time: [Prep Time]\nCook Time: [Cook Time]\nServings: [Number of Servings]\nDifficulty: [Easy/Medium/Hard]\n\nIngredients:\n- [Ingredient 1] - [Amount]\n- [Ingredient 2] - [Amount]\n- [Ingredient 3] - [Amount]\n- [Ingredient 4] - [Amount]\n- [Ingredient 5] - [Amount]\n\nInstructions:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n4. [Step 4]\n5. [Step 5]\n\nCooking Tips:\n- [Tip 1]\n- [Tip 2]\n- [Tip 3]\n\nVariations:\n- Variation 1: [Description of variation]\n- Variation 2: [Description of variation]\n\nNotes & Modifications:\n[Any personal notes, modifications, or observations about the recipe]\n\nRating:\nOverall Rating: [1-5 stars]\nWould Make Again: [Yes/No]`,
    description: 'Comprehensive recipe template with ingredients, instructions, and cooking notes',
    category: 'lifestyle',
    icon: 'chef-hat',
    color: '#EF4444',
    isPublic: true
  },
  {
    title: 'Book Review',
    content: `
      <h2>Book Review</h2>
      <p><strong>Book Title:</strong> [Book Title]</p>
      <p><strong>Author:</strong> [Author Name]</p>
      <p><strong>Genre:</strong> [Genre]</p>
      <p><strong>Pages:</strong> [Number of Pages]</p>
      <p><strong>Published:</strong> [Publication Year]</p>
      <p><strong>My Rating:</strong> [1-5 stars]</p>
      
      <h3>Summary</h3>
      <p>[Brief summary of the book without spoilers]</p>
      
      <h3>Key Themes</h3>
      <ul>
        <li>[Theme 1]</li>
        <li>[Theme 2]</li>
        <li>[Theme 3]</li>
      </ul>
      
      <h3>Favorite Quotes</h3>
      <blockquote>"[Quote 1]"</blockquote>
      <blockquote>"[Quote 2]"</blockquote>
      <blockquote>"[Quote 3]"</blockquote>
      
      <h3>What I Liked</h3>
      <ul>
        <li>[Positive aspect 1]</li>
        <li>[Positive aspect 2]</li>
        <li>[Positive aspect 3]</li>
      </ul>
      
      <h3>What I Didn't Like</h3>
      <ul>
        <li>[Negative aspect 1]</li>
        <li>[Negative aspect 2]</li>
        <li>[Negative aspect 3]</li>
      </ul>
      
      <h3>Key Takeaways</h3>
      <ul>
        <li>[Takeaway 1]</li>
        <li>[Takeaway 2]</li>
        <li>[Takeaway 3]</li>
      </ul>
      
      <h3>Recommendation</h3>
      <p><strong>Would I recommend this book?</strong> [Yes/No/Maybe]</p>
      <p><strong>To whom?</strong> [Target audience]</p>
      
      <h3>Personal Notes</h3>
      <p>[Any personal thoughts, connections, or reflections]</p>
    `,
    plainTextContent: `Book Review\n\nBook Title: [Book Title]\nAuthor: [Author Name]\nGenre: [Genre]\nPages: [Number of Pages]\nPublished: [Publication Year]\nMy Rating: [1-5 stars]\n\nSummary:\n[Brief summary of the book without spoilers]\n\nKey Themes:\n- [Theme 1]\n- [Theme 2]\n- [Theme 3]\n\nFavorite Quotes:\n"[Quote 1]"\n"[Quote 2]"\n"[Quote 3]"\n\nWhat I Liked:\n- [Positive aspect 1]\n- [Positive aspect 2]\n- [Positive aspect 3]\n\nWhat I Didn't Like:\n- [Negative aspect 1]\n- [Negative aspect 2]\n- [Negative aspect 3]\n\nKey Takeaways:\n- [Takeaway 1]\n- [Takeaway 2]\n- [Takeaway 3]\n\nRecommendation:\nWould I recommend this book? [Yes/No/Maybe]\nTo whom? [Target audience]\n\nPersonal Notes:\n[Any personal thoughts, connections, or reflections]`,
    description: 'Structured book review template with ratings, quotes, and personal insights',
    category: 'personal',
    icon: 'book',
    color: '#8B5CF6',
    isPublic: true
  }
];

// Connect to MongoDB
mongoose.connect('mongodb+srv://zeeshantidi259:hyperking@cluster0.s17pj.mongodb.net/evernote-clone?retryWrites=true&w=majority')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

async function migrateTemplates() {
  try {
    console.log('Starting template migration...');
    
    // Get the first user (or create a default user if needed)
    let user = await User.findOne();
    if (!user) {
      console.log('No users found. Creating a default user...');
      user = new User({
        name: 'Default User',
        email: 'default@example.com',
        password: 'defaultpassword123'
      });
      await user.save();
    }
    
    console.log(`Using user: ${user.name} (${user.email})`);
    
    // Check if templates already exist
    const existingTemplates = await Template.find();
    if (existingTemplates.length > 0) {
      console.log(`Found ${existingTemplates.length} existing templates. Skipping migration.`);
      return;
    }
    
    // Create templates
    const createdTemplates = [];
    for (const templateData of sampleTemplates) {
      const template = new Template({
        ...templateData,
        userId: user._id,
        tags: [], // No tags for now
        collaborators: [],
        metadata: {}
      });
      
      await template.save();
      createdTemplates.push(template);
      console.log(`Created template: ${template.title}`);
    }
    
    console.log(`Successfully created ${createdTemplates.length} templates!`);
    
    // Display created templates
    console.log('\nCreated Templates:');
    createdTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.title} (${template.category})`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run migration
migrateTemplates(); 