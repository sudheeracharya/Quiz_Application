"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Plus, Save, Trash2, Upload, Database } from "lucide-react"
import { api } from "../lib/api"
import { useAuth } from "../contexts/AuthContext"
import { toast } from "react-hot-toast"
import mammoth from "mammoth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { mockQuestions } from "./api/kaggle/mockData"

interface Question {
  id?: string
  question_text: string
  answers: Answer[]
}

interface Answer {
  id?: string
  answer_text: string
  is_correct: boolean
}

export default function QuizEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10)
  const [selectedTopic, setSelectedTopic] = useState("python")

  useEffect(() => {
    if (id !== "new") {
      fetchQuiz()
    } else {
      setLoading(false)
    }
  }, [id])

  async function fetchQuiz() {
    try {
      const quiz = await api.quizzes.get(id!)
      setTitle(quiz.title)
      setDescription(quiz.description)
      setQuestions(quiz.questions || [])
    } catch (error: any) {
      console.error("Error loading quiz:", error)
      toast.error(`Error loading quiz: ${error.message}`)
      navigate("/quizzes")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user?.id) {
      toast.error("You must be logged in to save a quiz")
      return
    }

    try {
      const quizData = {
        title,
        description,
        numberOfQuestions,
        questions: questions.slice(0, numberOfQuestions).map((q) => ({
          ...q,
          answers: q.answers.map((a) => ({
            ...a,
            is_correct: Boolean(a.is_correct),
          })),
        })),
      }

      console.log("Submitting quiz data:", quizData)

      let result
      if (id === "new") {
        result = await api.quizzes.create(quizData)
        console.log("Create result:", result)
      } else {
        result = await api.quizzes.update(id!, quizData)
        console.log("Update result:", result)
      }

      toast.success("Quiz saved successfully")
      navigate("/quizzes")
    } catch (error: any) {
      console.error("Error saving quiz:", error)
      toast.error(`Error saving quiz: ${error.message}`)
    }
  }

  function addQuestion() {
    setQuestions([
      ...questions,
      {
        question_text: "",
        answers: [
          { answer_text: "", is_correct: false },
          { answer_text: "", is_correct: false },
          { answer_text: "", is_correct: false },
          { answer_text: "", is_correct: false },
        ],
      },
    ])
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  async function parseDocxQuestions(filePath: string): Promise<Question[]> {
    const fileContent = await extractTextFromDocx(filePath)
    return parseDocumentQuestions(fileContent)
  }

  async function extractTextFromDocx(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value // Extracted plain text from the .docx file
  }

  function parseDocumentQuestions(fileContent: string): Question[] {
    const lines = fileContent
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean) // Split and filter empty lines
    const parsedQuestions: Question[] = []

    let currentQuestion: Question | null = null

    for (const line of lines) {
      const questionMatch = line.match(/^(\d+)\.\s*(.+)$/) // Match for the question without asterisks
      const answerMatch = line.match(/^([a-d])\)\s*(.+)$/) // Match for the answers
      const correctAnswerMatch = line.match(/^Answer:\s*([a-d])\)\s*(.+)$/) // Match for the correct answer without asterisks

      if (questionMatch) {
        // Save the previous question
        if (currentQuestion) {
          parsedQuestions.push(currentQuestion)
        }
        // Start a new question
        currentQuestion = {
          question_text: questionMatch[2],
          answers: [],
        }
      } else if (answerMatch && currentQuestion) {
        // Add answer to the current question
        currentQuestion.answers.push({
          answer_text: answerMatch[2],
          is_correct: false, // Default to false
        })
      } else if (correctAnswerMatch && currentQuestion) {
        // Mark the correct answer
        const correctAnswerText = correctAnswerMatch[2]
        const correctIndex = currentQuestion.answers.findIndex((a) => a.answer_text === correctAnswerText)
        if (correctIndex !== -1) {
          currentQuestion.answers[correctIndex].is_correct = true
        }
      }
    }

    // Push the last question
    if (currentQuestion) {
      parsedQuestions.push(currentQuestion)
    }

    return parsedQuestions
  }

  // Usage
  const filePath = "questions.docx"

  parseDocxQuestions(filePath)
    .then((questions) => {
      console.log("Parsed Questions:", questions)
    })
    .catch((error) => {
      console.error("Error parsing questions:", error)
    })

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileContent = await file.text()
      const parsedQuestions = parseDocumentQuestions(fileContent)

      if (parsedQuestions.length > 0) {
        // Optionally set a default title based on the file name
        if (!title) {
          setTitle(`Quiz from ${file.name}`)
        }

        // Add parsed questions to existing questions
        setQuestions([...questions, ...parsedQuestions])
        toast.success(`Uploaded ${parsedQuestions.length} questions from file`)
      } else {
        toast.error("No questions could be parsed from the file")
      }
    } catch (error) {
      console.error("Error reading file:", error)
      toast.error("Error parsing the document")
    }
  }

  function handleNumberOfQuestionsChange(value: string) {
    const num = Number.parseInt(value, 10)
    setNumberOfQuestions(num)
    // Adjust the questions array based on the new number
    if (num < questions.length) {
      setQuestions(questions.slice(0, num))
    } else if (num > questions.length) {
      const newQuestions = [...questions]
      for (let i = questions.length; i < num; i++) {
        newQuestions.push({
          question_text: "",
          answers: [
            { answer_text: "", is_correct: false },
            { answer_text: "", is_correct: false },
            { answer_text: "", is_correct: false },
            { answer_text: "", is_correct: false },
          ],
        })
      }
      setQuestions(newQuestions)
    }
  }

  const handleGenerateQuiz = () => {
    const generatedQuestions = mockQuestions[selectedTopic] || []

    if (generatedQuestions.length === 0) {
      toast.error("No questions available for this topic.")
      return
    }

    const formattedQuestions = generatedQuestions.map((q: { question: any; correct_answer: any; incorrect_answers: any[] }) => ({
      question_text: q.question,
      answers: [
        { answer_text: q.correct_answer, is_correct: true },
        ...q.incorrect_answers.map((answer: any) => ({ answer_text: answer, is_correct: false })),
      ],
    }))

    setQuestions(formattedQuestions)
    setNumberOfQuestions(formattedQuestions.length)
    setTitle(`Generated ${selectedTopic.charAt(0).toUpperCase() + selectedTopic.slice(1)} Quiz`)
    toast.success(`Generated ${formattedQuestions.length} questions for ${selectedTopic}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{id === "new" ? "Create New Quiz" : "Edit Quiz"}</h1>
            <div className="flex space-x-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.docx,.md"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Document
              </button>
              <Select onValueChange={setSelectedTopic} value={selectedTopic}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={handleGenerateQuiz}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Database className="h-5 w-5 mr-2" />
                Generate Quiz
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Quiz Title
              </label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-9"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="numberOfQuestions" className="block text-sm font-medium text-gray-700">
                Number of Questions
              </label>
              <Select onValueChange={handleNumberOfQuestionsChange} value={numberOfQuestions.toString()}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select number of questions" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25, 30, 40, 50].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Question
            </button>
          </div>

          {questions.slice(0, numberOfQuestions).map((question, questionIndex) => (
            <div key={questionIndex} className="bg-white shadow sm:rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Question {questionIndex + 1}</label>
                  <input
                    type="text"
                    required
                    value={question.question_text}
                    onChange={(e) => {
                      const newQuestions = [...questions]
                      newQuestions[questionIndex].question_text = e.target.value
                      setQuestions(newQuestions)
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-7"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(questionIndex)}
                  className="ml-4 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Answers</label>
                {question.answers.map((answer, answerIndex) => (
                  <div key={answerIndex} className="flex items-center space-x-4">
                    <input
                      type="text"
                      required
                      value={answer.answer_text}
                      onChange={(e) => {
                        const newQuestions = [...questions]
                        newQuestions[questionIndex].answers[answerIndex].answer_text = e.target.value
                        setQuestions(newQuestions)
                      }}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-7"
                      placeholder={`Answer ${answerIndex + 1}`}
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={answer.is_correct}
                        onChange={() => {
                          const newQuestions = [...questions]
                          newQuestions[questionIndex].answers.forEach((a, i) => (a.is_correct = i === answerIndex))
                          setQuestions(newQuestions)
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">Correct</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Quiz
          </button>
        </div>
      </form>
    </div>
  )
}

