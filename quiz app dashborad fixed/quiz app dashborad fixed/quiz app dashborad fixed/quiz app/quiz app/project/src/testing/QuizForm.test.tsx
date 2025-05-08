import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; 
import QuizEditor from '../pages/QuizEditor';

test('renders the quiz form and submits correctly', async () => {
    render(<QuizEditor />);
    
    const input = screen.getByPlaceholderText('Enter quiz title');
    fireEvent.change(input, { target: { value: 'Sample Quiz' } });

    const submitButton = screen.getByText('Create Quiz');
    fireEvent.click(submitButton);

    expect(screen.getByText('Quiz Created Successfully')).toBeInTheDocument();
});
