import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
  Box,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { createAppTheme } from './theme';
import TaskCard from './TaskCard';
import AddTaskDialog from './AddTaskDialog';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState('priority_date');
  
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = createAppTheme(prefersDarkMode);

  useEffect(() => {
    fetchTasks();
  }, [sortBy]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/items?sortBy=${sortBy}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setTasks(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      const result = await response.json();
      setTasks([result, ...tasks]);
    } catch (err) {
      setError('Error adding task: ' + err.message);
      console.error('Error adding task:', err);
    }
  };

  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      const response = await fetch(`/api/items/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
      setError(null);
    } catch (err) {
      setError('Error updating task: ' + err.message);
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`/api/items/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(tasks.filter(task => task.id !== taskId));
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
      console.error('Error deleting task:', err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Task Manager
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Keep track of your tasks with due dates and priorities
          </Typography>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="priority_date">Smart Sort (Priority & Due Date)</MenuItem>
              <MenuItem value="due_date">Due Date</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="created_at">Recently Added</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading tasks...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ mb: 2 }}>
            <Typography color="error" align="center">
              {error}
            </Typography>
          </Box>
        )}

        {!loading && !error && (
          <Box>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tasks yet
                </Typography>
                <Typography color="text.secondary">
                  Add your first task to get started!
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Fab
          color="primary"
          aria-label="add task"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => setAddDialogOpen(true)}
        >
          <AddIcon />
        </Fab>

        <AddTaskDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onSubmit={handleAddTask}
        />
      </Container>
    </ThemeProvider>
  );
}

export default App;