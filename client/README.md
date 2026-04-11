# PneuMax - Building Materials E-Commerce

A modern, high-performance e-commerce platform for building materials and construction tools.

## Features

- 🎨 Premium UI with glassmorphism effects and smooth animations
- 🛒 Shopping cart functionality
- 📱 Fully responsive design
- 🔍 Product search and filtering
- 💳 Product catalog with categories
- ⭐ Product reviews and ratings
- 🎯 Auto-sliding product carousel
- 🌐 Multi-language support (Uzbek, Russian, English)

## Tech Stack

- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **State Management:** Zustand

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Netlify

This project is configured for Netlify deployment.

### Option 1: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Option 2: Deploy via Netlify UI

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Build settings are automatically detected from `netlify.toml`
6. Click "Deploy site"

### Build Settings

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18

## Project Structure

```
client/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── context/        # React context providers
│   ├── data/           # Mock data and API functions
│   ├── image/          # Static images
│   └── main.jsx        # Application entry point
├── public/             # Static assets
├── netlify.toml        # Netlify configuration
└── package.json        # Dependencies and scripts
```

## Environment Variables

No environment variables are required for the frontend-only deployment.

## License

Private - All rights reserved
