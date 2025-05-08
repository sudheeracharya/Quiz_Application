import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import QuizList from './pages/QuizList';
import QuizEditor from './pages/QuizEditor';
import AttemptQuiz from './pages/AttemptQuiz';
import Auth from './pages/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GeneratedQuiz from "./pages/AIQuizGenerator"
import AIQuizGenerator from './pages/AIQuizGenerator';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/quizzes" element={
                <ProtectedRoute>
                  <QuizList />
                </ProtectedRoute>
              } />
              <Route path="/quiz/:id" element={
                <ProtectedRoute>
                  <QuizEditor />
                </ProtectedRoute>
              } />
              <Route path="/attempt/:id" element={
                <ProtectedRoute>
                  <AttemptQuiz />
                </ProtectedRoute>
              } />
               <Route path="/" element={<Dashboard />} />
               <Route path="/generate-quiz" element={<AIQuizGenerator />} />
               <Route path="/quiz/:id" element={<GeneratedQuiz />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;