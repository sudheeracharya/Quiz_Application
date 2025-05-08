import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2, Save, Trash2 } from 'lucide-react';

interface Answer {
  answer_text: string;
  is_correct: boolean;
}

interface Question {
  question_text: string;
  answers: Answer[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export default function AIQuizGenerator() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await api.quizzes.generateAIQuiz(topic, {
        numQuestions,
        difficulty,
      });
      setQuiz(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!quiz) return;
    setIsSaving(true);
    try {
      const savedQuiz = await api.quizzes.create(quiz);
      navigate(`/quizzes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    if (!quiz) return;
    const updatedQuestions = quiz.questions.filter((_, index) => index !== indexToDelete);
    setQuiz({
      ...quiz,
      questions: updatedQuestions
    });
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Generate AI Quiz</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Number of Questions</label>
          <input
            type="number"
            min="1"
            max="20"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading || !topic}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Generating...
            </>
          ) : (
            'Generate Quiz'
          )}
        </button>
      </form>

      {quiz && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Generated Quiz: {quiz.title}</h3>
            <button
              onClick={handleSaveQuiz}
              disabled={isSaving}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Quiz
            </button>
          </div>
          
          <p className="mb-4">{quiz.description}</p>
          <ol className="space-y-4">
            {quiz.questions.map((question, index) => (
              <li key={index} className="border p-4 rounded-md shadow-sm relative">
                <button
                  onClick={() => handleDeleteQuestion(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                  title="Delete question"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <p className="font-semibold pr-8">{question.question_text}</p>
                <ul className="mt-2 space-y-2">
                  {question.answers.map((answer, idx) => (
                    <li key={idx} className={`flex items-center ${answer.is_correct ? 'text-green-600' : 'text-gray-700'}`}>
                      <span className={`mr-2 ${answer.is_correct ? 'bg-green-500' : 'bg-gray-400'} h-2 w-2 inline-block rounded-full`}></span>
                      {answer.answer_text}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}