# Quiz Application

A modern quiz application built with React, TypeScript, and Node.js that allows users to create, attempt, and manage quizzes with AI-powered question generation capabilities.

## 🚀 Features

- User Authentication (Sign up/Login)
- Create and Edit Quizzes
- AI-powered Quiz Generation
- Real-time Quiz Taking
- Leaderboard System
- Dashboard with Statistics
- Responsive Design

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Git

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/sudheeracharya/Quiz_Application.git
```

2. Navigate to the project directory:
```bash
cd "Quiz_Application/quiz app/project"
```

3. Install dependencies:
```bash
npm install
```

4. Create a `.env` file in the project root and add necessary environment variables:
```env
VITE_API_URL=http://localhost:3000
```

## 🚀 Running the Application

1. Start the development server:
```bash
npm run dev
```

2. In a separate terminal, start the backend server:
```bash
cd server
npm run start
```

The application will be available at `http://localhost:5173`

## 📖 Usage Guide

### First Time Setup
1. Register a new account using the Sign Up page
2. Log in with your credentials
3. You'll be redirected to the dashboard

### Creating a Quiz
1. Click on "Create Quiz" in the navigation
2. Fill in the quiz details:
   - Title
   - Description
   - Questions and answers
3. Save your quiz

### Using AI Quiz Generator
1. Navigate to AI Quiz Generator
2. Enter your topic/subject
3. Specify the number of questions
4. Click "Generate Quiz"

### Attempting a Quiz
1. Go to "Quiz List"
2. Select a quiz
3. Click "Start Quiz"
4. Answer the questions
5. Submit to see your results

## 🔧 Troubleshooting

Common issues and solutions:

1. If npm install fails:
```bash
npm clean-cache --force
npm install
```

2. If the server won't start:
- Check if port 3000 is already in use
- Ensure all environment variables are set correctly

3. If you can't log in:
- Clear browser cookies
- Check if the backend server is running

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting guide
2. Open an issue on GitHub
3. Contact the maintainers

## 🙏 Acknowledgments

- React.js team for the amazing framework
- All contributors who have helped with the project
- The open-source community for their invaluable resources
