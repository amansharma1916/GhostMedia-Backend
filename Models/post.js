import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    isGhost: {
        type: Boolean,
        default: false
    },
    userAvatar: {
        type: String,
        required: true
    },
    isEdited: {
        type: Boolean,
        default: false
    }
});

// Add a pre-save middleware to update the isEdited flag when content changes
postSchema.pre('save', function (next) {
    // If this is an existing document (not new) and the content was modified
    if (!this.isNew && this.isModified('content')) {
        this.isEdited = true;
        this.updatedAt = Date.now();
    }
    next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
