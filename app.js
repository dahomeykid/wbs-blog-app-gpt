import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

const app = express();

const { Pool } = pkg;
dotenv.config();

const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());

// GET /posts - Retrieve all posts
app.get("/posts", async (req, res) => {
    const result = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");
    res.json(result.rows);
});

app.post("/posts", async (req, res) => {
    const { title, content } = req.body;
    const result = await pool.query(
        "INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *",
        [title, content]
    );
    res.json(result.rows[0]);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
