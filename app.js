import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

const app = express();

const { Pool } = pkg;
dotenv.config();


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());

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
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 **GET a single post by ID**
app.get("/posts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Post not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 **CREATE a new post**
app.post("/posts", async (req, res) => {
    try {
        const { author, title, content, cover } = req.body;
        const result = await pool.query(
            "INSERT INTO posts (author, title, content, cover) VALUES ($1, $2, $3, $4) RETURNING *",
            [author, title, content, cover]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 **UPDATE an existing post**
app.put("/posts/:id", async (req, res) => {
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
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 **DELETE a post**
app.delete("/posts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM posts WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Post not found" });
        res.json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
