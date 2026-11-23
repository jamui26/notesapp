const express = require("express");
const mongoose = require("mongoose");
const { noteModel } = require("../model/note.model");

const noteRouter = express.Router();

const validNoteInput = (title, description) =>
  typeof title === "string" &&
  typeof description === "string" &&
  Boolean(title.trim()) &&
  Boolean(description.trim()) &&
  title.trim().length <= 100 &&
  description.trim().length <= 2000;

noteRouter.get("/", async (req, res) => {
  try {
    const notes = await noteModel.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.send({ notes });
  } catch (error) {
    console.error("Loading notes failed:", error.message);
    return res.status(500).send({ msg: "Unable to load notes" });
  }
});

noteRouter.post("/create", async (req, res) => {
  const { title, description } = req.body || {};
  if (!validNoteInput(title, description)) {
    return res.status(400).send({
      msg: "Title and description are required and must be within their character limits"
    });
  }

  try {
    const note = await noteModel.create({
      userId: req.userId,
      title: title.trim(),
      description: description.trim()
    });
    return res.status(201).send({ msg: "Note created successfully", note });
  } catch (error) {
    console.error("Creating note failed:", error.message);
    return res.status(500).send({ msg: "Unable to create note" });
  }
});

noteRouter.put("/update/:id", async (req, res) => {
  const { title, description } = req.body || {};
  if (!validNoteInput(title, description)) {
    return res.status(400).send({
      msg: "Title and description are required and must be within their character limits"
    });
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send({ msg: "Invalid note ID" });
  }

  try {
    const note = await noteModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title: title.trim(), description: description.trim() },
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).send({ msg: "Note not found" });
    }
    return res.send({ msg: "Note updated successfully", note });
  } catch (error) {
    console.error("Updating note failed:", error.message);
    return res.status(500).send({ msg: "Unable to update note" });
  }
});

noteRouter.delete("/delete/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send({ msg: "Invalid note ID" });
  }

  try {
    const note = await noteModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    if (!note) {
      return res.status(404).send({ msg: "Note not found" });
    }
    return res.send({ msg: "Note deleted successfully" });
  } catch (error) {
    console.error("Deleting note failed:", error.message);
    return res.status(500).send({ msg: "Unable to delete note" });
  }
});

module.exports = { noteRouter };
