// AttemptQuiz.tsx
import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../lib/api"
import { toast } from "react-hot-toast"
import { CheckCircle, XCircle } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  answers: Answer[]
}

interface Answer {
  is_correct: unknown
  id: string
  answer_text: string
}

export default function AttemptQuiz() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<{ title: string; description: string } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuiz()
  }, [id])

  async function fetchQuiz() {
    try {
      const quizData = await api.quizzes.get(id!)
      setQuiz(quizData)
      setQuestions(quizData.questions || [])
    } catch (error: any) {
      toast.error("Error loading quiz")
      navigate("/quizzes")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)

    try {
      let correctAnswers = 0
      const totalQuestions = questions.length

      for (const question of questions) {
        const selectedAnswerId = selectedAnswers[question.id]
        if (!selectedAnswerId) continue

        const correctAnswer = question.answers.find((a) => a.is_correct)
        if (correctAnswer && correctAnswer.id === selectedAnswerId) {
          correctAnswers++
        }
      }

      const finalScore = (correctAnswers / totalQuestions) * 100
      setScore(finalScore)

      // Save the quiz attempt using the updated API endpoint
      await api.quizzes.saveAttempt(id!, {
        score: finalScore,
        answers: selectedAnswers,
      })

      toast.success("Quiz submitted successfully!")
    } catch (error: any) {
      if (error.message === "Authentication required") {
        toast.error("Please log in to submit the quiz")
        navigate("/login")
      } else {
        toast.error("Error submitting quiz")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 bg-indigo-600 text-white">
          <h1 className="text-2xl font-bold">{quiz?.title}</h1>
          <p className="mt-2 text-indigo-100">{quiz?.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-4">
              <div className="flex items-center">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-semibold">
                  {index + 1}
                </span>
                <h3 className="ml-3 text-lg font-medium text-gray-900">{question.question_text}</h3>
              </div>

              <div className="ml-11 space-y-2">
                {question.answers.map((answer) => (
                  <label
                    key={answer.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                      ${
                        selectedAnswers[question.id] === answer.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={answer.id}
                      checked={selectedAnswers[question.id] === answer.id}
                      onChange={(e) =>
                        setSelectedAnswers({
                          ...selectedAnswers,
                          [question.id]: e.target.value,
                        })
                      }
                      disabled={submitted}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-3 text-gray-900">{answer.answer_text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {!submitted ? (
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Submit Quiz
              </button>
            </div>
          ) : (
            score !== null && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100">
                    {score >= 70 ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">Your Score: {score.toFixed(1)}%</h3>
                  <p className="mt-2 text-gray-600">
                    {score >= 70
                      ? "Congratulations! You passed the quiz!"
                      : "Keep practicing! You can do better next time."}
                  </p>
                  <button
                    onClick={() => navigate("/quizzes")}
                    className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Back to Quizzes
                  </button>
                </div>
              </div>
            )
          )}
        </form>
      </div>
    </div>
  )
}