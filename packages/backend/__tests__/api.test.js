const request = require('supertest');
const { app, db } = require('../src/app');

describe('Task API Endpoints', () => {
  beforeEach(() => {
    // Clear and reset the database before each test
    db.exec('DELETE FROM items');
    db.exec(`INSERT INTO items (name, description, due_date, priority) VALUES 
      ('Test Task 1', 'Description 1', '2026-02-15', 1),
      ('Test Task 2', 'Description 2', '2026-02-01', 2),
      ('Test Task 3', 'Description 3', null, 3)`);
  });

  afterAll(() => {
    db.close();
  });

  describe('GET /api/items', () => {
    test('should return all items with default sorting', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('priority');
    });

    test('should sort items by due_date when specified', async () => {
      const response = await request(app)
        .get('/api/items?sortBy=due_date')
        .expect(200);

      expect(response.body).toHaveLength(3);
      // Should have due_date items first, then null due_date items
      const withDueDate = response.body.filter(item => item.due_date !== null);
      const withoutDueDate = response.body.filter(item => item.due_date === null);
      
      expect(withDueDate.length).toBeGreaterThan(0);
      expect(withoutDueDate.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/items', () => {
    test('should create a new task with required fields', async () => {
      const newTask = {
        name: 'New Test Task',
        description: 'New task description',
        priority: 2
      };

      const response = await request(app)
        .post('/api/items')
        .send(newTask)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'New Test Task',
        description: 'New task description',
        priority: 2
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('created_at');
    });

    test('should create a task with due date', async () => {
      const newTask = {
        name: 'Task with due date',
        due_date: '2026-03-01',
        priority: 1
      };

      const response = await request(app)
        .post('/api/items')
        .send(newTask)
        .expect(201);

      expect(response.body.due_date).toBe('2026-03-01');
    });

    test('should return 400 for empty task name', async () => {
      const invalidTask = {
        name: '',
        description: 'Test'
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidTask)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Task name is required');
    });

    test('should return 400 for invalid priority', async () => {
      const invalidTask = {
        name: 'Test Task',
        priority: 5
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidTask)
        .expect(400);

      expect(response.body.error).toContain('Priority must be');
    });

    test('should return 400 for invalid due date', async () => {
      const invalidTask = {
        name: 'Test Task',
        due_date: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/items')
        .send(invalidTask)
        .expect(400);

      expect(response.body.error).toBe('Invalid due date format');
    });
  });

  describe('PUT /api/items/:id', () => {
    test('should update an existing task', async () => {
      // First, get an existing task
      const getResponse = await request(app).get('/api/items');
      const existingTask = getResponse.body[0];

      const updatedData = {
        name: 'Updated Task Name',
        description: 'Updated description',
        priority: 3
      };

      const response = await request(app)
        .put(`/api/items/${existingTask.id}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toMatchObject(updatedData);
      expect(response.body.id).toBe(existingTask.id);
    });

    test('should mark task as completed', async () => {
      const getResponse = await request(app).get('/api/items');
      const existingTask = getResponse.body[0];

      const response = await request(app)
        .put(`/api/items/${existingTask.id}`)
        .send({ completed: true })
        .expect(200);

      expect(response.body.completed).toBe(1); // SQLite stores boolean as 1/0
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/items/999999')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    test('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/items/invalid')
        .send({ name: 'Updated' })
        .expect(400);

      expect(response.body.error).toBe('Valid item ID is required');
    });
  });

  describe('DELETE /api/items/:id', () => {
    test('should delete an existing task', async () => {
      const getResponse = await request(app).get('/api/items');
      const existingTask = getResponse.body[0];

      await request(app)
        .delete(`/api/items/${existingTask.id}`)
        .expect(200);

      // Verify the task is deleted
      const updatedResponse = await request(app).get('/api/items');
      const deletedTask = updatedResponse.body.find(task => task.id === existingTask.id);
      expect(deletedTask).toBeUndefined();
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/items/999999')
        .expect(404);

      expect(response.body.error).toBe('Item not found');
    });
  });
});