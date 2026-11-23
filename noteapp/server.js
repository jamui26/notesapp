
const express = require("express");
const cors = require("cors");

const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { noteRouter } = require("./routes/note.route");
const { auth } = require("./midddlewere/auth.middlewere");

const app = express();

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176"
];

app.use(cors({
  origin: /^http:\/\/localhost:517[0-9]+$/,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

    app.listen(process.env.PORT || 8080, () => {
      console.log(
        `Server started on port ${process.env.PORT || 8080}`
      );
    });

  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
