describe('Task Manager - Complete User Journeys', () => {
  beforeEach(() => {
    // Start with a clean slate for each test
    cy.clearAllTasks();
    cy.visit('/');
    cy.waitForMaterialUI();
  });

  describe('New User Experience', () => {
    it('should guide a new user through creating their first task', () => {
      // Verify empty state
      cy.contains('No tasks yet').should('be.visible');
      cy.contains('Add your first task to get started!').should('be.visible');

      // Click the floating action button
      cy.get('[data-testid="add-task-fab"]').click();

      // Fill out the task creation form
      cy.get('[data-testid="task-name-input"]').type('Set up development environment');
      cy.get('[data-testid="task-description-input"]')
        .type('Install Node.js, clone repository, run npm install, and configure IDE');
      
      // Set due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
      
      cy.get('[data-testid="due-date-picker"]').click();
      cy.get(`[data-value="${tomorrowFormatted}"]`).click();

      // Set high priority
      cy.get('[data-testid="priority-select"]').click();
      cy.get('[data-value="3"]').click();

      // Submit the task
      cy.get('[data-testid="add-task-button"]').click();

      // Verify task appears in the list
      cy.contains('Set up development environment').should('be.visible');
      cy.contains('High').should('be.visible');
      cy.contains('Install Node.js').should('be.visible');

      // Verify backend state
      cy.request('/api/items').then((response) => {
        expect(response.body).to.have.length(1);
        expect(response.body[0]).to.include({
          name: 'Set up development environment',
          priority: 3
        });
      });
    });
  });

  describe('Power User Workflow', () => {
    beforeEach(() => {
      // Set up realistic tasks for power user scenario
      const tasks = [
        {
          name: 'Review security audit report',
          description: 'Go through penetration testing results and plan remediation',
          due_date: '2026-01-31', // Due today/soon
          priority: 3
        },
        {
          name: 'Update team documentation',
          description: 'Document new API endpoints and update developer guide',
          due_date: '2026-02-05',
          priority: 1
        },
        {
          name: 'Plan quarterly goals',
          description: 'Define objectives for Q1 and create project roadmap',
          due_date: null,
          priority: 2
        }
      ];

      tasks.forEach(task => {
        cy.createTaskViaAPI(task);
      });

      cy.reload();
      cy.waitForMaterialUI();
    });

    it('should handle complex task management operations', () => {
      // Verify smart sorting shows high-priority due task first
      cy.get('[data-testid="task-card"]').first()
        .should('contain', 'Review security audit report')
        .should('contain', 'High');

      // Test sorting functionality
      cy.get('[data-testid="sort-select"]').click();
      cy.get('[data-value="priority"]').click();

      // Verify priority sort works
      cy.get('[data-testid="task-card"]').first()
        .should('contain', 'High');

      // Edit a task - change priority and add due date
      cy.get('[data-testid="task-card"]').contains('Plan quarterly goals')
        .parent().parent().parent() // Navigate to card container
        .find('[data-testid="edit-task-button"]').click();

      cy.get('[data-testid="edit-priority-select"]').click();
      cy.get('[data-value="3"]').click();

      // Set due date to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekFormatted = nextWeek.toISOString().split('T')[0];
      
      cy.get('[data-testid="edit-due-date-picker"]').click();
      cy.get(`[data-value="${nextWeekFormatted}"]`).click();

      cy.get('[data-testid="save-task-button"]').click();

      // Verify changes are reflected immediately
      cy.contains('Plan quarterly goals')
        .parent().parent()
        .should('contain', 'High');

      // Verify backend state
      cy.verifyTaskInDatabase(null, {
        name: 'Plan quarterly goals',
        priority: 3,
        due_date: nextWeekFormatted
      });

      // Mark task as completed
      cy.get('[data-testid="task-card"]').contains('Update team documentation')
        .parent().parent().parent()
        .find('[data-testid="edit-task-button"]').click();

      cy.get('[data-testid="completed-checkbox"]').check();
      cy.get('[data-testid="save-task-button"]').click();

      // Verify completed task styling
      cy.contains('Update team documentation')
        .should('have.css', 'text-decoration')
        .and('include', 'line-through');

      cy.contains('Completed').should('be.visible');

      // Delete a task
      cy.get('[data-testid="task-card"]').contains('Review security audit report')
        .parent().parent().parent()
        .find('[data-testid="delete-task-button"]').click();

      // Confirm deletion in potential confirmation dialog
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="confirm-delete"]').length > 0) {
          cy.get('[data-testid="confirm-delete"]').click();
        }
      });

      // Verify task is removed from UI
      cy.contains('Review security audit report').should('not.exist');

      // Verify backend state
      cy.request('/api/items').then((response) => {
        const deletedTask = response.body.find(t => t.name === 'Review security audit report');
        expect(deletedTask).to.be.undefined;
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle network failures gracefully', () => {
      // Intercept API calls and simulate failures
      cy.intercept('POST', '/api/items', { forceNetworkError: true }).as('createTaskError');

      cy.get('[data-testid="add-task-fab"]').click();
      cy.get('[data-testid="task-name-input"]').type('Test Task');
      cy.get('[data-testid="add-task-button"]').click();

      cy.wait('@createTaskError');

      // Verify error message is shown
      cy.contains('Error adding task').should('be.visible');

      // Verify form is still open for retry
      cy.get('[data-testid="task-name-input"]').should('contain.value', 'Test Task');
    });

    it('should handle invalid form data', () => {
      cy.get('[data-testid="add-task-fab"]').click();

      // Try to submit empty form
      cy.get('[data-testid="add-task-button"]').should('be.disabled');

      // Add just whitespace
      cy.get('[data-testid="task-name-input"]').type('   ');
      cy.get('[data-testid="add-task-button"]').should('be.disabled');

      // Add valid name
      cy.get('[data-testid="task-name-input"]').clear().type('Valid Task Name');
      cy.get('[data-testid="add-task-button"]').should('not.be.disabled');
    });

    it('should handle tasks with very long content', () => {
      const longTaskName = 'A'.repeat(200);
      const longDescription = 'B'.repeat(1000);

      cy.createTaskViaAPI({
        name: longTaskName,
        description: longDescription,
        priority: 1
      });

      cy.reload();
      cy.waitForMaterialUI();

      // Verify long content is displayed properly without breaking layout
      cy.get('[data-testid="task-card"]')
        .should('contain', longTaskName.substring(0, 50))
        .should('be.visible');

      // Verify card doesn't overflow viewport
      cy.get('[data-testid="task-card"]').first().then(($card) => {
        expect($card[0].offsetWidth).to.be.lessThan(Cypress.config('viewportWidth'));
      });
    });
  });

  describe('Responsive Design Validation', () => {
    const viewports = [
      { width: 320, height: 568, device: 'iPhone SE' },
      { width: 768, height: 1024, device: 'iPad' },
      { width: 1920, height: 1080, device: 'Desktop' }
    ];

    viewports.forEach(({ width, height, device }) => {
      it(`should work correctly on ${device} (${width}x${height})`, () => {
        cy.createTaskViaAPI({
          name: 'Responsive test task',
          description: 'Testing responsive layout',
          priority: 2
        });

        cy.viewport(width, height);
        cy.reload();
        cy.waitForMaterialUI();

        // Verify core functionality works on all screen sizes
        cy.contains('Responsive test task').should('be.visible');
        cy.get('[data-testid="add-task-fab"]').should('be.visible');

        // Verify FAB positioning is appropriate for screen size
        cy.get('[data-testid="add-task-fab"]').then(($fab) => {
          const fabPosition = $fab[0].getBoundingClientRect();
          expect(fabPosition.bottom).to.be.lessThan(height);
          expect(fabPosition.right).to.be.lessThan(width);
        });

        // Test task creation on smaller screens
        cy.get('[data-testid="add-task-fab"]').click();
        cy.get('[data-testid="task-name-input"]').should('be.visible');
        cy.get('[data-testid="task-name-input"]').type('Mobile test task');
        cy.get('[data-testid="add-task-button"]').click();

        cy.contains('Mobile test task').should('be.visible');
      });
    });
  });

  describe('Accessibility Validation', () => {
    beforeEach(() => {
      cy.createTaskViaAPI({
        name: 'Accessibility test task',
        description: 'Testing keyboard navigation and screen reader support',
        priority: 2
      });
      cy.reload();
      cy.waitForMaterialUI();
    });

    it('should be fully keyboard navigable', () => {
      // Tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('contain', 'Smart Sort'); // Sort dropdown

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'edit-task-button');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'delete-task-button');

      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'add-task-fab');

      // Test keyboard activation
      cy.focused().type('{enter}'); // Open add dialog
      cy.get('[data-testid="task-name-input"]').should('be.focused');

      // Escape to close dialog
      cy.get('body').type('{esc}');
      cy.get('[data-testid="task-name-input"]').should('not.exist');
    });

    it('should have proper ARIA labels and roles', () => {
      // Verify important elements have ARIA labels
      cy.get('[data-testid="add-task-fab"]')
        .should('have.attr', 'aria-label', 'add task');

      cy.get('[data-testid="edit-task-button"]')
        .should('have.attr', 'aria-label')
        .and('include', 'edit');

      cy.get('[data-testid="delete-task-button"]')
        .should('have.attr', 'aria-label')
        .and('include', 'delete');

      // Verify proper heading structure
      cy.get('h1').should('contain', 'Task Manager');
    });
  });
});