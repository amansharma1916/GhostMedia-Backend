import express from "express";
import connectDB from "./Config/db.js";
import User from "./Models/user.js";
import bcrypt from "bcrypt";
import cors from "cors";
import Post from "./Models/post.js";
import { Server } from "socket.io";
import dotenv from "dotenv";
import http from "http";
import Friend from "./Models/friend.js";


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

  // Username tracking for real-time updates
  let currentUsername = null;
  // Map to keep track of online users and their socket IDs
  const onlineUsers = new Map();

  socket.on("userConnected", (username) => {
    if (!username) return;

    currentUsername = username;
    // Join a room with the username for targeted events
    socket.join(username);
    // Add user to online users map
    onlineUsers.set(username, socket.id);
    console.log(`User ${username} connected and joined room`);

    // Fetch pending requests when user connects
    socket.emit("refreshFriendRequests");
  });

  socket.on("newPost", (post) => {
    io.emit("postAdded", post);
  });

  socket.on("friendRequest", (data) => {
    // Emit to the specific user's room
    io.to(data.receiver).emit("friendRequestEvent", {
      sender: data.sender,
      receiver: data.receiver,
      message: `${data.sender} sent you a friend request`,
      requestId: data.requestId
    });

    // Also send to sender to update their UI
    io.to(data.sender).emit("friendRequestSent", {
      receiver: data.receiver,
      requestId: data.requestId
    });
  });

  // Handle user typing notification for future chat feature
  socket.on("userTyping", (data) => {
    if (data.to && onlineUsers.has(data.to)) {
      io.to(data.to).emit("userTypingEvent", {
        from: currentUsername,
        isTyping: data.isTyping
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
    if (currentUsername) {
      socket.leave(currentUsername);
      // Remove from online users map
      onlineUsers.delete(currentUsername);
    }
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
  const { username, content, ghostMode, userAvatar } = req.body;
  if (!username || !content) {
    return res.status(400).json({ message: "Username and content are required" });
  }

  try {
    const post = new Post({
      username,
      content,
      isGhost: ghostMode || false,  // Store ghost mode in isGhost field
      userAvatar
    });
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

// Get posts by specific user
app.get("/api/user/posts/:username", async (req, res) => {
  const { username } = req.params;

  try {
    // Find posts by this user
    const userPosts = await Post.find({ username }).sort({ createdAt: -1 });
    res.json(userPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/getUser/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      passwordHash: user.passwordHash,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Edit post
app.put("/api/post/:postId", async (req, res) => {
  const { postId } = req.params;
  const { content, isGhost, username } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  try {
    // First check if the post exists and belongs to the user
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.username !== username) {
      return res.status(403).json({ message: "Not authorized to edit this post" });
    }

    // Update the post
    post.content = content;
    post.isGhost = isGhost || false;
    post.updatedAt = Date.now();

    await post.save();

    // Emit post updated event
    io.emit("postUpdated", post);

    res.json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete post
app.delete("/api/post/:postId", async (req, res) => {
  const { postId } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    // Check if the post exists and belongs to the user
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.username !== username) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);

    // Emit post deleted event
    io.emit("postDeleted", { _id: postId });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/updateUserProfile/:username", async (req, res) => {
  const { username } = req.params;
  const { username: newUsername, password, email } = req.body;

  try {
    const updateFields = {};
    if (newUsername) updateFields.username = newUsername;
    if (password) updateFields.passwordHash = await bcrypt.hash(password, 10);
    if (email) updateFields.email = email;


    const user = await User.findOneAndUpdate(
      { username },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/searchFriend/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const users = await User.find({
      username: { $regex: `^${username}`, $options: "i" }
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Map users to only the fields you want to return

    const result = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/sendFriendRequest", async (req, res) => {
  const { sender, receiver } = req.body;

  if (!sender || !receiver) {
    return res.status(400).json({ message: "User IDs are required" });
  }

  try {
    // Check if users are already friends or have pending requests
    const existingRequest = await Friend.findOne({
      $or: [
        { sender, receiver, status: { $in: ["pending", "accepted"] } },
        { sender: receiver, receiver: sender, status: { $in: ["pending", "accepted"] } }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === "accepted") {
        return res.status(409).json({ message: "You are already friends with this user" });
      } else if (existingRequest.sender === sender) {
        return res.status(409).json({ message: "Friend request already sent", status: "pending" });
      } else {
        // The other user has sent a request to this user
        return res.status(409).json({ message: "This user has already sent you a request", status: "received" });
      }
    }

    const friendRequest = new Friend({ sender, receiver });
    await friendRequest.save();

    // Emit socket event for real-time notification - use the friendRequest event
    io.to(receiver).emit("friendRequestEvent", {
      sender,
      receiver,
      message: `${sender} sent you a friend request`,
      requestId: friendRequest._id
    });

    // Also notify sender's UI to update
    io.to(sender).emit("friendRequestSent", {
      receiver,
      requestId: friendRequest._id
    });

    // Return both status and message
    return res.status(201).json({
      message: "Friend request sent successfully",
      status: friendRequest.status
    });
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

// Check friendship status endpoint
app.get("/api/checkFriendshipStatus/:currentUser/:otherUser", async (req, res) => {
  const { currentUser, otherUser } = req.params;

  if (!currentUser || !otherUser) {
    return res.status(400).json({ message: "Both usernames are required" });
  }

  try {
    const friendshipStatus = await Friend.findOne({
      $or: [
        { sender: currentUser, receiver: otherUser },
        { sender: otherUser, receiver: currentUser }
      ]
    });

    if (!friendshipStatus) {
      return res.json({ status: "none" });
    }

    let status = friendshipStatus.status;
    let direction = "none";

    if (status === "pending") {
      direction = friendshipStatus.sender === currentUser ? "sent" : "received";
    }

    return res.json({
      status,
      direction,
      updatedAt: friendshipStatus.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all pending received friend requests for a user
app.get("/api/friendRequests/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const requests = await Friend.find({
      receiver: username,
      status: "pending"
    });

    // Get all sender details
    const requestDetails = await Promise.all(requests.map(async (req) => {
      const senderInfo = await User.findOne({ username: req.sender });
      return {
        id: req._id,
        sender: req.sender,
        createdAt: req.createdAt,
        profilePicture: senderInfo ? senderInfo.profilePicture : ""
      };
    }));

    return res.json(requestDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all pending sent friend requests by a user
app.get("/api/sentFriendRequests/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const requests = await Friend.find({
      sender: username,
      status: "pending"
    });

    // Get all receiver details
    const requestDetails = await Promise.all(requests.map(async (req) => {
      const receiverInfo = await User.findOne({ username: req.receiver });
      return {
        id: req._id,
        receiver: req.receiver,
        createdAt: req.createdAt,
        profilePicture: receiverInfo ? receiverInfo.profilePicture : ""
      };
    }));

    return res.json(requestDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all friends of a user (accepted friend requests)
app.get("/api/friends/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const friendships = await Friend.find({
      $or: [
        { sender: username, status: "accepted" },
        { receiver: username, status: "accepted" }
      ]
    });

    // Get friend details for each friendship
    const friendDetails = await Promise.all(friendships.map(async (friendship) => {
      const friendUsername = friendship.sender === username ? friendship.receiver : friendship.sender;
      const friendInfo = await User.findOne({ username: friendUsername });

      return {
        id: friendship._id,
        username: friendUsername,
        profilePicture: friendInfo ? friendInfo.profilePicture : "",
        since: friendship.updatedAt
      };
    }));

    return res.json(friendDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Accept or decline a friend request
app.post("/api/respondToFriendRequest/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const { action, username } = req.body;

  if (!requestId || !action || !username) {
    return res.status(400).json({ message: "Missing required information" });
  }

  try {
    const request = await Friend.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the user is the receiver of this request
    if (request.receiver !== username) {
      return res.status(403).json({ message: "Not authorized to respond to this request" });
    }

    if (action === "accept") {
      request.status = "accepted";
      await request.save();

      // Emit socket event for real-time notification of friend status change
      // Send to both users' rooms for targeted delivery
      io.to(request.sender).emit("friendStatusChange", {
        usernames: [request.sender, request.receiver],
        action: "accepted",
        message: `${username} accepted your friend request`
      });

      io.to(request.receiver).emit("friendStatusChange", {
        usernames: [request.sender, request.receiver],
        action: "accepted",
        message: `You accepted ${request.sender}'s friend request`
      });

      return res.json({ message: "Friend request accepted", status: "accepted" });
    } else if (action === "decline") {
      await Friend.findByIdAndDelete(requestId);

      // Emit socket event for real-time notification
      // Send to both users' rooms for targeted delivery
      io.to(request.sender).emit("friendStatusChange", {
        usernames: [request.sender, request.receiver],
        action: "declined",
        message: `${username} declined your friend request`
      });

      io.to(request.receiver).emit("friendStatusChange", {
        usernames: [request.sender, request.receiver],
        action: "declined",
        message: `You declined ${request.sender}'s friend request`
      });

      return res.json({ message: "Friend request declined", status: "declined" });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel a sent friend request
app.delete("/api/cancelFriendRequest/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const { username } = req.body;

  if (!requestId || !username) {
    return res.status(400).json({ message: "Missing required information" });
  }

  try {
    const request = await Friend.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the user is the sender of this request
    if (request.sender !== username) {
      return res.status(403).json({ message: "Not authorized to cancel this request" });
    }

    // Only pending requests can be cancelled
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be cancelled" });
    }

    await Friend.findByIdAndDelete(requestId);
    return res.json({ message: "Friend request cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unfriend a user
app.delete("/api/unfriend/:friendshipId", async (req, res) => {
  const { friendshipId } = req.params;
  const { username } = req.body;

  if (!friendshipId || !username) {
    return res.status(400).json({ message: "Missing required information" });
  }

  try {
    const friendship = await Friend.findById(friendshipId);

    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    // Verify the user is part of this friendship
    if (friendship.sender !== username && friendship.receiver !== username) {
      return res.status(403).json({ message: "Not authorized to remove this friendship" });
    }

    // Only accepted friendships can be removed
    if (friendship.status !== "accepted") {
      return res.status(400).json({ message: "This is not an active friendship" });
    }

    // Determine the other user in the friendship
    const otherUser = friendship.sender === username ? friendship.receiver : friendship.sender;

    await Friend.findByIdAndDelete(friendshipId);

    // Emit socket event for real-time notification
    // Send to both users' rooms for targeted delivery
    io.to(username).emit("friendStatusChange", {
      usernames: [username, otherUser],
      action: "unfriended",
      message: `You removed ${otherUser} from your friends list`
    });

    io.to(otherUser).emit("friendStatusChange", {
      usernames: [username, otherUser],
      action: "unfriended",
      message: `${username} removed you from their friends list`
    });

    return res.json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} 🚀`));
