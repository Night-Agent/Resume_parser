# Contributing to Resume Parser

First off, thank you for considering contributing to Resume Parser! It's people like you that make this project such a great tool.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and considerate.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments, personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+ or MongoDB Atlas account
- Git
- Code editor (VS Code recommended)

### Setting Up Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/resumeparser.git
   cd resumeparser
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/resumeparser.git
   ```

4. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

5. **Configure environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your test configuration
   ```

6. **Start development servers**
   ```bash
   # Backend (terminal 1)
   cd backend
   npm run dev
   
   # Frontend (terminal 2)
   cd frontend
   npm start
   ```

---

## 🤔 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node.js version: [e.g., 18.17.0]
- MongoDB version: [e.g., 6.0.5]

**Additional context**
Any other context about the problem.
```

### Suggesting Features

Feature suggestions are tracked as GitHub issues. Create an issue with:

**Feature Request Template:**
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Any other context, screenshots, or mockups.
```

### Code Contributions

1. **Find an issue** to work on or create one
2. **Comment** on the issue to let others know you're working on it
3. **Follow the development workflow** (see below)
4. **Submit a pull request**

---

## 🔄 Development Workflow

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Manual testing
# Test the feature in browser
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Go to GitHub and create a pull request
- Fill in the PR template
- Link related issues
- Wait for review

---

## 💻 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for type safety
- Use `const` and `let`, never `var`
- Use arrow functions for callbacks
- Use async/await instead of promises chains
- Add JSDoc comments for public APIs

**Example:**
```typescript
/**
 * Analyzes a resume and extracts key information
 * @param resumeBuffer - Buffer containing resume file
 * @param fileType - Type of file (pdf, doc, docx)
 * @returns Parsed resume data
 */
export async function parseResume(
  resumeBuffer: Buffer,
  fileType: string
): Promise<ParsedResume> {
  // Implementation
}
```

### React/Frontend

- Use functional components with hooks
- Use TypeScript interfaces for props
- Keep components small and focused
- Use Tailwind CSS for styling
- Follow component naming: `PascalCase.tsx`

**Example:**
```typescript
interface ResumeCardProps {
  resume: Resume;
  onDelete: (id: string) => void;
}

export const ResumeCard: React.FC<ResumeCardProps> = ({ 
  resume, 
  onDelete 
}) => {
  return (
    <div className="card-glass-hover">
      {/* Component content */}
    </div>
  );
};
```

### Backend/API

- Use RESTful conventions
- Return consistent JSON responses
- Use proper HTTP status codes
- Add input validation
- Handle errors gracefully

**Example:**
```typescript
router.post('/resumes/upload', 
  authenticate,
  upload.single('resume'),
  asyncHandler(async (req, res) => {
    // Validate input
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }
    
    // Process request
    const result = await processResume(req.file);
    
    // Return response
    res.status(201).json({
      success: true,
      data: result
    });
  })
);
```

### File Organization

```
src/
├── components/          # Reusable components
│   ├── common/         # Generic components
│   ├── resume/         # Resume-specific
│   └── job/            # Job-specific
├── pages/              # Page components
├── utils/              # Helper functions
├── hooks/              # Custom hooks
├── types/              # TypeScript types
└── services/           # API services
```

---

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
# Good commits
git commit -m "feat(resume): add PDF parsing support"
git commit -m "fix(auth): resolve JWT expiration issue"
git commit -m "docs: update API documentation"
git commit -m "refactor(jobs): simplify search algorithm"

# Bad commits (avoid these)
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "WIP"
```

### Commit Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor" not "moves cursor")
- Keep subject line under 50 characters
- Capitalize subject line
- Don't end subject line with period
- Separate subject from body with blank line
- Wrap body at 72 characters
- Reference issues in footer

---

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow guidelines
- [ ] No merge conflicts with main branch

### PR Title Format

Follow same format as commits:
```
feat(resume): add skill extraction feature
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## How Has This Been Tested?
Description of testing done

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. **Automated checks** run (linting, tests, build)
2. **Code review** by maintainers
3. **Changes requested** (if needed)
4. **Approval** from at least one maintainer
5. **Merge** by maintainers

### After Your PR is Merged

- Delete your branch (GitHub will prompt you)
- Update your local repository:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

---

## 🧪 Testing Guidelines

### Backend Tests

```typescript
describe('Resume Parser', () => {
  it('should extract skills from PDF', async () => {
    const buffer = await readTestFile('resume.pdf');
    const result = await parseResume(buffer, 'pdf');
    
    expect(result.skills).toContain('JavaScript');
    expect(result.skills).toContain('React');
  });
});
```

### Frontend Tests

```typescript
describe('ResumeCard', () => {
  it('renders resume information', () => {
    render(<ResumeCard resume={mockResume} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

---

## 🎨 Code Style

### Formatting

We use Prettier for code formatting:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Linting

We use ESLint for code quality:

```bash
# Lint all files
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

---

## 📚 Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Best Practices](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/)

---

## 💬 Questions?

- Open an issue with the `question` label
- Join our Discord server
- Email: dev@resumeparser.com

---

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! ⭐

---

**Happy Coding! 🚀**
