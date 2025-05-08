// import Database from 'better-sqlite3';

// // Initialize SQLite database
// const db = new Database('quiz.db', { verbose: console.log });

// // Enable WAL mode and optimize database settings
// db.exec(`
//   PRAGMA journal_mode = WAL;
//   PRAGMA synchronous = NORMAL;
//   PRAGMA foreign_keys = ON;
//   PRAGMA cache_size = -2000; -- Set cache size to 2MB
// `);

// // Create tables and indexes
// db.exec(`
//   CREATE TABLE IF NOT EXISTS users (
//     id TEXT PRIMARY KEY,
//     email TEXT UNIQUE NOT NULL,
//     password_hash TEXT NOT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//   );

//   CREATE TABLE IF NOT EXISTS quizzes (
//     id TEXT PRIMARY KEY,
//     title TEXT NOT NULL,
//     description TEXT,
//     user_id TEXT NOT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (user_id) REFERENCES users(id)
//   );

//   CREATE TABLE IF NOT EXISTS questions (
//     id TEXT PRIMARY KEY,
//     quiz_id TEXT NOT NULL,
//     question_text TEXT NOT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
//   );

//   CREATE TABLE IF NOT EXISTS answers (
//     id TEXT PRIMARY KEY,
//     question_id TEXT NOT NULL,
//     answer_text TEXT NOT NULL,
//     is_correct BOOLEAN DEFAULT 0,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
//   );

//   CREATE TABLE IF NOT EXISTS quiz_attempts (
//     id TEXT PRIMARY KEY,
//     quiz_id TEXT NOT NULL,
//     user_id TEXT NOT NULL,
//     score NUMERIC NOT NULL,
//     answers TEXT NOT NULL,
//     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
//     FOREIGN KEY (user_id) REFERENCES users(id)
//   );

//   -- Create indexes for performance
//   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
//   CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
//   CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
//   CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at);
//   CREATE INDEX IF NOT EXISTS idx_quizzes_user_created ON quizzes(user_id, created_at);
//   CREATE INDEX IF NOT EXISTS idx_quizzes_title ON quizzes(title);
//   CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
//   CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
//   CREATE INDEX IF NOT EXISTS idx_questions_quiz_created ON questions(quiz_id, created_at);
//   CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
//   CREATE INDEX IF NOT EXISTS idx_answers_is_correct ON answers(is_correct);
//   CREATE INDEX IF NOT EXISTS idx_answers_question_correct ON answers(question_id, is_correct);
//   CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON quiz_attempts(quiz_id);
//   CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON quiz_attempts(user_id);
//   CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON quiz_attempts(created_at);
//   CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON quiz_attempts(user_id, created_at);
//   CREATE INDEX IF NOT EXISTS idx_attempts_quiz_user ON quiz_attempts(quiz_id, user_id);
// `);

// // Prepared statements for optimized queries
// const statements = {
//   // User queries
//   createUser: db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)'),
//   getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),

//   // Quiz queries
//   createQuiz: db.prepare('INSERT INTO quizzes (id, title, description, user_id) VALUES (?, ?, ?, ?)'),
//   getQuizzesByUser: db.prepare('SELECT * FROM quizzes WHERE user_id = ? ORDER BY created_at DESC'),
//   getQuizById: db.prepare('SELECT * FROM quizzes WHERE id = ?'),
//   updateQuiz: db.prepare('UPDATE quizzes SET title = ?, description = ? WHERE id = ? AND user_id = ?'),
//   deleteQuiz: db.prepare('DELETE FROM quizzes WHERE id = ? AND user_id = ?'),
//   searchQuizzes: db.prepare('SELECT * FROM quizzes WHERE title LIKE ? AND user_id = ? ORDER BY created_at DESC'),

//   // Question queries
//   createQuestion: db.prepare('INSERT INTO questions (id, quiz_id, question_text) VALUES (?, ?, ?)'),
//   getQuestionsByQuiz: db.prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY created_at ASC'),

//   // Answer queries
//   createAnswer: db.prepare('INSERT INTO answers (id, question_id, answer_text, is_correct) VALUES (?, ?, ?, ?)'),
//   getAnswersByQuestion: db.prepare('SELECT * FROM answers WHERE question_id = ? ORDER BY is_correct DESC'),

//   // Quiz attempt queries
//   createAttempt: db.prepare('INSERT INTO quiz_attempts (id, quiz_id, user_id, score, answers) VALUES (?, ?, ?, ?, ?)'),
//   getAttemptsByUser: db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY created_at DESC'),
//   getQuizAttempts: db.prepare('SELECT * FROM quiz_attempts WHERE quiz_id = ? ORDER BY created_at DESC')
// };

// export { db, statements };


// db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function getConnection() {
  return await pool.getConnection();
}

export async function query(sql: string, params: any[] = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export const db = {
  pool,
  query,
  transaction,
  getConnection,
};