const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userModel } = require("../model/user.model");
const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).send({ msg: "Name, email, and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).send({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    await user.save();
    return res.status(201).send({ msg: "User registered successfully" });
  } catch (error) {
    console.error("Registration failed:", error.message);
    return res.status(500).send({ msg: "Something went wrong" });
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).send({ msg: "Email and password are required" });
    }

    const user = await userModel.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send({ msg: "Wrong credentials" });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || "coding"
    );
    return res.send({ msg: "User login successfully", token });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(500).send({ msg: "Something went wrong" });
  }
});

module.exports = { userRouter };
