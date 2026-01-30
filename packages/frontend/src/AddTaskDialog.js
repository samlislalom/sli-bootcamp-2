import React, { useState } from 'react';
import {
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
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const AddTaskDialog = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: null,
    priority: 1
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    try {
      const taskData = {
        ...formData,
        due_date: formData.due_date ? formData.due_date.format('YYYY-MM-DD') : null
      };
      await onSubmit(taskData);
      setFormData({
        name: '',
        description: '',
        due_date: null,
        priority: 1
      });
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Task Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              fullWidth
              required
              autoFocus
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            
            <DatePicker
              label="Due Date"
              value={formData.due_date}
              onChange={(date) => handleFormChange('due_date', date)}
              slotProps={{ textField: { fullWidth: true } }}
              minDate={dayjs()}
            />
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => handleFormChange('priority', e.target.value)}
              >
                <MenuItem value={1}>Low</MenuItem>
                <MenuItem value={2}>Medium</MenuItem>
                <MenuItem value={3}>High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name.trim()}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddTaskDialog;