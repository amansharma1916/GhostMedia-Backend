/**
 * This is a simple test script for the admin API endpoints
 * You can run it with Node.js to test if the endpoints are working correctly
 */

import fetch from 'node-fetch';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
let adminToken = null;

// Utility function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
    try {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers,
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(body);
        }

        console.log(`Making ${method} request to ${endpoint}`);
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();

        return {
            status: response.status,
            data
        };
    } catch (error) {
        console.error('API Request Error:', error.message);
        return {
            status: 500,
            data: { message: error.message }
        };
    }
}

// Admin login test
async function testAdminLogin(username, password) {
    console.log('\n--- Testing Admin Login ---');

    const result = await apiRequest('/admin/login', 'POST', { username, password });

    if (result.status === 200 && result.data.success) {
        console.log('✅ Admin login successful');
        adminToken = result.data.token;
        return true;
    } else {
        console.log('❌ Admin login failed:', result.data.message);
        return false;
    }
}

// Test getting all users
async function testGetUsers() {
    console.log('\n--- Testing Get All Users ---');

    if (!adminToken) {
        console.log('❌ No admin token available. Login first.');
        return;
    }

    const result = await apiRequest('/admin/users', 'GET', null, adminToken);

    if (result.status === 200) {
        console.log('✅ Successfully fetched users');
        console.log(`Total users: ${result.data.totalUsers}`);
        console.log('First 3 users:');
        console.log(result.data.users.slice(0, 3).map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            status: user.status || 'active'
        })));
    } else {
        console.log('❌ Failed to fetch users:', result.data.message);
    }
}

// Test getting posts by username
async function testGetPostsByUsername(username) {
    console.log(`\n--- Testing Get Posts for User: ${username} ---`);

    if (!adminToken) {
        console.log('❌ No admin token available. Login first.');
        return;
    }

    const result = await apiRequest(`/admin/posts/${username}`, 'GET', null, adminToken);

    if (result.status === 200) {
        console.log('✅ Successfully fetched posts');
        console.log(`Total posts: ${result.data.totalPosts}`);
        console.log('First 3 posts:');
        console.log(result.data.posts.slice(0, 3).map(post => ({
            id: post._id,
            content: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
            isGhost: post.isGhost,
            createdAt: post.createdAt
        })));
    } else {
        console.log('❌ Failed to fetch posts:', result.data.message);
    }
}

// Main test function
async function runTests() {
    console.log('🔍 Admin API Test Script');
    console.log('=======================\n');

    // Get admin credentials
    rl.question('Enter admin username: ', (username) => {
        rl.question('Enter admin password: ', async (password) => {
            // 1. Test admin login
            const loginSuccess = await testAdminLogin(username, password);

            if (loginSuccess) {
                // 2. Test getting users
                await testGetUsers();

                // 3. Test getting posts by username
                rl.question('\nEnter a username to fetch posts for: ', async (testUsername) => {
                    await testGetPostsByUsername(testUsername);

                    console.log('\n✨ Tests completed!');
                    rl.close();
                });
            } else {
                console.log('\n❌ Login failed. Cannot proceed with other tests.');
                rl.close();
            }
        });
    });
}

// Run the tests
runTests();
