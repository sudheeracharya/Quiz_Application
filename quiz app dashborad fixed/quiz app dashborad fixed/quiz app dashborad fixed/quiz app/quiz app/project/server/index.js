import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection pool with the correct host
const pool = mysql.createPool({
  host: 'localhost',  // or your specific MySQL host
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create quizzes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        user_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create questions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(36) PRIMARY KEY,
        quiz_id VARCHAR(36) NOT NULL,
        question_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      )
    `);

    // Create answers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS answers (
        id VARCHAR(36) PRIMARY KEY,
        question_id VARCHAR(36) NOT NULL,
        answer_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);

    // Create quiz_attempts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id VARCHAR(36) PRIMARY KEY,
        quiz_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        answers JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to Mongodb');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}

// Initialize database and test connection
(async () => {
  const isConnected = await testConnection();
  if (isConnected) {
    await initDatabase();
  } else {
    console.error('Could not establish database connection. Exiting...');
    process.exit(1);
  }
})();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = randomUUID();

    await pool.query(
      'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
      [id, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Error registering user' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, id: user.id, email: user.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

// Quiz routes
app.get('/api/quizzes', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Get all quizzes (for attempting)
    const [allQuizzes] = await connection.query(
      `SELECT 
        q.*,
        u.email as creator_email,
        COUNT(DISTINCT qu.id) as question_count
       FROM quizzes q
       LEFT JOIN questions qu ON q.id = qu.quiz_id
       LEFT JOIN users u ON q.user_id = u.id
       GROUP BY q.id
       ORDER BY q.created_at DESC`
    );

    // Get user's quizzes
    const [userQuizzes] = await connection.query(
      `SELECT 
        q.*,
        COUNT(DISTINCT qu.id) as question_count
       FROM quizzes q
       LEFT JOIN questions qu ON q.id = qu.quiz_id
       WHERE q.user_id = ?
       GROUP BY q.id
       ORDER BY q.created_at DESC`,
      [req.user.id]
    );

    // Get global stats
    const [globalStats] = await connection.query(
      `SELECT 
        COUNT(DISTINCT q.id) as total_quizzes,
        COUNT(DISTINCT qu.id) as total_questions
       FROM quizzes q
       LEFT JOIN questions qu ON q.id = qu.quiz_id`
    );

    const response = {
      allQuizzes,
      userQuizzes,
      stats: {
        totalQuizzes: globalStats[0].total_quizzes || 0,
        totalQuestions: globalStats[0].total_questions || 0
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Error fetching quizzes' });
  } finally {
    connection.release();
  }
});

app.get('/api/quizzes/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [quizzes] = await connection.query(
      'SELECT q.*, u.email as creator_email FROM quizzes q LEFT JOIN users u ON q.user_id = u.id WHERE q.id = ?',
      [req.params.id]
    );
    
    if (!quizzes.length) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = quizzes[0];
    
    const [questions] = await connection.query(
      'SELECT * FROM questions WHERE quiz_id = ?',
      [quiz.id]
    );

    for (const question of questions) {
      const [answers] = await connection.query(
        'SELECT * FROM answers WHERE question_id = ?',
        [question.id]
      );
      question.answers = answers;
    }

    quiz.questions = questions;
    await connection.commit();
    res.json(quiz);
  } catch (error) {
    await connection.rollback();
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Error fetching quiz' });
  } finally {
    connection.release();
  }
});

app.post('/api/quizzes', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { title, description, questions } = req.body;
    const quizId = randomUUID();

    await connection.query(
      'INSERT INTO quizzes (id, title, description, user_id) VALUES (?, ?, ?, ?)',
      [quizId, title, description, req.user.id]
    );

    for (const question of questions) {
      const questionId = randomUUID();
      await connection.query(
        'INSERT INTO questions (id, quiz_id, question_text) VALUES (?, ?, ?)',
        [questionId, quizId, question.question_text]
      );

      for (const answer of question.answers) {
        await connection.query(
          'INSERT INTO answers (id, question_id, answer_text, is_correct) VALUES (?, ?, ?, ?)',
          [randomUUID(), questionId, answer.answer_text, answer.is_correct]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ id: quizId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Error creating quiz' });
  } finally {
    connection.release();
  }
});

app.put("/api/quizzes/:id", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const { title, description, questions } = req.body
    const quizId = req.params.id

    // Verify ownership
    const [quizzes] = await connection.query("SELECT id FROM quizzes WHERE id = ? AND user_id = ?", [
      quizId,
      req.user.id,
    ])

    if (!quizzes.length) {
      return res.status(404).json({ error: "Quiz not found" })
    }

    // Update quiz
    await connection.query("UPDATE quizzes SET title = ?, description = ? WHERE id = ?", [title, description, quizId])

    // Delete existing questions and answers
    await connection.query("DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = ?)", [
      quizId,
    ])
    await connection.query("DELETE FROM questions WHERE quiz_id = ?", [quizId])

    // Insert new questions and answers
    for (const question of questions) {
      const questionId = randomUUID()
      await connection.query("INSERT INTO questions (id, quiz_id, question_text) VALUES (?, ?, ?)", [
        questionId,
        quizId,
        question.question_text,
      ])

      for (const answer of question.answers) {
        await connection.query("INSERT INTO answers (id, question_id, answer_text, is_correct) VALUES (?, ?, ?, ?)", [
          randomUUID(),
          questionId,
          answer.answer_text,
          answer.is_correct,
        ])
      }
    }

    await connection.commit()
    res.json({ message: "Quiz updated successfully" })
  } catch (error) {
    await connection.rollback()
    console.error("Error updating quiz:", error)
    res.status(500).json({ error: "Error updating quiz", details: error.message })
  } finally {
    connection.release()
  }
});

app.delete('/api/quizzes/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'DELETE FROM quizzes WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await connection.commit();
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Error deleting quiz' });
  } finally {
    connection.release();
  }
});

app.post('/api/quizzes/generate', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { topic, numQuestions = 5, difficulty = 'medium' } = req.body;

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.error('MISTRAL_API_KEY is not set');
      throw new Error('API configuration error');
    }

    console.log('Generating quiz with parameters:', { topic, numQuestions, difficulty });
    console.log('Using API Key:', apiKey.substring(0, 6) + '...'); // Log part of the API key for verification

    const prompt = `Generate a multiple choice quiz about ${topic} with exactly ${numQuestions} questions at ${difficulty} difficulty level. Each question should have exactly 4 answer choices with exactly one correct answer. Format the response as a complete JSON array of questions like this:
    [
      {
        "question_text": "Example question?",
        "answers": [
          {"answer_text": "Correct answer", "is_correct": true},
          {"answer_text": "Wrong answer 1", "is_correct": false},
          {"answer_text": "Wrong answer 2", "is_correct": false},
          {"answer_text": "Wrong answer 3", "is_correct": false},
        ]
      }
    ]
    Ensure all questions are factually accurate and appropriate for the difficulty level. Return ONLY the JSON array, no additional text or formatting.`;

    console.log('Sending request to Mistral AI API...');

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral AI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Mistral AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Full API response:', data);

    // Extract and log the raw text from the response
    const rawText = data.choices?.[0]?.message?.content.trim();
    console.log('Raw response text:', rawText);

    // Check if the rawText is empty or incomplete
    if (!rawText || rawText === '[') {
      throw new Error('Received empty or incomplete response from the API');
    }

    let questions;
    try {
      // Attempt to parse the JSON array from the text
      questions = JSON.parse(rawText);

      // Validate questions
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      if (questions.length !== numQuestions) {
        throw new Error(`Expected ${numQuestions} questions but got ${questions.length}`);
      }

      questions.forEach((q, index) => {
        if (!q.question_text || !Array.isArray(q.answers) || q.answers.length !== 4) {
          throw new Error(`Invalid question format at index ${index}`);
        }
        const correctAnswers = q.answers.filter(a => a.is_correct);
        if (correctAnswers.length !== 1) {
          throw new Error(`Question ${index + 1} must have exactly one correct answer`);
        }
      });

    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }

    console.log('Successfully parsed questions:', questions.length);

    // Create the quiz in database
    await connection.beginTransaction();

    const quizId = randomUUID();
    const title = `${topic} Quiz (AI Generated)`;
    const description = `A ${difficulty} difficulty quiz about ${topic}`;

    await connection.query(
      'INSERT INTO quizzes (id, title, description, user_id) VALUES (?, ?, ?, ?)',
      [quizId, title, description, req.user.id]
    );

    // Insert questions and answers
    for (const question of questions) {
      const questionId = randomUUID();
      await connection.query(
        'INSERT INTO questions (id, quiz_id, question_text) VALUES (?, ?, ?)',
        [questionId, quizId, question.question_text]
      );

      for (const answer of question.answers) {
        await connection.query(
          'INSERT INTO answers (id, question_id, answer_text, is_correct) VALUES (?, ?, ?, ?)',
          [randomUUID(), questionId, answer.answer_text, answer.is_correct]
        );
      }
    }

    await connection.commit();
    res.status(201).json({
      id: quizId,
      title,
      description,
      questions
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error generating quiz:', error);
    res.status(500).json({
      error: 'Error generating quiz',
      details: error.message
    });
  } finally {
    connection.release();
  }
});


app.post('/api/quizzes/:id/attempts', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { score, answers } = req.body;
    const quizId = req.params.id;
    const userId = req.user ? req.user.id : null;

    // First verify the quiz exists
    const [quiz] = await connection.query('SELECT id FROM quizzes WHERE id = ?', [quizId]);
    if (!quiz.length) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await connection.query(
      'INSERT INTO quiz_attempts (id, quiz_id, user_id, score, answers) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), quizId, userId, score, JSON.stringify(answers)]
    );

    await connection.commit();
    res.status(201).json({ message: 'Quiz attempt saved successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving quiz attempt:', error);
    res.status(500).json({ error: 'Error saving quiz attempt' });
  } finally {
    connection.release();
  }
});

// Updated leaderboard route - now shows anonymous attempts too
app.get('/api/leaderboard', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [leaderboard] = await connection.query(
      `SELECT 
        COALESCE(u.email, 'Anonymous') as user,
        COUNT(DISTINCT qa.quiz_id) as quizzes_completed,
        AVG(qa.score) as average_score
       FROM quiz_attempts qa
       LEFT JOIN users u ON qa.user_id = u.id
       GROUP BY COALESCE(u.email, 'Anonymous')
       ORDER BY average_score DESC
       LIMIT 10`
    );

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Error fetching leaderboard' });
  } finally {
    connection.release();
  }
});

// Updated leaderboard route - now shows anonymous attempts too
app.get('/api/leaderboard', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [leaderboard] = await connection.query(
      `SELECT 
        COALESCE(u.email, 'Anonymous') as user,
        COUNT(DISTINCT qa.quiz_id) as quizzes_completed,
        AVG(qa.score) as average_score
       FROM quiz_attempts qa
       LEFT JOIN users u ON qa.user_id = u.id
       GROUP BY COALESCE(u.email, 'Anonymous')
       ORDER BY average_score DESC
       LIMIT 10`
    );

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Error fetching leaderboard' });
  } finally {
    connection.release();
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});