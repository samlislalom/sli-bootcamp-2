# Coding Guidelines

## Overview

This document outlines the coding standards and best practices for the task management application to ensure code consistency, maintainability, and quality across the project.

## General Formatting Rules

### Code Style
- Use consistent indentation (2 spaces for JavaScript/React)
- Maintain consistent line length (recommended 80-100 characters)
- Use meaningful variable and function names that clearly describe their purpose
- Follow camelCase naming convention for variables and functions
- Use PascalCase for React components and class names
- Include proper spacing around operators and after commas

### Code Organization
- Group related functionality together
- Separate concerns appropriately (business logic, UI logic, data handling)
- Use consistent file and folder naming conventions
- Keep files focused and reasonably sized (typically under 200-300 lines)

## Import Organization

### Import Order
1. External library imports (React, lodash, etc.)
2. Internal utility imports
3. Component imports
4. Type/interface imports (if using TypeScript)
5. Relative imports (./components, ../utils)

### Import Formatting
- Use named imports when possible over default imports
- Group imports by category with blank lines between groups
- Sort imports alphabetically within each group
- Use absolute paths for internal imports when configured

## Linter Usage

### ESLint Configuration
- Use ESLint with appropriate rules for JavaScript/React development
- Configure rules to enforce consistent code style and catch common errors
- Use Prettier for automatic code formatting
- Integrate linting into the development workflow and CI/CD pipeline
- Address all linting warnings and errors before code review

### Code Quality Tools
- Run linters automatically on save and before commits
- Use pre-commit hooks to ensure code quality standards
- Configure IDE/editor to show linting errors in real-time
- Maintain consistent linting rules across all team members

## Best Practices

### DRY Principle (Don't Repeat Yourself)
- Extract common functionality into reusable functions or components
- Create utility functions for repeated logic
- Use configuration files for repeated values and settings
- Implement shared components for common UI patterns
- Avoid code duplication across different parts of the application

### Code Quality Principles
- **SOLID Principles**: Write code that is modular and maintainable
- **Single Responsibility**: Each function/component should have one clear purpose
- **Separation of Concerns**: Keep business logic separate from presentation logic
- **Composition over Inheritance**: Prefer composing functionality rather than deep inheritance chains

### Error Handling
- Implement proper error boundaries in React components
- Use try-catch blocks appropriately for asynchronous operations
- Provide meaningful error messages for users
- Log errors appropriately for debugging and monitoring
- Handle edge cases and invalid inputs gracefully

### Performance Considerations
- Use React.memo, useMemo, and useCallback judiciously
- Optimize re-renders by proper state management
- Lazy load components and routes when appropriate
- Minimize bundle size through proper import practices
- Profile and monitor application performance regularly

## Implementation Notes

- Follow the established patterns in the existing codebase
- Document complex logic with clear comments
- Write self-documenting code that doesn't require extensive comments
- Use TypeScript when it adds value for type safety and documentation
- Regular code reviews to maintain quality standards