const request = require('supertest');
const { app, db } = require('../src/app');

describe('Task Management API Integration Tests', () => {
  // Helper to create realistic test data
  const createRealisticTasks = () => {
    const tasks = [
      {
        name: 'Review pull request #234',
        description: 'Code review for new authentication feature including security analysis',
        due_date: '2026-02-01',
        priority: 3
      },
      {
        name: 'Update project documentation',
        description: 'Add API documentation for new endpoints',
        due_date: '2026-02-15',
        priority: 1
      },
      {
        name: 'Fix memory leak in user service',
        description: 'Investigate and resolve memory issues reported in production',
        due_date: '2026-01-25', // Overdue
        priority: 3
      },
      {
        name: 'Plan Q2 roadmap',
        description: null, // No description
        due_date: null, // No due date
        priority: 2
      }
    ];

    return tasks;
  };

  beforeEach(() => {
    // Clean slate for each test - ensures isolation
    db.exec('DELETE FROM tasks');
    
    // Insert realistic test data
    const tasks = createRealisticTasks();
    const insertStmt = db.prepare('INSERT INTO tasks (name, description, due_date, priority) VALUES (?, ?, ?, ?)');
    
    tasks.forEach(task => {
      insertStmt.run(task.name, task.description, task.due_date, task.priority);
    });
  });

  afterAll(() => {
    db.close();
  });

  describe('GET /api/tasks - Sorting and Data Integrity', () => {
    test('smart sort prioritizes overdue high-priority tasks', async () => {
      const response = await request(app)
        .get('/api/tasks?sortBy=priority_date')
        .expect(200);

      expect(response.body).toHaveLength(4);
      
      // First task should be the overdue high-priority one
      const firstTask = response.body[0];
      expect(firstTask.name).toBe('Fix memory leak in user service');
      expect(firstTask.priority).toBe(3);
      expect(firstTask.due_date).toBe('2026-01-25'); // Overdue date
    });

    test('due_date sort handles null values correctly', async () => {
      const response = await request(app)
        .get('/api/tasks?sortBy=due_date')
        .expect(200);

      const withDueDates = response.body.filter(task => task.due_date !== null);
      const withoutDueDates = response.body.filter(task => task.due_date === null);
      
      // Tasks with due dates should come first
      expect(withDueDates.length).toBe(3);
      expect(withoutDueDates.length).toBe(1);
      
      // Due dates should be in ascending order
      for (let i = 1; i < withDueDates.length; i++) {
        expect(new Date(withDueDates[i-1].due_date).getTime())
          .toBeLessThanOrEqual(new Date(withDueDates[i].due_date).getTime());
      }
    });

    test('returns all required fields with correct data types', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      const task = response.body[0];
      
      expect(typeof task.id).toBe('number');
      expect(typeof task.name).toBe('string');
      expect(typeof task.priority).toBe('number');
      expect(typeof task.completed).toBe('number'); // SQLite stores as 0/1
      expect(task.created_at).toMatch(/\d{4}-\d{2}-\d{2}/); // ISO date format
      
      // Optional fields can be null
      if (task.description !== null) {
        expect(typeof task.description).toBe('string');
      }
      if (task.due_date !== null) {
        expect(task.due_date).toMatch(/\d{4}-\d{2}-\d{2}/);
      }
    });
  });

  describe('POST /api/tasks - Data Validation and Persistence', () => {
    test('creates task with all fields and persists correctly', async () => {
      const newTask = {
        name: 'Implement automated testing pipeline',
        description: 'Set up CI/CD with Jest, Cypress, and deployment automation',
        due_date: '2026-03-01',
        priority: 2
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);

      // Verify response structure
      expect(createResponse.body).toMatchObject(newTask);
      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body).toHaveProperty('created_at');
      expect(createResponse.body.completed).toBe(0); // Default value

      // Verify persistence by fetching from database
      const fetchResponse = await request(app)
        .get('/api/tasks')
        .expect(200);

      const createdTask = fetchResponse.body.find(t => t.id === createResponse.body.id);
      expect(createdTask).toMatchObject(newTask);
    });

    test('validates business rules for realistic scenarios', async () => {
      // Test priority boundary validation
      const invalidHighPriority = {
        name: 'Test Task',
        priority: 4 // Invalid: only 1-3 allowed
      };

      await request(app)
        .post('/api/tasks')
        .send(invalidHighPriority)
        .expect(400);

      // Test date format validation with common invalid formats
      const invalidDateFormats = [
        '02/15/2026', // US format
        '15-02-2026', // DD-MM-YYYY
        '2026/02/15', // Alternative slash format
        'Feb 15, 2026' // Textual format
      ];

      for (const invalidDate of invalidDateFormats) {
        await request(app)
          .post('/api/tasks')
          .send({ name: 'Test', due_date: invalidDate })
          .expect(400);
      }
    });

    test('handles edge cases in task names', async () => {
      const edgeCases = [
        '', // Empty string
        '   ', // Whitespace only
        null, // Null value
        undefined // Undefined value
      ];

      for (const invalidName of edgeCases) {
        await request(app)
          .post('/api/tasks')
          .send({ name: invalidName })
          .expect(400);
      }
    });
  });

  describe('PUT /api/tasks/:id - Update Operations and State Consistency', () => {
    test('partial updates preserve other fields', async () => {
      // Get an existing task
      const getResponse = await request(app).get('/api/tasks');
      const originalTask = getResponse.body[0];

      // Update only priority
      const updateResponse = await request(app)
        .put(`/api/tasks/${originalTask.id}`)
        .send({ priority: 1 })
        .expect(200);

      // Verify only priority changed
      expect(updateResponse.body.priority).toBe(1);
      expect(updateResponse.body.name).toBe(originalTask.name);
      expect(updateResponse.body.description).toBe(originalTask.description);
      expect(updateResponse.body.due_date).toBe(originalTask.due_date);
      expect(updateResponse.body.updated_at).not.toBe(originalTask.updated_at);
    });

    test('task completion workflow', async () => {
      const getResponse = await request(app).get('/api/tasks');
      const task = getResponse.body.find(t => t.name.includes('documentation'));

      // Mark as completed
      const completeResponse = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ completed: true })
        .expect(200);

      expect(completeResponse.body.completed).toBe(1);

      // Mark as incomplete
      const incompleteResponse = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ completed: false })
        .expect(200);

      expect(incompleteResponse.body.completed).toBe(0);
    });

    test('validates updated due dates are realistic', async () => {
      const getResponse = await request(app).get('/api/tasks');
      const task = getResponse.body[0];

      // Try to set due date in the past (should be allowed for flexibility)
      await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ due_date: '2025-01-01' })
        .expect(200);

      // Try invalid date format
      await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ due_date: 'not-a-date' })
        .expect(400);
    });
  });

  describe('DELETE /api/tasks/:id - Cleanup and Referential Integrity', () => {
    test('deletion removes task completely from database', async () => {
      const getResponse = await request(app).get('/api/tasks');
      const initialCount = getResponse.body.length;
      const taskToDelete = getResponse.body[0];

      // Delete task
      await request(app)
        .delete(`/api/tasks/${taskToDelete.id}`)
        .expect(200);

      // Verify count decreased
      const afterDeleteResponse = await request(app).get('/api/tasks');
      expect(afterDeleteResponse.body).toHaveLength(initialCount - 1);

      // Verify specific task is gone
      const deletedTask = afterDeleteResponse.body.find(t => t.id === taskToDelete.id);
      expect(deletedTask).toBeUndefined();

      // Verify attempting to fetch deleted task returns 404
      await request(app)
        .get(`/api/tasks/${taskToDelete.id}`)
        .expect(404);
    });

    test('handles concurrent deletion attempts', async () => {
      const getResponse = await request(app).get('/api/tasks');
      const taskId = getResponse.body[0].id;

      // First deletion should succeed
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);

      // Second deletion should fail
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(404);
    });
  });

  describe('End-to-End Workflows', () => {
    test('complete task lifecycle: create -> update -> complete -> delete', async () => {
      // Create
      const createData = {
        name: 'E2E Test Task',
        description: 'Testing complete workflow',
        due_date: '2026-03-01',
        priority: 2
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .send(createData)
        .expect(201);

      const taskId = createResponse.body.id;

      // Update description and priority
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ 
          description: 'Updated description for E2E testing',
          priority: 3 
        })
        .expect(200);

      // Mark complete
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ completed: true })
        .expect(200);

      // Verify task appears in listing with correct state
      const listResponse = await request(app).get('/api/tasks');
      const task = listResponse.body.find(t => t.id === taskId);
      
      expect(task).toMatchObject({
        name: 'E2E Test Task',
        description: 'Updated description for E2E testing',
        priority: 3,
        completed: 1,
        due_date: '2026-03-01'
      });

      // Delete
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(200);

      // Verify removal
      const finalResponse = await request(app).get('/api/tasks');
      expect(finalResponse.body.find(t => t.id === taskId)).toBeUndefined();
    });

    test('sorting consistency under data changes', async () => {
      // Get initial smart sort order
      const initial = await request(app).get('/api/tasks?sortBy=priority_date');
      const firstTaskId = initial.body[0].id;

      // Change priority of first task to low
      await request(app)
        .put(`/api/tasks/${firstTaskId}`)
        .send({ priority: 1 })
        .expect(200);

      // Verify sort order changed
      const afterUpdate = await request(app).get('/api/tasks?sortBy=priority_date');
      expect(afterUpdate.body[0].id).not.toBe(firstTaskId);

      // Original task should now appear later in list
      const updatedTask = afterUpdate.body.find(t => t.id === firstTaskId);
      expect(updatedTask.priority).toBe(1);
    });
  });
});