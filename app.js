require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

app.use(express.json());

// GET /posts - Retrieve all posts
app.get('/posts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM posts');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /posts/:id - Retrieve a single post by ID
app.get('/posts/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Post not found" });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /posts - Create a new post
app.post('/posts', async (req, res) => {
    try {
        const { author, title, content, cover } = req.body;
        const result = await pool.query(
            'INSERT INTO posts (author, title, content, cover) VALUES ($1, $2, $3, $4) RETURNING *',
            [author, title, content, cover]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /posts/:id - Update an existing post by ID
app.put('/posts/:id', async (req, res) => {
    try {
        const { author, title, content, cover } = req.body;
        const result = await pool.query(
            'UPDATE posts SET author = $1, title = $2, content = $3, cover = $4 WHERE id = $5 RETURNING *',
            [author, title, content, cover, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Post not found" });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /posts/:id - Delete a post by ID
app.delete('/posts/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Post not found" });
        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
