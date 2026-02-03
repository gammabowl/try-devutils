# TryDevUtils

A comprehensive collection of developer utilities built with React, TypeScript and assisted by 🤖. This app provides offline-first tools for developers to handle common tasks like encoding/decoding, formatting, validation, and more.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation & Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd try-devutils

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080` (or next available port).

## 🛠️ Development Setup

### IDE Configuration

For the best development experience, we recommend using **Visual Studio Code** with the following extensions:

#### Essential Extensions
- **TypeScript and JavaScript Language Features** (built-in)
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - CSS class autocomplete
- **Auto Rename Tag** - HTML/JSX tag synchronization


### Project Structure

```
src/
├── components/
│   ├── utils/          # Individual utility components
│   └── ui/             # Reusable UI components (shadcn/ui)
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── pages/              # Page components
└── utils/              # Helper functions
```

### Available Scripts

```sh
# Development
npm run dev              # Start development server
npm run preview          # Preview production build locally

# Building
npm run build            # Production build
npm run build:dev        # Development build

# Code Quality
npm run lint             # Run ESLint
npm run check            # Type check and build validation
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

#### 🐛 Bug Reports
Found a bug? Help us fix it by using our [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md):

#### 💡 Feature Requests
Have an idea for a new developer tool? Use our [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md):


## 🚀 Deployment & Hosting

This app is deployed and hosted on **Vercel** with automatic deployments from the main branch.
Push to `main` branch triggers deployment


## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by various developer utils collections
- Thanks to the open source community

---

Happy coding/vibe-coding! 🎉
