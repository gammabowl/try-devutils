# TryDevUtils

A handy collection of developer utilities built with React, TypeScript and assisted by 🤖. 

## 🚀 Quick Start

### Prerequisites

- Node.js (v22)
- npm

### Installation & Development

```sh
# Development
npm run dev              # Start development server
npm run preview          # Preview production build locally

# Building
npm run build            # Production build
npm run build:dev        # Development build

# Tests
npm run test             # Run Playwright browser tests (console errors on util pages)

# CI build + tests
npm run build:ci          # Build + Playwright tests (used by GitHub Actions)

# Code Quality
npm run lint             # Run ESLint
npm run check            # Type check and build validation
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


## 🚀 Deployment & Hosting

This app is deployed and hosted on **Vercel** via Git integration.

**CI Build + Tests**
- GitHub Actions runs a build + Playwright tests on every push and pull request.
- The workflow must pass before merging to `main`.

**Deployments**
- Vercel creates **Preview Deployments** for non-main branches and pull requests.
- Vercel creates **Production Deployments** from `main`.


## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by various developer utils collections
- Thanks to the open source community

---

Happy coding/vibe-coding! 🎉
