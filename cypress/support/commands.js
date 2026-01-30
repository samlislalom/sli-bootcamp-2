// cypress/support/commands.js

// Add the tab command for accessibility testing
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject, options) => {
  return cy.wrap(subject).trigger('keydown', { keyCode: 9, which: 9, ...options });
});

// Custom command to create a task via API (for test setup)
Cypress.Commands.add('createTaskViaAPI', (task) => {
  cy.request({
    method: 'POST',
    url: '/api/items',
    body: task
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

// Custom command to verify backend state
Cypress.Commands.add('verifyTaskInDatabase', (taskId, expectedData) => {
  cy.request(`/api/items`).then((response) => {
    const task = response.body.find(t => t.id === taskId);
    if (expectedData) {
      expect(task).to.include(expectedData);
    } else {
      expect(task).to.be.undefined;
    }
  });
});

// Custom command to clear all tasks
Cypress.Commands.add('clearAllTasks', () => {
  cy.request('/api/items').then((response) => {
    response.body.forEach((task) => {
      cy.request('DELETE', `/api/items/${task.id}`);
    });
  });
});

// Custom command to wait for Material-UI components to load
Cypress.Commands.add('waitForMaterialUI', () => {
  // Wait for Material-UI theme to be applied
  cy.get('[data-testid="task-manager-container"]', { timeout: 10000 }).should('be.visible');
});