import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: String,
            required: true,
            ref: "User"
        },
        receiver: {
            type: String,
            required: true,
            ref: "User"
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Create a compound index for faster queries on conversations
messageSchema.index({ sender: 1, receiver: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
