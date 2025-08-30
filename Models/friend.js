import mongoose from "mongoose";

const friendSchema = new mongoose.Schema({
  sender: { type: String, ref: "User", required: true },
  receiver: { type: String, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "blocked"], default: "pending" },
}, { timestamps: true });

const Friend = mongoose.model("Friend", friendSchema);

export default Friend;
