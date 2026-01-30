import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const TaskCard = ({ task, onUpdate, onDelete }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: task.name,
    description: task.description || '',
    due_date: task.due_date ? dayjs(task.due_date) : null,
    completed: Boolean(task.completed),
    priority: task.priority || 1
  });

  const handleEditSubmit = async () => {
    try {
      const updatedTask = {
        ...editForm,
        due_date: editForm.due_date ? editForm.due_date.format('YYYY-MM-DD') : null
      };
      await onUpdate(task.id, updatedTask);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 3: return 'error';
      case 2: return 'warning';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 3: return 'High';
      case 2: return 'Medium';
      default: return 'Low';
    }
  };

  const isOverdue = task.due_date && dayjs(task.due_date).isBefore(dayjs(), 'day');
  const isDueSoon = task.due_date && dayjs(task.due_date).isBefore(dayjs().add(3, 'days'), 'day') && !isOverdue;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card 
        sx={{ 
          mb: 2, 
          opacity: task.completed ? 0.7 : 1,
          border: isOverdue ? 2 : 0,
          borderColor: 'error.main'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  textDecoration: task.completed ? 'line-through' : 'none',
                  mb: 1 
                }}
              >
                {task.name}
              </Typography>
              
              {task.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {task.description}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  icon={<FlagIcon />}
                  label={getPriorityLabel(task.priority)}
                  color={getPriorityColor(task.priority)}
                  size="small"
                />
                
                {task.due_date && (
                  <Chip
                    icon={<CalendarIcon />}
                    label={dayjs(task.due_date).format('MMM D')}
                    color={isOverdue ? 'error' : isDueSoon ? 'warning' : 'default'}
                    size="small"
                  />
                )}
                
                {task.completed && (
                  <Chip
                    label="Completed"
                    color="success"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            
            <Box>
              <IconButton onClick={() => setEditDialogOpen(true)} size="small">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => onDelete(task.id)} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Task Name"
              value={editForm.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="Description"
              value={editForm.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            
            <DatePicker
              label="Due Date"
              value={editForm.due_date}
              onChange={(date) => handleFormChange('due_date', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={editForm.priority}
                label="Priority"
                onChange={(e) => handleFormChange('priority', e.target.value)}
              >
                <MenuItem value={1}>Low</MenuItem>
                <MenuItem value={2}>Medium</MenuItem>
                <MenuItem value={3}>High</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={editForm.completed}
                  onChange={(e) => handleFormChange('completed', e.target.checked)}
                />
              }
              label="Completed"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TaskCard;