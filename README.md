# GhostMedia

GhostMedia is a social media platform that allows users to share posts with an option to remain anonymous through "Ghost Mode". This application features user authentication, friend management, real-time updates via WebSockets, and profile customization.

## Features

- **User Authentication**: Register and login with secure password hashing
- **Ghost Mode**: Post content anonymously while hiding your identity
- **Friend System**: Send, accept, and decline friend requests
- **Real-time Updates**: Live notifications and post updates via Socket.io
- **Post Management**: Create, edit, and delete posts with ease
- **Profile Customization**: Upload profile pictures and update account settings

## Tech Stack

### Frontend
- React 19 with Vite
- React Router DOM for navigation
- Socket.io client for real-time connections
- Framer Motion for animations
- Lucide React for icons

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- Socket.io for WebSockets
- bcrypt for password hashing
- JWT for authentication
- CORS for cross-origin resource sharing

## Project Structure

```
ghostMedia/
│
├── backEnd/                    # Backend server code
│   ├── Config/                 # Database configuration
│   ├── middleware/             # Authentication middleware
│   ├── Models/                 # MongoDB data models
│   ├── server.js               # Main server entry point
│   └── package.json            # Backend dependencies
│
└── frontEnd/                   # Frontend React application
    ├── public/                 # Static assets
    └── src/
        ├── assets/             # Image assets
        ├── components/         # React components
        │   ├── User/           # User-specific components
        │   │   ├── Assets/     # User component assets
        │   │   ├── Features/   # Feature components like PostPage
        │   │   ├── image/      # User-related images
        │   │   └── Layout/     # Layout components
        │   └── Welcome/        # Login and registration components
        ├── context/            # React context for state management
        └── App.jsx             # Main application component
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- MongoDB instance
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ghostMedia.git
   cd ghostMedia
   ```

2. Install backend dependencies:
   ```
   cd backEnd
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   Frontend_URL=http://localhost:5173
   PORT=5000
   ```

4. Install frontend dependencies:
   ```
   cd ../frontEnd
   npm install
   ```

5. Create a `.env` file in the frontend directory:
   ```
   VITE_BASE_URL=http://localhost:5000
   VITE_API_URL=http://localhost:5000
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backEnd
   npm start
   ```

2. Start the frontend development server:
   ```
   cd frontEnd
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - User login

### User Profile
- `POST /api/updateProfileImage` - Update user profile picture
- `GET /api/getUser/:username` - Get user details
- `PUT /api/updateUserProfile/:username` - Update user profile

### Posts
- `POST /api/user/createPost` - Create a new post
- `GET /api/allPosts` - Get all posts
- `GET /api/user/posts/:username` - Get posts by specific user
- `PUT /api/post/:postId` - Edit a post
- `DELETE /api/post/:postId` - Delete a post

### Friends
- `POST /api/sendFriendRequest` - Send a friend request
- `GET /api/checkFriendshipStatus/:currentUser/:otherUser` - Check friendship status
- `GET /api/friendRequests/:username` - Get pending friend requests
- `GET /api/sentFriendRequests/:username` - Get sent friend requests
- `GET /api/friends/:username` - Get user's friends
- `POST /api/respondToFriendRequest/:requestId` - Accept or decline a friend request
- `DELETE /api/cancelFriendRequest/:requestId` - Cancel a sent friend request
- `DELETE /api/unfriend/:friendshipId` - Remove a friend

## Socket Events

- `userConnected` - When a user connects to the application
- `newPost` - When a new post is created
- `friendRequest` - When a friend request is sent
- `userTyping` - For future chat functionality
- `postAdded` - When a post is added
- `postUpdated` - When a post is updated
- `postDeleted` - When a post is deleted
- `friendRequestEvent` - When receiving a friend request
- `friendStatusChange` - When a friendship status changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

- [Your Name](https://github.com/yourusername)

---

Made with ❤️ by GhostMedia Team
