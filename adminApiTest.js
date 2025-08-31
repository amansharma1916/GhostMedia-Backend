import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'secureAdminPassword';

// Test admin login
async function testAdminLogin() {
    console.log('Testing admin login...');

    try {
        const response = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: ADMIN_USERNAME,
                password: ADMIN_PASSWORD
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Admin login successful');
            return data.token;
        } else {
            console.log('❌ Admin login failed:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error testing admin login:', error);
        return null;
    }
}

// Test getting users
async function testGetUsers(token) {
    console.log('\nTesting get users...');

    try {
        const response = await fetch(`${BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Successfully retrieved users');
            console.log(`Total users: ${data.totalUsers}`);
            if (data.users.length > 0) {
                console.log('Sample user:', {
                    id: data.users[0]._id,
                    username: data.users[0].username,
                    email: data.users[0].email
                });
            }
            return true;
        } else {
            console.log('❌ Failed to get users:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error testing get users:', error);
        return false;
    }
}

// Test getting posts
async function testGetPosts(token) {
    console.log('\nTesting get posts...');

    try {
        const response = await fetch(`${BASE_URL}/admin/posts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Successfully retrieved posts');
            console.log(`Total posts: ${data.totalPosts || 'N/A'}`);
            if (data.posts && data.posts.length > 0) {
                console.log('Sample post:', {
                    id: data.posts[0]._id,
                    username: data.posts[0].username,
                    content: data.posts[0].content.substring(0, 30) + '...'
                });
            }
            return true;
        } else {
            console.log('❌ Failed to get posts:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Error testing get posts:', error);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('🔍 ADMIN API TEST SUITE');
    console.log('====================\n');

    // Test 1: Admin Login
    const token = await testAdminLogin();

    if (!token) {
        console.log('\n❌ Tests failed: Could not login as admin');
        return;
    }

    // Test 2: Get Users
    const usersSuccess = await testGetUsers(token);

    // Test 3: Get Posts
    const postsSuccess = await testGetPosts(token);

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('====================');
    console.log(`Admin Login: ${token ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Get Users: ${usersSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Get Posts: ${postsSuccess ? '✅ PASSED' : '❌ FAILED'}`);

    const allPassed = token && usersSuccess && postsSuccess;
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

// Run the tests
runTests();
