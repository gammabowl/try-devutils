# TryDevUtils

A handy collection of developer utilities built with React, TypeScript and assisted by 🤖.
Available as a **web app** and a **native desktop app** (macOS, Windows, Linux) powered by [Tauri](https://v2.tauri.app).

## 🚀 Quick Start

### Prerequisites

- Node.js (v22)
- npm
- [Rust](https://rustup.rs/) (only for desktop development)

### Installation & Development

```sh
# Development
npm run dev              # Start web development server (port 8080)
npm run preview          # Preview production build locally

# Building
npm run build            # Production web build
npm run build:dev        # Development build

# Tests
npm run test             # Run Playwright browser tests (console errors on util pages)

# CI build + tests
npm run build:ci          # Build + Playwright tests (used by GitHub Actions)

# Code Quality
npm run lint             # Run ESLint
npm run check            # Type check and build validation
```

The web app will be available at `http://localhost:8080`.

## 🖥️ Desktop App (Tauri)

### Prerequisites

1. **Rust** – install via [rustup](https://rustup.rs/):
   ```sh
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **macOS**: Xcode Command Line Tools (`xcode-select --install`)
3. **Windows**: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) + WebView2
4. **Linux**: `build-essential`, `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Desktop Development

```sh
npm run tauri:dev        # Launch desktop app with hot-reload
npm run tauri:build      # Build production desktop installer
npx tauri info           # Show environment diagnostics
npx tauri icon ./public/logo.png  # Regenerate app icons
```

> **Note:** The first `tauri:dev` run takes 2–5 minutes while Cargo downloads and compiles Rust dependencies. Subsequent runs are fast (~5s).

### Desktop Build Output

`npm run tauri:build` produces platform-specific installers in `src-tauri/target/release/bundle/`:

| Platform | Formats |
|----------|---------|
| macOS    | `.dmg`, `.app` |
| Windows  | `.msi`, `.exe` (NSIS) |
| Linux    | `.deb`, `.AppImage` |

### Architecture

The desktop app reuses 100% of the web app's business logic and utility components. Platform detection (`isTauri()`) switches between:

- **Web** → `BrowserRouter` + header/footer layout
- **Desktop** → `HashRouter` + native sidebar layout with draggable titlebar


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
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   ├── Layout.tsx      # Web layout (header + footer)
│   └── DesktopLayout.tsx # Desktop layout (sidebar + titlebar)
├── hooks/
│   ├── use-tauri.ts    # Tauri native API hooks (clipboard, dialogs, filesystem)
│   └── ...
├── lib/
│   ├── platform.ts     # Platform detection (isTauri, getPlatform, getModifierKey)
│   └── ...
├── pages/              # Page components (shared between web & desktop)
└── utils/              # Helper functions
src-tauri/
├── Cargo.toml          # Rust dependencies
├── tauri.conf.json     # Tauri window & bundle configuration
├── capabilities/       # Security permissions for Tauri plugins
├── icons/              # Auto-generated app icons (all platforms)
└── src/
    ├── main.rs         # Desktop entry point
    └── lib.rs          # Tauri plugins, commands, and window setup
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
