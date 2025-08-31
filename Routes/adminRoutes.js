import express from 'express';
import User from '../Models/user.js';
import Post from '../Models/post.js';
import Friend from '../Models/friend.js';
import Message from '../Models/message.js';

const router = express.Router();

// Admin authentication middleware
const validateAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // We're just checking if it's a valid admin token here
        // In a real application, you'd verify the token with JWT
        if (token === 'admin-authenticated') {
            next();
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token. Access denied.' });
    }
};

// Check if credentials match admin credentials
const isAdmin = (req, res, next) => {
    const { username, password } = req.body;

    // Check against environment variables
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ message: 'Invalid admin credentials' });
    }
};

// Admin login route
router.post('/admin/login', isAdmin, (req, res) => {
    // Generate a simple token
    // In a real application, you'd use JWT with proper encryption
    res.status(200).json({
        message: 'Admin login successful',
        success: true,
        token: 'admin-authenticated'
    });
});

// Get all users with pagination and search
router.get('/admin/users', validateAdminToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Create search filter if search term is provided
        const searchFilter = search ? {
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        // Count total documents for pagination
        const totalUsers = await User.countDocuments(searchFilter);

        // Fetch users with pagination, excluding password field
        const users = await User.find(searchFilter, { passwordHash: 0 })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user status (ban/unban)
router.patch('/admin/users/:id', validateAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'banned'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true, select: '-passwordHash' }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: `User ${status === 'banned' ? 'banned' : 'activated'} successfully`,
            user
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get posts by username with pagination and search
router.get('/admin/posts/:username', validateAdminToken, async (req, res) => {
    try {
        const { username } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Create search filter
        const searchFilter = {
            username,
            ...(search && { content: { $regex: search, $options: 'i' } })
        };

        // Count total documents for pagination
        const totalPosts = await Post.countDocuments(searchFilter);

        // Fetch posts with pagination
        const posts = await Post.find(searchFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all posts with pagination and search
router.get('/admin/posts', validateAdminToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Create search filter if search term is provided
        const searchFilter = search ? { content: { $regex: search, $options: 'i' } } : {};

        // Count total documents for pagination
        const totalPosts = await Post.countDocuments(searchFilter);

        // Fetch posts with pagination
        const posts = await Post.find(searchFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a post
router.delete('/admin/posts/:id', validateAdminToken, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByIdAndDelete(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({
            message: 'Post deleted successfully',
            postId: id
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a user and all their associated data
router.delete('/admin/users/:id', validateAdminToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Find the user to get the username
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const username = user.username;

        // Delete all posts by this user
        const postsDeleteResult = await Post.deleteMany({ username });

        // Delete all friend relationships where user is sender or receiver
        const friendsDeleteResult = await Friend.deleteMany({
            $or: [
                { sender: username },
                { receiver: username }
            ]
        });

        // Delete all messages where user is sender or receiver
        const messagesDeleteResult = await Message.deleteMany({
            $or: [
                { sender: username },
                { receiver: username }
            ]
        });

        // Delete the user
        await User.findByIdAndDelete(id);

        res.status(200).json({
            message: 'User and all associated data deleted successfully',
            userId: id,
            username: username,
            postsDeleted: postsDeleteResult.deletedCount,
            friendshipsDeleted: friendsDeleteResult.deletedCount,
            messagesDeleted: messagesDeleteResult.deletedCount
        });
    } catch (error) {
        console.error('Error deleting user and associated data:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
