
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { userModel } = require("../model/user.model");

const userRouter = express.Router();

// REGISTER
userRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send({
        msg: "All fields are required"
      });
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(409).send({
        msg: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 5);

    const user = new userModel({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).send({
      msg: "User registered successfully"
    });

  } catch (error) {
    res.status(500).send({
      msg: "Something went wrong"
    });
  }
});

// LOGIN
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).send({
        msg: "Signup first"
      });
    }

    const result = await bcrypt.compare(password, user.password);

    if (!result) {
      return res.status(401).send({
        msg: "Wrong credentials"
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      "coding"
    );

    res.send({
      msg: "User login successfully",
      token
    });

  } catch (error) {
    res.status(500).send({
      msg: "Something went wrong"
    });
  }
});

module.exports = { userRouter };
