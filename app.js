import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';
import { body, param, validationResult } from 'express-validator';
const app = express();

const { Pool } = pkg;
dotenv.config();

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());

// Utility function for error responses
const handleErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// GET / - welcome message
app.get("/", (req, res) => {
    res.json({message: "Welcome to the blog API"});
});

// 📌 **GET all posts**
app.get("/posts", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching posts:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


// 📌 **GET a single post by ID (with validation)**
app.get(
    "/posts/:id",
    param("id").isInt().withMessage("Post ID must be an integer"),
    handleErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);

            if (result.rows.length === 0) return res.status(404).json({ error: "Post not found" });
            res.json(result.rows[0]);
        } catch (err) {
            console.error("Error fetching post:", err.message);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);


// 📌 **CREATE a new post (with validation)**
app.post(
    "/posts",
    [
        body("author").trim().notEmpty().withMessage("Author is required"),
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("content").trim().notEmpty().withMessage("Content is required"),
        body("cover").trim().notEmpty().withMessage("Cover URL is required"),
    ],
    handleErrors,
    async (req, res) => {
        try {
            const { author, title, content, cover } = req.body;
            const result = await pool.query(
                "INSERT INTO posts (author, title, content, cover) VALUES ($1, $2, $3, $4) RETURNING *",
                [author, title, content, cover]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error("Error creating post:", err.message);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);


// 📌 **UPDATE an existing post (with validation)**
app.put(
    "/posts/:id",
    [
        param("id").isInt().withMessage("Post ID must be an integer"),
        body("author").trim().notEmpty().withMessage("Author is required"),
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("content").trim().notEmpty().withMessage("Content is required"),
        body("cover").trim().notEmpty().withMessage("Cover URL is required"),
    ],
    handleErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { author, title, content, cover } = req.body;

            const result = await pool.query(
                "UPDATE posts SET author = $1, title = $2, content = $3, cover = $4, updated_at = NOW() WHERE id = $5 RETURNING *",
                [author, title, content, cover, id]
            );

            if (result.rows.length === 0) return res.status(404).json({ error: "Post not found" });
            res.json(result.rows[0]);
        } catch (err) {
            console.error("Error updating post:", err.message);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// 📌 **DELETE a post (with validation)**
app.delete(
    "/posts/:id",
    param("id").isInt().withMessage("Post ID must be an integer"),
    handleErrors,
    async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query("DELETE FROM posts WHERE id = $1 RETURNING *", [id]);

            if (result.rows.length === 0) return res.status(404).json({ error: "Post not found" });
            res.json({ message: "Post deleted successfully" });
        } catch (err) {
            console.error("Error deleting post:", err.message);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
