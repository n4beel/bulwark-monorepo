# 🛡️ Bulwark Tool - Frontend

A beautiful, modern web interface for the Bulwark Tool scoping engine that analyzes smart contract repositories and generates pre-audit reports.

## 🚀 Features

- **GitHub Authentication** - Secure token-based authentication
- **Repository Selection** - Browse and search your GitHub repositories
- **Real-time Analysis** - Instant repository analysis with progress indicators
- **Comprehensive Reports** - Beautiful, detailed pre-audit reports with:
  - Cost estimates and duration
  - Resource requirements
  - Risk assessments
  - Technical analysis
  - Actionable recommendations

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client for API communication

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🔑 GitHub Authentication

To use the tool, you'll need a GitHub Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select the `repo` scope (for private repos) or `public_repo` (for public repos only)
4. Copy the token and paste it in the authentication form

## 🎯 How to Use

### 1. **Authentication**
- Enter your GitHub Personal Access Token
- Click "Connect GitHub"

### 2. **Repository Selection**
- Browse your repositories
- Use the search to filter repositories
- Click "Analyze" on the repository you want to audit

### 3. **Analysis**
- Watch the real-time progress indicators
- The system will clone, analyze, and generate a report

### 4. **Review Report**
- View comprehensive audit estimates
- Check identified risk areas
- Review recommendations
- Export or share results

## 📊 Report Sections

### **Overview Tab**
- Repository information
- Audit duration estimates
- Cost estimates
- Resource requirements
- Quick statistics

### **Technical Analysis Tab**
- Framework detection
- Complexity assessment
- Code metrics
- Contract files
- Dependencies

### **Risk Areas Tab**
- Security vulnerabilities
- Framework-specific risks
- Dependency risks
- Common attack vectors

### **Recommendations Tab**
- Pre-audit preparation
- Security improvements
- Framework-specific advice
- Best practices

## 🔧 Development

### **Project Structure**
```
src/
├── app/
│   └── page.tsx              # Main application page
├── components/
│   ├── GitHubAuth.tsx        # Authentication component
│   ├── RepositorySelector.tsx # Repository selection
│   └── ReportDisplay.tsx     # Report display
├── services/
│   └── api.ts               # API communication
└── types/
    └── api.ts               # TypeScript interfaces
```

### **Available Scripts**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 API Integration

The frontend communicates with the backend scoping engine via:

- **Health Check**: `POST /scoping/health`
- **Generate Report**: `POST /scoping/generate-report`

## 🎨 Design System

The interface uses a clean, professional design with:
- **Color Scheme**: Blue primary, gray neutrals, semantic colors for alerts
- **Typography**: Clear hierarchy with proper contrast
- **Spacing**: Consistent padding and margins
- **Components**: Reusable, accessible components
- **Responsive**: Mobile-first design

## 🔒 Security

- **No token storage** - Tokens are only stored in memory
- **Secure communication** - HTTPS API calls
- **Input validation** - Client-side validation
- **Error handling** - Graceful error display

## 🚧 Future Enhancements

- **OAuth Flow** - Direct GitHub OAuth integration
- **Report Export** - PDF/CSV export functionality
- **History** - Save and view previous reports
- **Team Collaboration** - Share reports with team members
- **Advanced Filtering** - Filter repositories by language, size, etc.
- **Dark Mode** - Toggle between light and dark themes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the Bulwark Tool platform.
