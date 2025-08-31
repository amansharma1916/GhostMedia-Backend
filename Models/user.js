import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true

        },
        email: {
            type: String,
            required: true,
            unique: true,


        },
        passwordHash: {
            type: String,
            required: true,
        },
        profilePicture: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ['active', 'banned'],
            default: 'active'
        }

    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
