
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");

const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { noteRouter } = require("./routes/note.route");
const { auth } = require("./midddlewere/auth.middlewere");

const app = express();

app.use(cors());
app.use(express.json());

// Public routes
app.use("/user", userRouter);

app.get("/home", (req, res) => {
  res.send({ msg: "Welcome to Note Application" });
});

// Protected routes
app.use(auth);

app.get("/dashboard", (req, res) => {
  res.send({ msg: "Welcome to Note Application" });
});

app.use("/notes", noteRouter);

app.get("/test-notes", (req, res) => {
  res.send("Notes route is working");
});

app.listen(8080, async () => {
  console.log("Server started on port 8080");

  try {
    await connection;
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection failed:", error.message);
  }
});
