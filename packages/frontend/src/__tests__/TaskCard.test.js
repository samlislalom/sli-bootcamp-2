import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createAppTheme } from '../theme';
import TaskCard from '../TaskCard';

// Mock console.error to suppress act() warnings from Material-UI
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes('Warning: An update to') && args[0]?.includes('was not wrapped in act')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Create realistic test data factory
const createMockTask = (overrides = {}) => ({
  id: Math.floor(Math.random() * 10000),
  name: 'Review project documentation',
  description: 'Go through all technical specs and requirements for the new feature implementation',
  due_date: '2026-02-15',
  completed: false,
  priority: 2,
  created_at: '2026-01-25T10:30:00Z',
  updated_at: '2026-01-30T14:45:00Z',
  ...overrides
});

// Test scenarios with realistic edge cases
const testScenarios = {
  overdue: createMockTask({
    name: 'Fix critical security vulnerability',
    due_date: '2026-01-25', // Past date
    priority: 3,
    completed: false
  }),
  completedHighPriority: createMockTask({
    name: 'Deploy hotfix to production',
    completed: true,
    priority: 3,
    due_date: '2026-02-01'
  }),
  lowPriorityNoDate: createMockTask({
    name: 'Update team wiki documentation',
    priority: 1,
    due_date: null,
    description: null
  }),
  longDescription: createMockTask({
    name: 'Research new testing frameworks',
    description: 'Research and evaluate Jest alternatives, including Vitest and Testing Library ecosystem. Need to consider performance, compatibility with React 18, and team learning curve. Document findings in technical decision record.',
    priority: 1
  })
};

const TestWrapper = ({ children }) => {
  const theme = createAppTheme(false);
  
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('TaskCard Component', () => {
  let mockProps;

  // Isolated setup - fresh mocks for each test
  beforeEach(() => {
    mockProps = {
      onUpdate: jest.fn(),
      onDelete: jest.fn()
    };
  });

  describe('Priority Display', () => {
    test('displays high priority with correct styling', async () => {
      const highPriorityTask = createMockTask({ priority: 3 });
      
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={highPriorityTask} />
          </TestWrapper>
        );
      });

      const priorityChip = screen.getByText('High');
      expect(priorityChip).toBeInTheDocument();
      // Test that the chip has error color (Material-UI applies color via CSS classes)
      expect(priorityChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
    });

    test('displays medium priority correctly', async () => {
      const mediumPriorityTask = createMockTask({ priority: 2 });
      
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={mediumPriorityTask} />
          </TestWrapper>
        );
      });

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    test('displays low priority correctly', async () => {
      const lowPriorityTask = createMockTask({ priority: 1 });
      
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={lowPriorityTask} />
          </TestWrapper>
        );
      });

      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    test('handles invalid priority gracefully', async () => {
      const invalidPriorityTask = createMockTask({ priority: 999 });
      
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={invalidPriorityTask} />
          </TestWrapper>
        );
      });

      expect(screen.getByText('Low')).toBeInTheDocument(); // Should default to Low
    });
  });

  describe('Due Date and Urgency Indicators', () => {
    test('highlights overdue tasks with error styling', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={testScenarios.overdue} />
          </TestWrapper>
        );
      });

      const card = screen.getByText('Fix critical security vulnerability').closest('.MuiCard-root');
      expect(card).toHaveStyle('border: 2px solid'); // Error border for overdue
    });

    test('shows due soon warning for tasks due within 3 days', async () => {
      const dueSoonTask = createMockTask({
        due_date: '2026-02-01', // Assuming today is 2026-01-30, this is 2 days away
      });
      
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={dueSoonTask} />
          </TestWrapper>
        );
      });

      const dateChip = screen.getByText(/Feb/);
      expect(dateChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning');
    });
  });

  describe('Task State Management', () => {
    test('completed tasks have reduced opacity and strikethrough', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={testScenarios.completedHighPriority} />
          </TestWrapper>
        );
      });

      const taskTitle = screen.getByText('Deploy hotfix to production');
      expect(taskTitle).toHaveStyle('text-decoration: line-through');
      
      const card = taskTitle.closest('.MuiCard-root');
      expect(card).toHaveStyle('opacity: 0.7');
    });

    test('shows completion badge for completed tasks', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={testScenarios.completedHighPriority} />
          </TestWrapper>
        );
      });

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Content Handling', () => {
    test('handles tasks without description gracefully', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={testScenarios.lowPriorityNoDate} />
          </TestWrapper>
        );
      });

      expect(screen.getByText('Update team wiki documentation')).toBeInTheDocument();
      expect(screen.queryByText('Go through all technical specs')).not.toBeInTheDocument();
    });

    test('displays long descriptions without breaking layout', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={testScenarios.longDescription} />
          </TestWrapper>
        );
      });

      const description = screen.getByText(/Research and evaluate Jest alternatives/);
      expect(description).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('edit dialog opens with pre-populated data', async () => {
      const task = createMockTask();
      
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={task} />
          </TestWrapper>
        );
      });

      await act(async () => {
        fireEvent.click(screen.getByLabelText(/edit/i));
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue(task.name)).toBeInTheDocument();
        if (task.description) {
          expect(screen.getByDisplayValue(task.description)).toBeInTheDocument();
        }
      });
    });

    test('calls onUpdate with correct task ID and data structure', async () => {
      const task = createMockTask();
      
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={task} />
          </TestWrapper>
        );
      });

      await act(async () => {
        fireEvent.click(screen.getByLabelText(/edit/i));
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
      });

      await waitFor(() => {
        expect(mockProps.onUpdate).toHaveBeenCalledWith(
          task.id,
          expect.objectContaining({
            name: task.name,
            description: task.description,
            priority: task.priority,
            completed: false
          })
        );
      });
    });

    test('calls onDelete with correct task ID', async () => {
      const task = createMockTask();
      
      await act(async () => {
        render(
          <TestWrapper>
            <TaskCard {...mockProps} task={task} />
          </TestWrapper>
        );
      });

      await act(async () => {
        fireEvent.click(screen.getByLabelText(/delete/i));
      });

      expect(mockProps.onDelete).toHaveBeenCalledWith(task.id);
      expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
    });
  });
});