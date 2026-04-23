# OTLP Log Viewer

A simple Next.js web app for viewing OTLP logs with filtering and histogram visualization.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open the app in your browser:

```text
http://localhost:3000
```

## Build for production

```bash
npm run build
```

To run the production build locally:

```bash
npm run start
```

## Vercel deployment

This project includes a `vercel.json` file and is configured for Vercel's Next.js deployment.

### Deploy using Vercel Dashboard

1. Go to `https://vercel.com`
2. Sign in or create an account
3. Import the repository
4. Select this project and let Vercel detect `Next.js`
5. Deploy

### Deploy using Vercel CLI

1. Install Vercel CLI (if not installed):

```bash
npm install -g vercel
```

2. Run the deployment command from the project directory:

```bash
vercel
```

3. Follow the prompts to link or create a project.

## Notes

- Environment variables can be added in the Vercel dashboard if needed.
- The app uses Next.js 14 and Tailwind CSS.
