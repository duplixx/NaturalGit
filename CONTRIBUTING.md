# Contributing Guide

Thank you for your interest in contributing to NaturalGit! This is an educational project, so contributions that improve documentation, code clarity, and learning materials are especially welcome.

## How to Contribute

### Types of Contributions

We welcome contributions in the following areas:

1. **Documentation**
   - Improve tutorials
   - Add code comments
   - Fix typos
   - Add examples

2. **Code Quality**
   - Add comments explaining concepts
   - Improve error handling
   - Add type safety
   - Refactor for clarity

3. **Learning Materials**
   - Add exercises
   - Create tutorials
   - Add examples
   - Improve explanations

4. **Features** (for advanced contributors)
   - New features with explanations
   - Bug fixes
   - Performance improvements

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/duplixx/NaturalGit.git
   cd NaturalGit
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow code style
   - Add comments
   - Update documentation

4. **Test your changes**
   ```bash
   npm run compile
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git commit -m "Add: Your change description"
   ```

6. **Push and create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style

### TypeScript

- Use TypeScript types
- Add JSDoc comments for functions
- Use meaningful variable names
- Follow existing code style

### Comments

- Explain **why**, not just **what**
- Add comments for complex logic
- Use JSDoc for functions
- Explain concepts for students

### Example

```typescript
/**
 * Processes a user's message and generates a response.
 * 
 * This function:
 * 1. Gathers workspace context
 * 2. Sends prompt to AI
 * 3. Processes AI response
 * 4. Sends result to webview
 * 
 * @param message - The user's input message
 */
public async handleUserMessage(message: string) {
    // Implementation
}
```

## Documentation Style

### Tutorials

- Use clear headings
- Include code examples
- Explain concepts step-by-step
- Add practice exercises

### Code Comments

- Explain concepts
- Use examples
- Link to resources
- Explain "why" not just "how"

## Pull Request Process

1. **Describe your changes**
   - What did you change?
   - Why did you change it?
   - How does it help students?

2. **Link to related issues**
   - If fixing an issue, link it
   - If adding a feature, describe it

3. **Add screenshots** (if UI changes)
   - Before/after screenshots
   - Show new features

4. **Wait for review**
   - Address feedback
   - Make requested changes

## Educational Focus

This is an **educational project**. When contributing:

- ✅ Prioritize clarity over cleverness
- ✅ Add comments explaining concepts
- ✅ Include examples
- ✅ Explain the "why" behind decisions
- ✅ Make code easy to understand

## Questions?

- Open an issue
- Ask in discussions
- Check existing documentation

## Thank You!

Your contributions help students learn VS Code extension development. Thank you for your time and effort!

