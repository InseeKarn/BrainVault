# 🧠 BrainVault

**Physics Problem Solving Platform with Interactive Formula Workspace, XP System, and Detailed Feedback**

BrainVault is a comprehensive physics learning platform that combines interactive problem-solving with gamification elements. Students can solve physics problems step-by-step using an intuitive formula workspace, earn XP and badges, and get detailed feedback on their solutions.

## ✨ Features

### 🎯 Core Functionality
- **Interactive Formula Workspace**: Type formulas step-by-step with autocomplete and drag-and-drop
- **Variable Assignment**: User-friendly input system for physics variables
- **Detailed Feedback**: Comprehensive error analysis highlighting specific mistakes
- **Multiple Solution Paths**: Support for different valid approaches to problems

### 🎮 Gamification System
- **XP & Leveling**: Progressive leveling system (Level 1 = 100 XP, Level 2 = 200 XP, etc.)
- **10-Level Badge System**: 
  - **Solver**: Novice → Apprentice → Learner → Adept → Skilled → Proficient → Expert → Master → Grandmaster → Legend
  - **Speedster**: Swiftling → Quickster → Rapid → Brisk → Hasty → Agile → Nimble → Flash → Lightning → Warp
  - **Mastermind**: Initiate → Junior → Intermediate → Senior → Advanced → Specialist → Expert → Elite → Master → Genius
  - **Explorer**: Rookie → Explorer → Voyager → Pathfinder → Scout → Adventurer → Trailblazer → Navigator → Pioneer → Omniscient
  - **Collector, Strategist, Innovator, Perfectionist, Contributor, Champion** (all 10 levels each)
- **XP Rewards**: Easy (10 XP), Medium (25 XP), Hard (50 XP), Expert (100 XP)
- **Speed Bonuses**: Extra XP for solving problems under time limits

### 💡 Hint System
- **Hint Tokens**: Monthly free allocation with optional purchases
- **Progressive Hints**: Multiple hint levels for each problem
- **Smart Hints**: Context-aware suggestions based on current progress

### 📚 Problem Library
- **OER Integration**: Problems from MIT OCW, OpenStax, LibreTexts, Khan Academy
- **12 Physics Branches**: Mechanics, Thermodynamics, Electromagnetism, Optics, Modern Physics, Acoustics, Astrophysics, Condensed Matter, Plasma, Biophysics, Geophysics, Computational Physics
- **4 Difficulty Levels**: Easy, Medium, Hard, Expert
- **Detailed Metadata**: Source attribution, XP rewards, hints, multiple solution paths

### 🏆 Social Features
- **Leaderboards**: Global and branch-specific rankings
- **User Profiles**: Comprehensive stats, badge collection, problem history
- **Achievement Tracking**: Progress visualization and milestone celebrations

## 🚀 Project Structure

```
BrainVault/
├── frontend/                    # Client-side application
│   ├── index.html              # Dashboard/Landing page
│   ├── login.html              # Authentication
│   ├── register.html           # User registration
│   ├── problem_selection.html  # Problem filtering & selection
│   ├── problem_workspace.html  # Interactive solving workspace
│   ├── leaderboard.html        # Rankings & competitions
│   ├── profile.html            # User profile & stats
│   ├── hint_store.html         # Hint token management
│   ├── css/
│   │   └── styles.css          # Comprehensive styling
│   ├── js/
│   │   ├── auth.js             # Authentication logic
│   │   ├── dashboard.js        # Dashboard functionality
│   │   ├── workspace.js        # Formula editor & workspace
│   │   ├── submission.js       # Solution submission & feedback
│   │   ├── leaderboard.js      # Leaderboard display
│   │   └── hint_store.js       # Hint management
│   └── assets/                 # Images, icons, uploads
│
├── backend/                    # Server-side API
│   ├── server.js              # Main Express server
│   ├── auth.js                # Authentication routes
│   ├── user.js                # User management & profiles
│   ├── problem.js             # Problem serving & validation
│   ├── feedback.js            # Solution analysis & feedback
│   ├── leaderboard.js         # Ranking calculations
│   ├── hint.js                # Hint system management
│   └── utils/
│       └── validation.js      # Formula parsing & validation
│
├── database/
│   ├── problems.json          # OER problem database
│   └── schema.sql             # PostgreSQL database schema
│
├── package.json               # Dependencies & scripts
└── README.md                  # This file
```

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript**: Modern web standards
- **Responsive Design**: Mobile-first approach
- **Font**: Inter font family for modern typography
- **Icons**: Emoji-based icons for universal compatibility

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **PostgreSQL**: Primary database
- **Redis**: Caching & sessions

