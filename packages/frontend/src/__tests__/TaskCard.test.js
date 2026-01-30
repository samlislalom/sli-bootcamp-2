import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createAppTheme } from '../theme';
import TaskCard from '../TaskCard';

// Mock task data
const mockTask = {
  id: 1,
  name: 'Test Task',
  description: 'Test description',
  due_date: '2026-02-15',
  completed: false,
  priority: 2,
  created_at: '2026-01-30',
  updated_at: '2026-01-30'
};

const TestWrapper = ({ children }) => {
  const theme = createAppTheme(false); // light mode for consistent testing
  
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

const mockProps = {
  task: mockTask,
  onUpdate: jest.fn(),
  onDelete: jest.fn()
};

describe('TaskCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders task information correctly', () => {
    render(
      <TestWrapper>
        <TaskCard {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  test('shows completed status when task is completed', () => {
    const completedTask = { ...mockTask, completed: true };
    
    render(
      <TestWrapper>
        <TaskCard {...mockProps} task={completedTask} />
      </TestWrapper>
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  test('shows priority correctly', () => {
    const highPriorityTask = { ...mockTask, priority: 3 };
    
    render(
      <TestWrapper>
        <TaskCard {...mockProps} task={highPriorityTask} />
      </TestWrapper>
    );

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('opens edit dialog when edit button is clicked', async () => {
    render(
      <TestWrapper>
        <TaskCard {...mockProps} />
      </TestWrapper>
    );

    const editButton = screen.getByLabelText(/edit/i);
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });
  });

  test('calls onDelete when delete button is clicked', () => {
    render(
      <TestWrapper>
        <TaskCard {...mockProps} />
      </TestWrapper>
    );

    const deleteButton = screen.getByLabelText(/delete/i);
    fireEvent.click(deleteButton);

    expect(mockProps.onDelete).toHaveBeenCalledWith(1);
  });

  test('handles task without description', () => {
    const taskWithoutDescription = { ...mockTask, description: null };
    
    render(
      <TestWrapper>
        <TaskCard {...mockProps} task={taskWithoutDescription} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  test('handles task without due date', () => {
    const taskWithoutDueDate = { ...mockTask, due_date: null };
    
    render(
      <TestWrapper>
        <TaskCard {...mockProps} task={taskWithoutDueDate} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText(/Feb/)).not.toBeInTheDocument();
  });
});