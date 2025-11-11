# Resume Parser - AI-Powered Job Application Platform

<div align="center">

![Resume Parser Logo](https://img.shields.io/badge/Resume-Parser-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

**An intelligent resume parsing and job matching platform powered by AI/ML**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

Resume Parser is a comprehensive full-stack platform that revolutionizes the job application process using:
- 🤖 **AI-Powered Resume Analysis** - OpenAI GPT-4 integration for intelligent resume parsing
- 🎯 **Smart Job Matching** - ML algorithms match candidates with relevant opportunities
- 📊 **ATS Optimization** - Score resumes against Applicant Tracking Systems
- 🔍 **Skill Gap Analysis** - Identify missing skills and learning recommendations
- ✅ **Skill Verification** - Interactive MCQ tests to verify candidate skills
- ⛓️ **Blockchain Integration** - Ethereum/Polygon for document verification (optional)

---

## ✨ Features

### 🎨 Frontend (React + TypeScript + Tailwind CSS)
- Modern, responsive UI with premium design
- Real-time resume analysis dashboard
- Interactive resume builder with 20+ templates
- Job search with advanced filters
- Application tracking system
- Skill verification quiz interface

### 🔧 Backend (Node.js + Express + TypeScript)
- RESTful API architecture
- JWT authentication with role-based access
- MongoDB database with Mongoose ODM
- File upload handling (PDF, DOC, DOCX)
- AI-powered resume parsing
- Job scraping from multiple sources
- Rate limiting and security middleware

### 🤖 AI/ML Services
- **Resume Parsing**: Extract skills, experience, education from documents
- **Keyword Extraction**: NLP-based keyword identification
- **Job Matching**: Cosine similarity algorithm for job recommendations
- **ATS Scoring**: Calculate compatibility with job descriptions
- **Sentiment Analysis**: Analyze company reviews
- **Skill Gap Analysis**: Compare resume vs job requirements

### 📦 Additional Features
- Anonymous hiring mode (hide name/photo)
- Company review system
- Learning recommendations
- Email notifications
- Web scraping fallback for job data
- n8n workflow automation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 6+ ([Download](https://www.mongodb.com/try/download/community)) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** ([Download](https://git-scm.com/downloads))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resumeparser.git
   cd resumeparser
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup** (New terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### 🎯 One-Click Start (Windows)

```bash
# Double-click START_ALL.bat
# Or run:
START_ALL.bat
```

---

## 📦 Project Structure

```
resumeparser/
├── backend/                # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/        # Database, blockchain config
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth, validation, errors
│   │   ├── utils/         # Helper functions
│   │   └── server.ts      # Entry point
│   ├── uploads/           # Uploaded files (gitignored)
│   ├── .env              # Environment variables (gitignored)
│   ├── .env.example      # Example configuration
│   └── package.json
│
├── frontend/              # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── utils/        # Helper functions
│   │   ├── App.tsx       # Main app component
│   │   └── index.tsx     # Entry point
│   └── package.json
│
├── docs/                  # Documentation
│   ├── SYNOPSIS_METHODOLOGY.md
│   ├── FLOWCHART.md
│   └── METHODOLOGY_FLOWCHART.md
│
├── .github/               # GitHub configuration
│   ├── workflows/        # CI/CD workflows
│   └── copilot-instructions.md
│
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── LICENSE               # MIT License
└── CONTRIBUTING.md       # Contribution guidelines
```

---

## 🔧 Configuration

### Required Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/resumeparser

# Authentication
JWT_SECRET=your-32-character-secret-key-here

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Optional (Enhanced Features)

```env
# OpenAI (for advanced AI features)
OPENAI_API_KEY=sk-...

# Job APIs
JSEARCH_API_KEY=...
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...

# Cloud Storage (AWS S3 or Cloudinary)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

See [`.env.example`](backend/.env.example) for complete configuration options.

---

## 📚 API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
Body: { email, password, firstName, lastName }

# Login
POST /api/auth/login
Body: { email, password }

# Get current user
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

### Resume Operations

```bash
# Upload resume
POST /api/resumes/upload
Headers: { Authorization: "Bearer <token>" }
Body: FormData with 'resume' file

# Get all resumes
GET /api/resumes
Headers: { Authorization: "Bearer <token>" }

# Analyze resume
POST /api/resumes/:id/analyze
Headers: { Authorization: "Bearer <token>" }
```

### Job Search

```bash
# Search jobs
GET /api/jobs/search?query=software&location=remote

# Get job details
GET /api/jobs/:id

# Apply for job
POST /api/applications
Body: { jobId, resumeId, coverLetter }
```

Full API documentation: [docs/API.md](docs/API.md)

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## 🛠️ Built With

### Frontend
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [React Router](https://reactrouter.com/) - Routing
- [Axios](https://axios-http.com/) - HTTP client

### Backend
- [Node.js](https://nodejs.org/) - Runtime
- [Express](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [MongoDB](https://www.mongodb.com/) - Database
- [Mongoose](https://mongoosejs.com/) - ODM
- [JWT](https://jwt.io/) - Authentication
- [Bcrypt](https://www.npmjs.com/package/bcryptjs) - Password hashing

### AI/ML
- [OpenAI GPT-4](https://openai.com/) - AI analysis
- [Natural](https://www.npmjs.com/package/natural) - NLP
- [PDF-Parse](https://www.npmjs.com/package/pdf-parse) - PDF parsing
- [Mammoth](https://www.npmjs.com/package/mammoth) - Word parsing

### DevOps
- [Docker](https://www.docker.com/) - Containerization
- [GitHub Actions](https://github.com/features/actions) - CI/CD
- [Helmet](https://helmetjs.github.io/) - Security
- [Morgan](https://www.npmjs.com/package/morgan) - Logging

---

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt (12 rounds)
- Rate limiting (100 requests/15min)
- Helmet.js security headers
- CORS configuration
- Input validation and sanitization
- File upload restrictions
- Environment variable protection

---

## 🚀 Deployment

### Backend (Node.js)

**Option 1: Heroku**
```bash
heroku create your-app-name
git push heroku main
```

**Option 2: Railway**
```bash
railway login
railway init
railway up
```

**Option 3: DigitalOcean**
- Use App Platform or Droplets
- Configure environment variables
- Set up MongoDB Atlas

### Frontend (React)

**Option 1: Vercel** (Recommended)
```bash
npm i -g vercel
vercel
```

**Option 2: Netlify**
```bash
npm i -g netlify-cli
netlify deploy
```

**Option 3: GitHub Pages**
```bash
npm run build
npm run deploy
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guides.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

See also the list of [contributors](https://github.com/yourusername/resumeparser/contributors).

---

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- MongoDB team for excellent documentation
- React community for amazing components
- All contributors and testers

---

## 📞 Support

- 📧 Email: support@resumeparser.com
- 💬 Discord: [Join our server](https://discord.gg/resumeparser)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/resumeparser/issues)
- 📖 Docs: [Documentation](https://docs.resumeparser.com)

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Chrome extension for quick applications
- [ ] Interview preparation module
- [ ] Salary negotiation insights
- [ ] AI-powered cover letter generation
- [ ] Video resume support
- [ ] Multi-language support
- [ ] LinkedIn integration
- [ ] Indeed/Glassdoor integration

---

## 📊 Project Status

![GitHub issues](https://img.shields.io/github/issues/yourusername/resumeparser)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/resumeparser)
![GitHub stars](https://img.shields.io/github/stars/yourusername/resumeparser?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/resumeparser?style=social)

---

<div align="center">

**Made with ❤️ by the Resume Parser Team**

⭐ Star us on GitHub — it motivates us a lot!

[Report Bug](https://github.com/yourusername/resumeparser/issues) • [Request Feature](https://github.com/yourusername/resumeparser/issues)

</div>