### Additional Tools
- **Multer**: File upload handling
- **Helmet**: Security middleware
- **Express Rate Limit**: API protection
- **Math Expression Evaluator**: Formula parsing
- **Stripe**: Payment processing (for hint purchases)

## 🔧 Installation & Setup

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 12 (optional, for production)
- Redis (optional, for caching)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/brainvault.git
cd brainvault
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup (Optional)
```bash
# Create database
createdb brainvault

# Install schema
npm run install-db

# Seed problems (optional)
npm run seed-problems
```

### 4. Environment Variables
Create `.env` file:
```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
DATABASE_URL=postgresql://username:password@localhost:5432/brainvault
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Access Application
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/

## 🎯 Usage

### For Students
1. **Sign Up**: Create account with email or social login
2. **Choose Problems**: Filter by difficulty, branch, and subtopic
3. **Solve Interactively**: Use the formula workspace to build solutions step-by-step
4. **Get Feedback**: Receive detailed analysis of mistakes and corrections
5. **Earn Rewards**: Gain XP, level up, and unlock badges
6. **Track Progress**: Monitor stats, achievements, and learning journey

### For Educators
1. **Problem Library**: Access curated OER problems from multiple sources
2. **Student Analytics**: Track class progress and identify learning gaps
3. **Custom Assignments**: Create problem sets for specific topics
4. **Feedback Analysis**: Review common mistakes and misconceptions

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh

### User Management
- `GET /api/user/me` - Get user profile
- `PUT /api/user/me` - Update profile
- `GET /api/user/badges` - Get user badges
- `GET /api/user/history` - Get problem history

### Problems
- `GET /api/problems` - List problems (with filters)
- `GET /api/problems/:id` - Get specific problem
- `POST /api/problems/:id/submit` - Submit solution
- `GET /api/problems/:id/hints` - Get problem hints

### Leaderboard
- `GET /api/leaderboard` - Get rankings
- `GET /api/leaderboard/:branch` - Branch-specific rankings

### Hints
- `GET /api/hints/tokens` - Get user's hint tokens
- `POST /api/hints/purchase` - Purchase hint tokens
- `POST /api/hints/:problemId/use` - Use hint token

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testNamePattern="Auth"
```

## 🔍 Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking (if using TypeScript)
npm run type-check
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure responsive design compatibility

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MIT OCW**: Open courseware physics problems
- **OpenStax**: Free textbook problems and solutions
- **LibreTexts**: Collaborative educational content
- **Khan Academy**: Interactive learning exercises
- **Physics Education Community**: Inspiration and feedback

## 📞 Support

- **Documentation**: [https://docs.brainvault.edu](https://docs.brainvault.edu)
- **Issues**: [GitHub Issues](https://github.com/yourusername/brainvault/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/brainvault/discussions)
- **Email**: support@brainvault.edu

## 🔮 Roadmap

### Short Term (v1.1)
- [ ] Mobile app development
- [ ] Advanced formula editor with LaTeX support
- [ ] Collaborative problem solving
- [ ] Instructor dashboard

### Medium Term (v1.2)
- [ ] AI-powered hint generation
- [ ] Virtual physics labs
- [ ] Peer review system
- [ ] Advanced analytics dashboard

### Long Term (v2.0)
- [ ] Multi-language support
- [ ] VR/AR physics simulations
- [ ] Machine learning personalization
- [ ] Integration with LMS platforms

---

**Built with ❤️ for physics enthusiasts and educators worldwide**

🧠 **BrainVault** - *Unlocking the vault of physics knowledge, one problem at a time.*
