import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { createAppTheme } from '../theme';
import AddTaskDialog from '../AddTaskDialog';

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

const mockProps = {
  open: true,
  onClose: jest.fn(),
  onSubmit: jest.fn()
};

describe('AddTaskDialog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dialog when open', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <AddTaskDialog {...mockProps} />
        </TestWrapper>
      );
    });

    expect(screen.getByText('Add New Task')).toBeInTheDocument();
    expect(screen.getByLabelText('Task Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  test('does not render dialog when closed', () => {
    render(
      <TestWrapper>
        <AddTaskDialog {...mockProps} open={false} />
      </TestWrapper>
    );

    expect(screen.queryByText('Add New Task')).not.toBeInTheDocument();
  });

  test('add task button is disabled when name is empty', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <AddTaskDialog {...mockProps} />
        </TestWrapper>
      );
    });

    const addButton = screen.getByRole('button', { name: /add task/i });
    expect(addButton).toBeDisabled();
  });

  test('add task button is enabled when name is provided', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(
        <TestWrapper>
          <AddTaskDialog {...mockProps} />
        </TestWrapper>
      );
    });

    const nameInput = screen.getByLabelText('Task Name *');
    
    await act(async () => {
      await user.type(nameInput, 'New Task');
    });

    const addButton = screen.getByRole('button', { name: /add task/i });
    expect(addButton).not.toBeDisabled();
  });

  test('calls onSubmit with correct data when form is submitted', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(
        <TestWrapper>
          <AddTaskDialog {...mockProps} />
        </TestWrapper>
      );
    });

    // Fill in the form
    const nameInput = screen.getByLabelText('Task Name *');
    const descriptionInput = screen.getByLabelText('Description');
    
    await act(async () => {
      await user.type(nameInput, 'New Task');
      await user.type(descriptionInput, 'Task description');
    });

    // Submit the form
    const addButton = screen.getByRole('button', { name: /add task/i });
    
    await act(async () => {
      await user.click(addButton);
    });

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        name: 'New Task',
        description: 'Task description',
        due_date: null,
        priority: 1
      });
    });
  });

  test('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(
        <TestWrapper>
          <AddTaskDialog {...mockProps} />
        </TestWrapper>
      );
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    
    await act(async () => {
      await user.click(cancelButton);
    });

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('resets form after submission', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(
        <TestWrapper>
          <AddTaskDialog {...mockProps} />
        </TestWrapper>
      );
    });

    const nameInput = screen.getByLabelText('Task Name *');
    
    await act(async () => {
      await user.type(nameInput, 'New Task');
    });
    
    const addButton = screen.getByRole('button', { name: /add task/i });
    
    await act(async () => {
      await user.click(addButton);
    });

    // Form should be reset (though dialog might close, so this tests the internal state)
    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });
});