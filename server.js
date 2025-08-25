import express from "express";
import connectDB from "./Config/db.js";
import User from "./Models/user.js";
import bcrypt from "bcrypt";
import cors from "cors";
import Post from "./Models/post.js";
import { Server } from "socket.io";
import dotenv from "dotenv";
import http from "http";   // ✅ you need this


dotenv.config();

const app = express();
const server = http.createServer(app); // ✅ wrap express with http server

// Connect to database
connectDB();

app.use(express.json());
app.use(cors({
  origin: process.env.Frontend_URL, 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, 
}));
// attach socket.io to http server
const io = new Server(server, {
  cors: {
    origin: process.env.Frontend_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("newPost", (post) => {
    io.emit("postAdded", post);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// Register
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUserEmail = await User.findOne({ email });
    const existingUserName = await User.findOne({ username });
    if (existingUserEmail) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    if (existingUserName) {
      return res.status(400).json({ message: "User with this username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ username, email, passwordHash, profilePicture: "" });
    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email, profilePicture: user.profilePicture },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update profile image
app.post("/api/updateProfileImage", async (req, res) => {
  const { username, profilePicture } = req.body;
  if (!username || !profilePicture) {
    return res.status(400).json({ message: "Username and profile picture are required" });
  }

  try {
    await User.findOneAndUpdate({ username }, { profilePicture });
    res.json({ message: "Profile picture updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create post
app.post("/api/user/createPost", async (req, res) => {
  const { username, content, ghostMode, image } = req.body;
  if (!username || !content) {
    return res.status(400).json({ message: "Username and content are required" });
  }

  try {
    const post = new Post({ username, content });
    await post.save();

    // Emit to all sockets
    io.emit("postAdded", post);

    res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all posts
app.get("/api/allPosts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("GhostMedia server is running...");
});

app.get("/ping", (req, res) => {
  res.send("Pong");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} 🚀`));
