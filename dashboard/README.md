# Discord Member Dashboard

A modern React dashboard application for monitoring and managing Discord server members with Google Sheets integration and report export functionality.

## 🚀 Live Demo

**[View Live Dashboard](https://NecroLux.github.io/ship-manager/dashboard/dist/)**

## Features

- **Dark/Light Mode**: Toggle between dark and light themes with persistent state
- **Simple & Clean UI**: Minimalist interface focused on usability
- **Google Sheets Integration**: Read and update multiple Google Sheets using a service account
- **Manual Member Import**: Import Discord members manually or via CSV
- **Report Export**: Export member data as PDF, Excel (.xlsx), or Word (.docx) documents
- **Responsive Design**: Works on desktop and tablet devices

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Project with Sheets API enabled
- Google Service Account credentials (JSON file)

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/NecroLux/ship-manager.git
cd ship-manager/dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### Building for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
src/
├── App.tsx           # Main dashboard component
├── theme.ts          # Material UI theme configuration
├── components/       # Reusable React components (to be added)
├── services/         # API and Google Sheets services (to be added)
└── main.tsx          # Entry point
```

## Configuration

### Google Sheets Setup

1. Create a Google Cloud Project
2. Enable the Google Sheets API
3. Create a Service Account and download the JSON key
4. Add the service account email to your Google Sheets

Place your credentials in the project (keep secure and never commit to git):
- Create a `.env.local` file with your service account credentials

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Build and preview production version
- `npm run lint` - Run ESLint checks
- `npm run deploy` - Deploy to GitHub (builds, commits, and pushes)

## Deployment

### Automatic Deployment to GitHub Pages

To deploy your changes to GitHub Pages:

```bash
# Make your changes
npm run build  # Always build before deploying
npm run deploy # Commits and pushes to GitHub
```

The app will be live at: **https://NecroLux.github.io/ship-manager/dashboard/dist/**

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### GitHub Pages Configuration

The repository is already configured for GitHub Pages:
- **Source**: `/dashboard/dist` folder on the `main` branch
- **Updates**: Automatic when changes are pushed to `main`


## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library and theming
- **TypeScript** - Type safety
- **Google APIs** - Google Sheets integration
- **jsPDF** - PDF export
- **XLSX** - Excel export
- **docx** - Word document export

## Future Enhancements

- Discord API/Bot integration for automatic member import
- Real-time data synchronization with Google Sheets
- Advanced filtering and search
- Member activity tracking
- Custom report templates
- Role and permission management

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
