
const express = require("express");
const { noteModel } = require("../model/note.model");

const noteRouter = express.Router();

// CREATE NOTE
noteRouter.post("/create", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).send({
        msg: "Title and description are required"
      });
    }

    const note = new noteModel({
      userId: req.userId,
      title,
      description
    });

    await note.save();

    res.status(201).send({
      msg: "Note created successfully",
      note
    });

 } catch (error) {
  console.log("CREATE NOTE ERROR:", error);

  res.status(500).send({
    msg: "Something went wrong",
    error: error.message
  });
}
});

// GET ALL NOTES
noteRouter.get("/", async (req, res) => {
  try {
    const notes = await noteModel.find({
      userId: req.userId
    }).sort({ createdAt: -1 });

    res.send({ notes });

  } catch (error) {
    console.log("GET NOTES ERROR:", error);
    res.status(500).send({
      msg: "Something went wrong",
      error: error.message
    });
  }
});

// UPDATE NOTE
noteRouter.put("/update/:id", async (req, res) => {
  try {
    const { title, description } = req.body;

    const note = await noteModel.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId
      },
      {
        title,
        description
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!note) {
      return res.status(404).send({
        msg: "Note not found"
      });
    }

    res.send({
      msg: "Note updated successfully",
      note
    });

  } catch (error) {
    res.status(500).send({
      msg: "Something went wrong"
    });
  }
});

// DELETE NOTE
noteRouter.delete("/delete/:id", async (req, res) => {
  try {
    const note = await noteModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!note) {
      return res.status(404).send({
        msg: "Note not found"
      });
    }

    res.send({
      msg: "Note deleted successfully"
    });

  } catch (error) {
    res.status(500).send({
      msg: "Something went wrong"
    });
  }
});

module.exports = { noteRouter };
