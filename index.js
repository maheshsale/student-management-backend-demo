
// Import required modules
require('dotenv').config()
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
// Create Express application
const app = express();

// Middleware
app.use(cors());

// Middleware
// app.use(cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173"
// }));

app.use(express.json());

// PostgreSQL database connection
// const pool = new Pool({
//     user: "postgres",
//     host: "localhost",
//     database: "postgres",
//     password: "mahesh",
//     port: 5432
// });

// PostgreSQL Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false
});

// Test database connection
pool.connect()
    .then(client => {
        console.log("Connected to PostgreSQL Database!");
        client.release();
    })
    .catch(err => {
        console.error("Database connection error:", err.message);
    });


// =====================================
// 1. GET API - Get All Students
// URL: GET /students
// =====================================

app.get("/students", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM students ORDER BY id"
        );

        res.status(200).json(result.rows);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({
            message: "Error fetching students"
        });
    }
});


// =====================================
// 2. GET API - Get Student By ID
// URL: GET /students/1
// =====================================

app.get("/students/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const result = await pool.query(
            "SELECT * FROM students WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json(result.rows[0]);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({
            message: "Error fetching student"
        });
    }
});


// =====================================
// 3. POST API - Create New Student
// URL: POST /students
// =====================================

app.post("/students", async (req, res) => {
    try {
        const { id, name, course } = req.body;

        const result = await pool.query(
            "INSERT INTO students (id, name, course) VALUES ($1, $2, $3) RETURNING *",
            [id, name, course]
        );

        res.status(201).json({
            message: "Student created successfully",
            student: result.rows[0]
        });
    }
    catch (err) {
        console.error(err.message);

        if (err.code === "23505") {
            return res.status(409).json({
                message: "Student ID already exists"
            });
        }

        res.status(500).json({
            message: "Error creating student"
        });
    }
});


// =====================================
// 4. PUT API - Update Student
// URL: PUT /students/1
// =====================================

app.put("/students/:id", async (req, res) => {
    try {
        const current_id = req.params.id;
        const { id, name, course } = req.body;

        const result = await pool.query(
            "UPDATE students SET id = $1, name = $2, course = $3 WHERE id = $4 RETURNING *",
            [id, name, course, current_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            message: "Student updated successfully",
            student: result.rows[0]
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({
            message: "Error updating student"
        });
    }
});


// =====================================
// 5. DELETE API - Delete Student
// URL: DELETE /students/1
// =====================================

app.delete("/students/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const result = await pool.query(
            "DELETE FROM students WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            message: "Student deleted successfully",
            student: result.rows[0]
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({
            message: "Error deleting student"
        });
    }
});

// Health Check API
app.get("/", (req, res) => {
    res.json({
        message: "Student Management API is running!"
    });
});

// =====================================
// Start Express Server
// =====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
