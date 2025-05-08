import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  answers: Array<{
    id: string;
    answer_text: string;
    is_correct: boolean;
  }>;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export default function GeneratedQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await api.quizzes.get(id!);
        setQuiz(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const score = quiz.questions.reduce((acc, question) => {
      const selectedAnswerId = selectedAnswers[question.id];
      const correctAnswer = question.answers.find(a => a.is_correct);
      return acc + (selectedAnswerId === correctAnswer?.id ? 1 : 0);
    }, 0);

    const finalScore = (score / quiz.questions.length) * 100;

    try {
      await api.quizzes.saveAttempt(quiz.id, {
        score: finalScore,
        answers: selectedAnswers
      });
      navigate('/quiz-results', { 
        state: { 
          score: finalScore,
          totalQuestions: quiz.questions.length,
          correctAnswers: score
        }
      });
    } catch (err) {
      setError('Failed to save quiz attempt');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center p-4">
        Quiz not found
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
      <p className="text-gray-600 mb-8">{quiz.description}</p>

      <div className="mb-4">
        <span className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </span>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">{currentQ.question_text}</h2>
        <div className="space-y-3">
          {currentQ.answers.map((answer) => (
            <div
              key={answer.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedAnswers[currentQ.id] === answer.id
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
              onClick={() => handleAnswerSelect(currentQ.id, answer.id)}
            >
              {answer.answer_text}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md disabled:opacity-50"
        >
          Previous
        </button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            disabled={!selectedAnswers[currentQ.id]}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswers[currentQ.id]}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}