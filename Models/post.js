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
    isGhost: {
        type: Boolean,
        default: false
    }
});

const Post = mongoose.model("Post", postSchema);

export default Post;
