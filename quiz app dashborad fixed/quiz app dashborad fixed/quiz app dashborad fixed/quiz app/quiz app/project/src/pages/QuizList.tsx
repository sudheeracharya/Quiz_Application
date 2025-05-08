'use client'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Edit, Trash2, Play } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

interface Quiz {
  id: string
  title: string
  description: string
  created_at: string
  question_count?: number
}

export default function QuizList() {
  const { session } = useAuth()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizzes()
  }, [session])

  async function fetchQuizzes() {
    try {
      const response = await api.quizzes.list()
      // Use userQuizzes from the response for the my quizzes page
      setQuizzes(response.userQuizzes || [])
    } catch (error: any) {
      toast.error('Error loading quizzes')
    } finally {
      setLoading(false)
    }
  }

  async function deleteQuiz(id: string) {
    try {
      await api.quizzes.delete(id)
      setQuizzes(quizzes.filter(quiz => quiz.id !== id))
      toast.success('Quiz deleted successfully')
    } catch (error: any) {
      toast.error('Error deleting quiz')
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
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
        <Link
          to="/quiz/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Create New Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new quiz.</p>
          <div className="mt-6">
            <Link
              to="/quiz/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create New Quiz
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {quizzes.map((quiz) => (
              <li key={quiz.id}>
                <div className="px-4 py-4 flex items-center sm:px-6">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{quiz.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{quiz.description}</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Created on {new Date(quiz.created_at).toLocaleDateString()}
                    </p>
                    {quiz.question_count !== undefined && (
                      <p className="mt-1 text-sm text-gray-500">
                        Questions: {quiz.question_count}
                      </p>
                    )}
                  </div>
                  <div className="ml-5 flex-shrink-0 flex space-x-2">
                    <Link
                      to={`/attempt/${quiz.id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Attempt
                    </Link>
                    <Link
                      to={`/quiz/${quiz.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-gray-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}