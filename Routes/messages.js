import express from 'express';
import auth from '../middleware/auth.js';
import User from '../Models/user.js';
import Message from '../Models/message.js';

const router = express.Router();

// Get conversations for a user
// Get conversations for a user
router.get('/conversations/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Find all messages where the user is either sender or recipient
        const messages = await Message.find({
            $or: [
                { sender: username },
                { receiver: username }
            ]
        }).sort({ timestamp: -1 });

        // Create a map of conversations
        const conversationMap = new Map();

        messages.forEach(message => {
            const otherUser = message.sender === username ? message.receiver : message.sender;

            if (!conversationMap.has(otherUser)) {
                conversationMap.set(otherUser, {
                    recipientId: otherUser,
                    lastMessage: message.content,
                    timestamp: message.timestamp,
                    unread: message.receiver === username && !message.read ? 1 : 0
                });
            } else if (!message.read && message.receiver === username) {
                // Increment unread count for existing conversation
                const convo = conversationMap.get(otherUser);
                convo.unread += 1;
                conversationMap.set(otherUser, convo);
            }
        });

        // Convert map to array and sort by timestamp
        const conversations = Array.from(conversationMap.values()).sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        res.status(200).json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages between two users
// Get messages between two users
router.get('/:sender/:recipient', async (req, res) => {
    try {
        const { sender, recipient } = req.params;

        // Validate both users exist
        const senderExists = await User.findOne({ username: sender });
        const recipientExists = await User.findOne({ username: recipient });

        if (!senderExists || !recipientExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find all messages between the two users
        const messages = await Message.find({
            $or: [
                { sender, receiver: recipient },
                { sender: recipient, receiver: sender }
            ]
        }).sort({ timestamp: 1 });

        // Mark messages as read
        await Message.updateMany(
            { sender: recipient, receiver: sender, read: false },
            { $set: { read: true } }
        );

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send a message
// Send a message
router.post('/', async (req, res) => {
    try {
        const { sender, recipient, content } = req.body;

        if (!sender || !recipient || !content) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate both users exist
        const senderExists = await User.findOne({ username: sender });
        const recipientExists = await User.findOne({ username: recipient });

        if (!senderExists || !recipientExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create and save the message
        const newMessage = new Message({
            sender,
            receiver: recipient,
            content,
            timestamp: new Date(),
            read: false
        });

        await newMessage.save();

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark messages as read
// Mark messages as read
router.put('/read/:sender/:recipient', async (req, res) => {
    try {
        const { sender, recipient } = req.params;

        // Mark all messages from sender to recipient as read
        const result = await Message.updateMany(
            { sender, receiver: recipient, read: false },
            { $set: { read: true } }
        );

        res.status(200).json({
            message: 'Messages marked as read',
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
