
const express = require("express");
const cors = require("cors");

const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { noteRouter } = require("./routes/note.route");
const { auth } = require("./midddlewere/auth.middlewere");

const app = express();

// CORS Configuration
const allowedOrigins = [
  "https://notesapp-khaki-ten.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without an origin (such as Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Allow deployed Vercel frontend
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow local development
    if (/^http:\/\/localhost:517[0-9]+$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware
app.use(express.json());

// User Routes
app.use("/user", userRouter);

// Home Route
app.get("/home", (req, res) => {
  res.send({
    msg: "Welcome to Note Application"
  });
});

// Authentication Middleware
app.use(auth);

// Dashboard Route
app.get("/dashboard", (req, res) => {
  res.send({
    msg: "Welcome to Note Application"
  });
});

// Notes Routes
app.use("/notes", noteRouter);

// Start Server
const startServer = async () => {
  try {
    await connection;

    console.log("Database connected");

    const PORT = process.env.PORT || 8080;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server started on port ${PORT}`);
    });

  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
