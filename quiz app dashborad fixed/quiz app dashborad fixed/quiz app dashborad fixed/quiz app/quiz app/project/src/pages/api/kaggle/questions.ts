// api/mock-kaggle/questions.ts

import { mockQuestions } from "./mockData";
import { MockQuestion } from "./mockData";

export async function handleMockKaggleQuestions(
  topic: string,
  limit = 1000  // New parameter for maximum questions
): Promise<{
  questions: MockQuestion[];
  success: boolean;
  message?: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const normalizedTopic = topic.toLowerCase();
    const questions = mockQuestions[normalizedTopic] || [];

    if (questions.length === 0) {
      return {
        questions: [],
        success: false,
        message: 'No questions found for this topic'
      };
    }

    const shuffledQuestions = shuffleArray(questions).slice(0, limit);

    return {
      questions: shuffledQuestions,
      success: true
    };
  } catch (error) {
    return {
      questions: [],
      success: false,
      message: 'Error fetching questions'
    };
  }
}

// Proper shuffle function using Fisher-Yates Algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
