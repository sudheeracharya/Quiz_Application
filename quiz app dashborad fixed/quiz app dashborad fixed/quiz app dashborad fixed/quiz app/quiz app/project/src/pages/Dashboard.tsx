"use client"

import type React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { PlusCircle, BookOpen, CheckCircle, Search, User, Wand2 } from "lucide-react"
import { api } from "../lib/api"
import { useAuth } from "../contexts/AuthContext"
import debounce from "lodash/debounce"
import Leaderboard from "../components/Leaderboard"

interface Quiz {
  id: string
  title: string
  question_count: number
  creator_email?: string
  user_id: string
  description?: string
  // Add new properties
  category?: string
  tags?: string[]
  completions?: number
  averageScore?: number
  averageTime?: number
  difficulty?: 'Easy' | 'Medium' | 'Hard'
}

interface Stats {
  totalQuizzes: number
  totalQuestions: number
}

export default function Dashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ totalQuizzes: 0, totalQuestions: 0 })
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([])
  const [userQuizzes, setUserQuizzes] = useState<Quiz[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "my">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)

  // Add categories
  const categories = ["Programming", "Mathematics", "Science", "Language", "History"]

  // Modify the filtered quizzes to include category filtering
  const filteredQuizzes = useMemo(() => {
    let quizzes = activeTab === "all" ? allQuizzes : userQuizzes
    const query = searchQuery.toLowerCase().trim()
    
    if (query) {
      quizzes = quizzes.filter((quiz) => quiz.title.toLowerCase().includes(query))
    }
    
    if (selectedCategory !== "all") {
      quizzes = quizzes.filter((quiz) => quiz.category === selectedCategory)
    }
    
    return quizzes
  }, [allQuizzes, userQuizzes, searchQuery, activeTab, selectedCategory])

  // Add quiz management functions
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await api.quizzes.delete(quizId)
      setAllQuizzes(prev => prev.filter(quiz => quiz.id !== quizId))
      setUserQuizzes(prev => prev.filter(quiz => quiz.id !== quizId))
    } catch (error) {
      console.error("Failed to delete quiz:", error)
    }
  }

  const handleDuplicateQuiz = async (quizId: string) => {
    try {
      const duplicatedQuiz = await api.quizzes.duplicate(quizId)
      setAllQuizzes(prev => [...prev, duplicatedQuiz])
      setUserQuizzes(prev => [...prev, duplicatedQuiz])
    } catch (error) {
      console.error("Failed to duplicate quiz:", error)
    }
  }

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query)
    }, 300),
    [],
  )

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value
      debouncedSearch(query)
    },
    [debouncedSearch],
  )

  const handleQuizClick = useCallback(
    (quiz: Quiz) => {
      // Everyone goes to attempt view
      navigate(`/attempt/${quiz.id}`);
    },
    [navigate],
);

  useEffect(() => {
    let mounted = true

    async function fetchData() {
      if (!session?.user?.id) return

      try {
        setIsLoading(true)
        const data = await api.quizzes.list()

        if (mounted) {
          setAllQuizzes(data.allQuizzes)
          setUserQuizzes(data.userQuizzes)
          setStats(data.stats)
        }
      } catch (error) {
        console.error("Failed to fetch quizzes:", error)
        setAllQuizzes([])
        setUserQuizzes([])
        setStats({ totalQuizzes: 0, totalQuestions: 0 })
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [session])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Modify the quiz card render to include new features
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-4">
          <Link
            to="/quizzes"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create New Quiz
          </Link>
          <Link
  to="/generate-quiz"
  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
>
  <Wand2 className="h-5 w-5 mr-2" />
  Generate AI Quiz
</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Quizzes</dt>
                      <dd className="text-3xl font-semibold text-gray-900">{stats.totalQuizzes}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Questions</dt>
                      <dd className="text-3xl font-semibold text-gray-900">{stats.totalQuestions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === "all" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All Quizzes
                </button>
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === "my" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  My Quizzes
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  onClick={() => handleQuizClick(quiz)}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-indigo-600 cursor-pointer"
                >
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{quiz.title}</p>
                        <p className="text-sm text-gray-500">{quiz.question_count || 0} questions</p>
                      </div>
                      {quiz.creator_email && activeTab === "all" && (
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="h-4 w-4 mr-1" />
                          {quiz.creator_email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Leaderboard />
        </div>
      </div>
    </div>
  )
}

