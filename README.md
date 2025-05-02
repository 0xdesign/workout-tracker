# Workout Tracker

A Next.js application for tracking workouts with AI-powered suggestions.

## Features

- Weekly calendar view for workout planning
- Daily exercise tracking
- AI-powered suggestions for workout progression
- Performance history and tracking
- Dark mode user interface
- Mobile-first design
- Progressive Web App (PWA) capabilities

## Technology Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- IndexedDB for local storage
- OpenAI API for workout suggestions
- Next-PWA for Progressive Web App functionality

## Configuration

### API Keys

The application uses OpenAI's API for generating workout suggestions and coach responses. To configure the API:

1. Create a `.env` file in the root directory
2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

The application uses a server-side API route to securely make OpenAI API calls, keeping your API key protected.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Deployment

The application is deployed on Vercel. When deploying, make sure to set the `OPENAI_API_KEY` environment variable in your deployment platform.

## Security Notes

- The application uses a server-side API route to securely proxy requests to OpenAI
- This approach keeps your API key secure and prevents exposure to client-side code
- Never use `NEXT_PUBLIC_OPENAI_API_KEY` in production as this would expose your key to users