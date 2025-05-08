const API_URL = import.meta.env.VITE_API_URL

class APIError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    let data
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      throw new Error('Invalid response format from server')
    }

    if (!response.ok) {
      // Handle specific error cases
      switch (response.status) {
        case 400:
          // Check for specific error messages from your server
          if (data.error === 'Email already exists') {
            throw new APIError('Email already exists', 400, 'USER_EXISTS')
          }
          // Handle other 400 errors
          throw new APIError(data.error || data.message || 'Invalid request', 400, data.code)
        
        case 401:
          throw new APIError(
            data.error || 'Authentication required', 
            401, 
            'UNAUTHORIZED'
          )
        
        case 403:
          throw new APIError(
            data.error || 'Access denied', 
            403, 
            'FORBIDDEN'
          )
        
        case 404:
          throw new APIError(
            data.error || 'Resource not found', 
            404, 
            'NOT_FOUND'
          )
        
        case 500:
          throw new APIError(
            data.error || 'Server error', 
            500, 
            'SERVER_ERROR'
          )
        
        default:
          throw new APIError(
            data.error || data.message || `HTTP error! status: ${response.status}`,
            response.status,
            data.code
          )
      }
    }

    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new APIError('Network error - please check your connection', 0, 'NETWORK_ERROR')
    }
    if (error instanceof Error) {
      throw new APIError(error.message, 500, 'UNKNOWN_ERROR')
    }
    throw new APIError('An unexpected error occurred', 500, 'UNKNOWN_ERROR')
  }
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      try {
        return await request("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        })
      } catch (error) {
        if (error instanceof APIError && error.status === 401) {
          throw new APIError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
        }
        throw error
      }
    },

    register: async (email: string, password: string) => {
      try {
        return await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        })
      } catch (error) {
        if (error instanceof APIError && error.code === 'USER_EXISTS') {
          throw new APIError('Email already exists', 400, 'USER_EXISTS')
        }
        throw error
      }
    },
  },

 

  quizzes: {
    list: () => request("/api/quizzes"),

    fetchKaggleQuestions: (topic: string) =>
      request("/api/kaggle/questions", {
        method: "POST",
        body: JSON.stringify({ topic }),
      }),

      generateAIQuiz: (topic: string, options?: { 
        numQuestions?: number;
        difficulty?: 'easy' | 'medium' | 'hard';
      }) =>
        request("/api/quizzes/generate", {
          method: "POST",
          body: JSON.stringify({ topic, ...options }),
        }),
    

    // New Kaggle-related endpoints
    searchKaggleDatasets: (query: string) =>
      request("/api/kaggle/datasets/search", {
        method: "POST",
        body: JSON.stringify({ query }),
      }),

    getKaggleDataset: (datasetRef: string) =>
      request(`/api/kaggle/datasets/${datasetRef}`),

    importKaggleQuestions: (datasetRef: string, options: { 
      limit?: number, 
      categories?: string[],
      difficulty?: 'easy' | 'medium' | 'hard'
    }) =>
      request("/api/kaggle/questions/import", {
        method: "POST",
        body: JSON.stringify({ datasetRef, ...options }),
      }),

    create: (data: any) =>
      request("/api/quizzes", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    get: (id: string) => request(`/api/quizzes/${id}`),

    update: (id: string, data: any) =>
      request(`/api/quizzes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request(`/api/quizzes/${id}`, {
        method: "DELETE",
      }),

    search: (query: string) => 
      request(`/api/quizzes/search?q=${encodeURIComponent(query)}`),

    saveAttempt: (quizId: string, data: any) =>
      request(`/api/quizzes/${quizId}/attempts`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getStats: () => request("/api/quizzes/stats"),

    getLeaderboard: () => request('/api/leaderboard'),

    getQuizDetails: (id: string) => request(`/api/quizzes/${id}/details`),
    
    getQuizQuestions: (id: string) => request(`/api/quizzes/${id}/questions`),
    // Quiz Management
    duplicate: (quizId: string) =>
      request(`/api/quizzes/${quizId}/duplicate`, {
        method: "POST"
      }),

    updateCategory: (quizId: string, category: string) =>
      request(`/api/quizzes/${quizId}/category`, {
        method: "PATCH",
        body: JSON.stringify({ category }),
      }),

    addTags: (quizId: string, tags: string[]) =>
      request(`/api/quizzes/${quizId}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags }),
      }),

    removeTags: (quizId: string, tags: string[]) =>
      request(`/api/quizzes/${quizId}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tags }),
      }),

    // Analytics
    getQuizAnalytics: (quizId: string) =>
      request(`/api/quizzes/${quizId}/analytics`),

    getQuizAttempts: (quizId: string, options?: {
      limit?: number,
      offset?: number,
      sortBy?: 'date' | 'score'
    }) =>
      request(`/api/quizzes/${quizId}/attempts`, {
        method: "GET",
        body: JSON.stringify(options),
      }),

    // User Progress
    getUserProgress: (userId: string) =>
      request(`/api/users/${userId}/progress`),

    // Categories and Tags
    getCategories: () => request('/api/categories'),
    
    getTags: () => request('/api/tags'),

    // Advanced Quiz Features
    shareQuiz: (quizId: string, options: {
      type: 'public' | 'private' | 'restricted',
      allowedUsers?: string[]
    }) =>
      request(`/api/quizzes/${quizId}/share`, {
        method: "POST",
        body: JSON.stringify(options),
      }),

    exportQuiz: (quizId: string, format: 'pdf' | 'csv' | 'json') =>
      request(`/api/quizzes/${quizId}/export`, {
        method: "POST",
        body: JSON.stringify({ format }),
      }),

    importQuiz: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('/api/quizzes/import', {
        method: "POST",
        body: formData,
        headers: {} // Let browser set content-type for FormData
      });
    },

    // Quiz Feedback and Rating
    rateQuiz: (quizId: string, rating: number, feedback?: string) =>
      request(`/api/quizzes/${quizId}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating, feedback }),
      }),

    getQuizRatings: (quizId: string) =>
      request(`/api/quizzes/${quizId}/ratings`),

    // Advanced Statistics
    getDetailedStats: (quizId: string) =>
      request(`/api/quizzes/${quizId}/detailed-stats`),

    getTimeAnalytics: (quizId: string) =>
      request(`/api/quizzes/${quizId}/time-analytics`),

    getDifficultyMetrics: (quizId: string) =>
      request(`/api/quizzes/${quizId}/difficulty-metrics`),

    // Batch Operations
    batchDelete: (quizIds: string[]) =>
      request('/api/quizzes/batch-delete', {
        method: "POST",
        body: JSON.stringify({ quizIds }),
      }),

    batchUpdateCategory: (quizIds: string[], category: string) =>
      request('/api/quizzes/batch-update-category', {
        method: "POST",
        body: JSON.stringify({ quizIds, category }),
      }),

    // Quiz Settings
    updateSettings: (quizId: string, settings: {
      timeLimit?: number,
      passingScore?: number,
      shuffleQuestions?: boolean,
      showResults?: boolean,
      allowRetakes?: boolean
    }) =>
      request(`/api/quizzes/${quizId}/settings`, {
        method: "PATCH",
        body: JSON.stringify(settings),
      }),
  },
}