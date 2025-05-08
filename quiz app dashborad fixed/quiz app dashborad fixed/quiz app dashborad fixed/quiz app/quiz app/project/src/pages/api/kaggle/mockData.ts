// Define the MockQuestion interface
export interface MockQuestion {
    id: string;
    topic: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }
  
  // Question generator configuration
  const questionTemplates: Record<string, {
    template: (i: number) => string;
    correct: string | ((i: number) => string);
    incorrect: string[];
  }[]> = {
    python: [
      {
        template: (i: number) => `What is the output of print(type(${i % 2 ? '[]' : '{}'}))?`,
        correct: (i: number) => i % 2 ? "<class 'list'>" : "<class 'dict'>",
        incorrect: ["<class 'array'>", "<class 'tuple'>", "<class 'set'>"]
      },
      {
        template: () => `Which keyword is used to define a function in Python?`,
        correct: 'def',
        incorrect: ['function', 'func', 'define']
      },
      {
        template: (i: number) => `What is the result of ${i % 2 ? '5 // 2' : '5 / 2'} in Python?`,
        correct: (i: number) => i % 2 ? '2' : '2.5',
        incorrect: ['2.0', '3', 'Error']
      },
      // Add more templates here...
    ],
    javascript: [
      {
        template: (i: number) => `What is the result of 2 + ${i % 2 ? "'2'" : "2"} in JavaScript?`,
        correct: (i: number) => i % 2 ? "'22'" : "4",
        incorrect: ["NaN", "Error", "'4'"]
      },
      {
        template: () => `Which method creates a new array with all sub-array elements concatenated in JavaScript?`,
        correct: 'flat()',
        incorrect: ['concat()', 'merge()', 'join()']
      },
      {
        template: (i: number) => `What is the output of console.log(${i % 2 ? 'null ?? "default"' : '"value" ?? "default"'})?`,
        correct: (i: number) => i % 2 ? 'null' : '"value"',
        incorrect: ['"default"', 'undefined', 'Error']
      },
      // Add more templates here...
    ],
    java: [
      {
        template: () => `What is the default value of an int in Java?`,
        correct: '0',
        incorrect: ['null', 'undefined', '-1']
      },
      {
        template: () => `Which keyword is used to define a class in Java?`,
        correct: 'class',
        incorrect: ['Class', 'define', 'object']
      },
      {
        template: (i: number) => `What is the output of System.out.println(${i % 2 ? '5 / 2' : '5 % 2'})?`,
        correct: (i: number) => i % 2 ? '2' : '1',
        incorrect: ['2.5', '0', 'Error']
      },
      // Add more templates here...
    ],
    csharp: [
      {
        template: () => `Which keyword is used to define a method in C#?`,
        correct: 'void',
        incorrect: ['func', 'method', 'define']
      },
      {
        template: () => `What is the file extension for C# source files?`,
        correct: '.cs',
        incorrect: ['.csharp', '.c', '.cpp']
      },
      {
        template: (i: number) => `What is the output of Console.WriteLine(${i % 2 ? '5 / 2' : '5 % 2'})?`,
        correct: (i: number) => i % 2 ? '2' : '1',
        incorrect: ['2.5', '0', 'Error']
      },
      // Add more templates here...
    ]
  };
  
  // Generate questions dynamically
  const generateQuestions = (topic: keyof typeof questionTemplates, count: number): MockQuestion[] => {
    const questions: MockQuestion[] = [];
    const templateCount = questionTemplates[topic].length;
  
    for (let i = 0; i < count; i++) {
      const templateIndex = i % templateCount;
      const template = questionTemplates[topic][templateIndex];
      questions.push({
        id: `${topic}-${i + 1}`,
        topic,
        question: template.template(i),
        correct_answer: typeof template.correct === 'function' ? template.correct(i) : template.correct,
        incorrect_answers: template.incorrect
      });
    }
  
    return questions;
  };
  
  // Create mock questions
  export const mockQuestions: Record<string, MockQuestion[]> = {
    python: generateQuestions('python', 500),
    javascript: generateQuestions('javascript', 500),
    java: generateQuestions('java', 500),
    csharp: generateQuestions('csharp', 500)
  };
  