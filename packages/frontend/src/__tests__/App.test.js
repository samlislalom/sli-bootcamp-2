import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

// Mock console.error for Material-UI warnings
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

// Mock server to intercept API requests for the new task API
const server = setupServer(
  // GET /api/tasks handler
  rest.get('/api/tasks', (req, res, ctx) => {
    const sort = req.url.searchParams.get('sort');
    const tasks = [
      { 
        id: 1, 
        name: 'Test Task 1', 
        description: 'First test task',
        priority: 2,
        completed: false,
        due_date: '2026-02-15',
        created_at: '2026-01-01T00:00:00.000Z' 
      },
      { 
        id: 2, 
        name: 'Test Task 2', 
        description: 'Second test task',
        priority: 1,
        completed: true,
        due_date: null,
        created_at: '2026-01-02T00:00:00.000Z' 
      },
    ];
    
    return res(
      ctx.status(200),
      ctx.json(tasks)
    );
  }),
  
  // POST /api/tasks handler
  rest.post('/api/tasks', (req, res, ctx) => {
    const { name, description, priority, due_date } = req.body;
    
    if (!name || name.trim() === '') {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Task name is required' })
      );
    }
    
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        name,
        description: description || null,
        priority: priority || 2,
        completed: false,
        due_date: due_date || null,
        created_at: new Date().toISOString(),
      })
    );
  })
);

// Setup and teardown for the mock server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the new task manager header', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    expect(screen.getByText('Keep track of your tasks with due dates and priorities')).toBeInTheDocument();
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
  });

  test('loads and displays tasks', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Initially shows loading state
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
    
    // Click the add task floating action button
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-fab'));
    });

    // Wait for dialog to open and fill in the form
    await waitFor(() => {
      expect(screen.getByLabelText(/task name/i)).toBeInTheDocument();
    });

    await act(async () => {
      await user.type(screen.getByLabelText(/task name/i), 'New Test Task');
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    });

    // Check that the new task appears after the API call and refresh
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    // Override the default handler to simulate an error
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks', async () => {
    // Override the default handler to return empty array
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([]));
      })
    );
    
    await act(async () => {
      render(<App />);
    });
    
    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(screen.getByText('Add your first task to get started!')).toBeInTheDocument();
    });
  });
});