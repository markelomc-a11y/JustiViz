# JustiViz

JustiViz is a legal-technology narrative dashboard for exploring explainable AI reasoning over contractual risk. It combines a scrollytelling contract review interface, a graph explorer, a reliance lab for error detection, and an interactive custom contract analyzer built for legal and compliance review workflows.

## Highlights

- Narrative review flow across five legal reasoning stages
- Graph-based view of decisions, rejected alternatives, and state transitions
- Reliance analysis to simulate trust and failure modes in AI-assisted legal review
- Custom contract text analysis with AI live mode and built-in offline fallback
- Portuguese and English case studies covering CUAD and EU regulatory contexts

## Run locally

Prerequisites:
- Node.js 18+
- npm

1. Install dependencies:
   npm install
2. Set up environment variables if you want live Gemini analysis:
   - create a .env file in the project root
   - add: GEMINI_API_KEY=your_key_here
3. Start the app:
   npm run dev
4. Open the local URL shown by Vite, typically http://localhost:5173

## Production build

npm run build
npm start

## Project scripts

- npm run dev — runs the Vite frontend and Express server in development mode
- npm run build — builds the frontend and bundles the server for production
- npm run start — serves the built application
- npm run lint — runs TypeScript checking

## Notes

- If GEMINI_API_KEY is not configured, the app automatically falls back to a local reasoning simulator so the experience still works without external API access.
- The project is intentionally designed for demo and educational legal-tech exploration, not legal advice automation.


github repo token: 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