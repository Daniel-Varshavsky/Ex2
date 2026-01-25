# AI Trends Aggregator

A modern web application that aggregates and displays trending AI/ML repositories from GitHub and popular models from Hugging Face. Built with Next.js and featuring AI-powered content summarization.

## 🚀 Live Demo

- **Production (Auto-deploy)**: https://ex2-mauve-zeta.vercel.app/
- **Manual Deploy**: https://ex2-1oms.vercel.app/

## 📸 Screenshots

### Main Application

![AI Trends Main Page](./public/main-page.jpg)
_The main page showing aggregated AI/ML trends from GitHub and Hugging Face with summarization features_

### Settings & Configuration

![Settings Page](./public/settings-page.jpg)
_Settings page for configuring AI providers and deployment options_

## ✨ Features

- **Dual Source Aggregation**: Fetches trending repositories from both GitHub and Hugging Face
- **AI-Powered Summaries**: Automatically generates concise summaries of project READMEs using multiple AI providers
- **Smart Content Processing**: Handles large README files with intelligent truncation
- **Multiple AI Providers**: Support for Groq, OpenAI, and Anthropic APIs
- **Real-time Data**: Caches data for performance while ensuring fresh content
- **Responsive Design**: Clean, modern UI that works on all devices
- **One-Click Deployment**: Built-in Vercel deployment trigger

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19
- **Styling**: CSS Modules with modern design system
- **API Integration**: GitHub API, Hugging Face API
- **AI Services**: Groq, OpenAI, Anthropic
- **Deployment**: Vercel
- **Caching**: In-memory caching with TTL

## 📋 Prerequisites

- Node.js 20.9.0 or higher
- npm, yarn, pnpm, or bun
- API keys for at least one AI provider:
  - [Groq API Key](https://console.groq.com/) (Recommended - Free tier available)
  - [OpenAI API Key](https://platform.openai.com/api-keys)
  - [Anthropic API Key](https://console.anthropic.com/)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ai-trends-aggregator
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Set up environment variables (Optional)

For the deploy button feature, create a `.env.local` file:

```bash
VERCEL_DEPLOY_HOOK=your_vercel_deploy_hook_url
```

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 5. Configure AI Provider

1. Click the settings gear icon (⚙️) in the top-right corner
2. Enter your API key for your preferred AI provider
3. Select the AI provider (Groq, OpenAI, or Anthropic)
4. Save your settings

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── anthropic/      # Anthropic summarization API
│   │   ├── feed/           # Main aggregation endpoint
│   │   ├── github/         # GitHub data fetching
│   │   ├── groq/           # Groq summarization API
│   │   ├── huggingface/    # Hugging Face data fetching
│   │   ├── openAI/         # OpenAI summarization API
│   │   └── vercel/         # Deployment trigger API
│   ├── lib/
│   │   └── summarizeCooldown.js  # Rate limiting for AI requests
│   ├── settings/           # Settings page
│   ├── globals.css         # Global styles
│   ├── layout.js           # Root layout
│   └── page.jsx            # Home page
├── components/
│   ├── NewsCard.jsx        # Individual item card component
│   └── NewsCard.module.css # Card-specific styles
└── public/                 # Static assets
```

## 🔧 API Endpoints

### Public Endpoints

- `GET /api/feed` - Aggregated data from both GitHub and Hugging Face
- `GET /api/github` - GitHub repositories data
- `GET /api/huggingface` - Hugging Face models data

### Protected Endpoints (Require API Key)

- `POST /api/groq` - Groq AI summarization
- `POST /api/openai` - OpenAI summarization
- `POST /api/anthropic` - Anthropic summarization

### Utility Endpoints

- `POST /api/vercel` - Trigger Vercel deployment
- `POST /api/github` - Fetch GitHub README content
- `POST /api/huggingface` - Fetch Hugging Face README content

## ⚙️ Configuration

### AI Provider Settings

The application supports three AI providers for content summarization:

1. **Groq** (Recommended)
   - Fast and cost-effective
   - Uses Llama-3.1-8b-instant model
   - Generous free tier

2. **OpenAI**
   - Uses GPT-4o-mini model
   - High-quality summaries
   - Requires paid API key

3. **Anthropic**
   - Uses Claude-3-5-haiku model
   - Excellent for technical content
   - Requires paid API key

### Caching Strategy

- **Data Caching**: 5-minute TTL for API responses
- **AI Summaries**: Cached to prevent redundant API calls
- **Rate Limiting**: 2-second cooldown between summarization requests

## 🚀 Deployment

### Automatic Deployment (Recommended)

The app automatically deploys to https://ex2-mauve-zeta.vercel.app/ when you push commits to your main branch.

### Manual Deployment

Use the built-in deployment button:

1. Go to Settings page
2. Click "Deploy to Vercel"
3. Monitor deployment at https://ex2-1oms.vercel.app/

### Environment Variables for Production

If you want to use the manual deploy feature, set this in your Vercel dashboard:

```bash
VERCEL_DEPLOY_HOOK=your_vercel_deploy_hook_url
```

## 🎯 Usage

### Main Interface

As shown in the main page screenshot above:

1. **Browse Trends**: The home page displays trending AI/ML projects from both GitHub and Hugging Face
   - GitHub repositories are marked with a "GitHub" badge
   - Hugging Face models are marked with a "Hugging Face" badge
   - Each item shows stars/likes count, programming language, and owner information

2. **Get Summaries**: Click "Summarize" on any item to get an AI-generated summary
   - The app intelligently fetches README files and processes them
   - Large files are automatically truncated for optimal AI processing
   - Summaries are cached to avoid repeated API calls

3. **Filter Content**: Items are automatically sorted by popularity (stars/likes)
4. **Access Projects**: Click "Open" to visit the original repository or model page

### Configuration

As shown in the settings page screenshot:

1. **AI Provider Setup**: Choose from Groq, OpenAI, or Anthropic
2. **API Key Management**: Securely store your API keys locally
3. **One-Click Deployment**: Deploy your changes directly from the settings page

## 🔍 How It Works

1. **Data Aggregation**: The `/api/feed` endpoint fetches trending repositories and models from both platforms
2. **Content Processing**: When you click "Summarize", the app:
   - Attempts to fetch the project's README file
   - Handles large files with intelligent truncation
   - Falls back to AI knowledge if README is unavailable
   - Generates a concise 3-line summary using your chosen AI provider

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

1. **"Please enter an API key in Settings"**
   - Go to Settings and configure your AI provider API key

2. **Summarization fails**
   - Check your API key is correct
   - Verify you have sufficient API credits
   - Some content may be restricted or too short to summarize

3. **No items loading**
   - Check your internet connection
   - GitHub/Hugging Face APIs may be temporarily unavailable

4. **Deploy button not working**
   - Ensure `VERCEL_DEPLOY_HOOK` environment variable is set in Vercel

## 📊 Performance

- **Caching**: 5-minute cache reduces API calls and improves response times
- **Concurrent Fetching**: Parallel requests to GitHub and Hugging Face
- **Smart Truncation**: Large README files are intelligently truncated to stay within AI model limits
- **Error Handling**: Graceful fallbacks ensure the app continues working even if some services are unavailable

---

Built with ❤️ using Next.js and powered by AI
