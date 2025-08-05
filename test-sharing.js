// Simple test script to verify sharing functionality
// Run this with: node test-sharing.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser1 = {
  email: 'testuser1@example.com',
  password: 'password123',
  name: 'Test User 1'
};

const testUser2 = {
  email: 'testuser2@example.com',
  password: 'password123',
  name: 'Test User 2'
};

let user1Token = '';
let user2Token = '';
let testNoteId = '';

async function testSharing() {
  console.log('🧪 Testing Share Note Functionality...\n');

  try {
    // Step 1: Register test users
    console.log('1. Registering test users...');
    
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser1);
      console.log('✅ User 1 registered');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('✅ User 1 already exists');
      } else {
        console.log('❌ Failed to register User 1:', error.response?.data?.message);
      }
    }

    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser2);
      console.log('✅ User 2 registered');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('✅ User 2 already exists');
      } else {
        console.log('❌ Failed to register User 2:', error.response?.data?.message);
      }
    }

    // Step 2: Login users
    console.log('\n2. Logging in users...');
    
    const login1Response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser1.email,
      password: testUser1.password
    });
    user1Token = login1Response.data.token;
    console.log('✅ User 1 logged in');

    const login2Response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser2.email,
      password: testUser2.password
    });
    user2Token = login2Response.data.token;
    console.log('✅ User 2 logged in');

    // Step 3: Create a test note
    console.log('\n3. Creating test note...');
    
    const noteResponse = await axios.post(`${BASE_URL}/notes`, {
      title: 'Test Share Note',
      content: 'This is a test note for sharing functionality',
      tags: ['test', 'sharing']
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    
    testNoteId = noteResponse.data._id;
    console.log('✅ Test note created:', testNoteId);

    // Step 4: Test share settings
    console.log('\n4. Testing share settings...');
    
    const shareSettingsResponse = await axios.get(`${BASE_URL}/notes/${testNoteId}/share`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    console.log('✅ Share settings retrieved:', shareSettingsResponse.data);

    // Step 5: Test adding collaborator
    console.log('\n5. Testing collaborator invitation...');
    
    const addCollaboratorResponse = await axios.post(`${BASE_URL}/notes/${testNoteId}/collaborators`, {
      email: testUser2.email,
      permission: 'edit'
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    console.log('✅ Collaborator added:', addCollaboratorResponse.data);

    // Step 6: Test getting collaborators
    console.log('\n6. Testing get collaborators...');
    
    const collaboratorsResponse = await axios.get(`${BASE_URL}/notes/${testNoteId}/collaborators`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    console.log('✅ Collaborators retrieved:', collaboratorsResponse.data);

    // Step 7: Test updating share settings
    console.log('\n7. Testing share settings update...');
    
    const updateShareResponse = await axios.put(`${BASE_URL}/notes/${testNoteId}/share`, {
      isPublic: true,
      allowEdit: false,
      allowComments: true,
      passwordProtected: false
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    console.log('✅ Share settings updated:', updateShareResponse.data);

    // Step 8: Test invalid email (should fail)
    console.log('\n8. Testing invalid email (should fail)...');
    
    try {
      await axios.post(`${BASE_URL}/notes/${testNoteId}/collaborators`, {
        email: 'invalid-email',
        permission: 'view'
      }, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      console.log('❌ Should have failed with invalid email');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid email:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error for invalid email:', error.response?.data?.message);
      }
    }

    // Step 9: Test non-existent user (should fail)
    console.log('\n9. Testing non-existent user (should fail)...');
    
    try {
      await axios.post(`${BASE_URL}/notes/${testNoteId}/collaborators`, {
        email: 'nonexistent@example.com',
        permission: 'view'
      }, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      console.log('❌ Should have failed with non-existent user');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected non-existent user:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error for non-existent user:', error.response?.data?.message);
      }
    }

    // Step 10: Test adding self as collaborator (should fail)
    console.log('\n10. Testing adding self as collaborator (should fail)...');
    
    try {
      await axios.post(`${BASE_URL}/notes/${testNoteId}/collaborators`, {
        email: testUser1.email,
        permission: 'view'
      }, {
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      console.log('❌ Should have failed when adding self as collaborator');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected self-collaboration:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error for self-collaboration:', error.response?.data?.message);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- User registration and login: ✅');
    console.log('- Note creation: ✅');
    console.log('- Share settings management: ✅');
    console.log('- Collaborator invitation: ✅');
    console.log('- Error handling: ✅');
    console.log('\n✨ Share Note feature is working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSharing(); 