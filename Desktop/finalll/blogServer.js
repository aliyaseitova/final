const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Define Blog Post Schema
const BlogPostSchema = new mongoose.Schema({
    title: String,
    content: String,
});
const BlogPost = mongoose.model("BlogPost", BlogPostSchema);

// Get All Posts
router.get("/api/posts", async (req, res) => {
    const posts = await BlogPost.find();
    res.json(posts);
});

// Create a Post
router.post("/api/posts", async (req, res) => {
    const { title, content } = req.body;
    const newPost = new BlogPost({ title, content });
    await newPost.save();
    res.json({ success: true });
});

// Update a Post
router.put("/api/posts/:id", async (req, res) => {
    const { title, content } = req.body;
    await BlogPost.findByIdAndUpdate(req.params.id, { title, content });
    res.json({ success: true });
});

// Delete a Post
router.delete("/api/posts/:id", async (req, res) => {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

module.exports = router;
