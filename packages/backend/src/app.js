const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT 0,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert some initial data
const initialTasks = [
  { name: 'Complete project setup', description: 'Set up the development environment', due_date: '2026-02-15', priority: 2 },
  { name: 'Review documentation', description: 'Read through all project docs', due_date: '2026-02-01', priority: 1 },
  { name: 'Plan implementation', description: 'Create detailed implementation roadmap', priority: 1 }
];
const insertStmt = db.prepare('INSERT INTO items (name, description, due_date, priority) VALUES (?, ?, ?, ?)');

initialTasks.forEach(task => {
  insertStmt.run(task.name, task.description, task.due_date || null, task.priority);
});

console.log('In-memory database initialized with sample data');

// API Routes
app.get('/api/items', (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'priority_date';
    let orderClause = '';
    
    switch(sortBy) {
      case 'due_date':
        orderClause = 'ORDER BY due_date ASC NULLS LAST, priority DESC, created_at DESC';
        break;
      case 'priority':
        orderClause = 'ORDER BY priority DESC, due_date ASC NULLS LAST, created_at DESC';
        break;
      case 'created_at':
        orderClause = 'ORDER BY created_at DESC';
        break;
      default: // priority_date
        orderClause = 'ORDER BY CASE WHEN due_date < date("now") THEN 0 WHEN due_date <= date("now", "+7 days") THEN 1 ELSE 2 END, priority DESC, due_date ASC NULLS LAST, created_at DESC';
    }
    
    const items = db.prepare(`SELECT * FROM items ${orderClause}`).all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name, description, due_date, priority = 1 } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Task name is required' });
    }

    // Validate due_date if provided
    if (due_date && !Date.parse(due_date)) {
      return res.status(400).json({ error: 'Invalid due date format' });
    }

    // Validate priority
    if (priority && (!Number.isInteger(priority) || priority < 1 || priority > 3)) {
      return res.status(400).json({ error: 'Priority must be 1 (low), 2 (medium), or 3 (high)' });
    }

    const createStmt = db.prepare('INSERT INTO items (name, description, due_date, priority) VALUES (?, ?, ?, ?)');
    const result = createStmt.run(name, description || null, due_date || null, priority);
    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, due_date, completed, priority } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    // Check if item exists
    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate inputs
    if (name && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Task name must be a non-empty string' });
    }

    if (due_date && !Date.parse(due_date)) {
      return res.status(400).json({ error: 'Invalid due date format' });
    }

    if (priority && (!Number.isInteger(priority) || priority < 1 || priority > 3)) {
      return res.status(400).json({ error: 'Priority must be 1 (low), 2 (medium), or 3 (high)' });
    }

    // Prepare update fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (due_date !== undefined) updates.due_date = due_date;
    if (completed !== undefined) updates.completed = completed ? 1 : 0;
    if (priority !== undefined) updates.priority = priority;
    updates.updated_at = new Date().toISOString();

    // Build dynamic query
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    const updateStmt = db.prepare(`UPDATE items SET ${setClause} WHERE id = ?`);
    updateStmt.run(...values);

    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = { app, db };