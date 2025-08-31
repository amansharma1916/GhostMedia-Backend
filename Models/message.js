import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isGhost: {
        type: Boolean,
        default: false  // For messages that auto-delete after being read
    },
    // If it's a ghost message, it will expire after this date
    expirationDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Create a compound index for efficient querying of chat history
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, sender: 1 });

// Create an index for easy access to unread messages for a user
messageSchema.index({ receiver: 1, isRead: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
