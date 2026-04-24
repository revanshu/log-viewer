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

https://log-viewer-self.vercel.app/

## Notes

- This app is done using Cursor free trial.
- The app uses Next.js 14, typescript, react and Tailwind CSS.
- react-virtual for better scrolling experience
- recharts for histogram
- Zustand state object
- oltp data transformation
- Fetch call in the parent component, with caching for few second, this way data does not change on every reload rather we fetch the logs in some interval

## Future improvements

- Creating separate directory for components. or using a light weight component library
- Testing - unit and e2e
- Handling large number of data and calculation using pagination, webworker and server streaming events
- react-query, if there are many pages relying on same data, and there are other features like caching, handles the loading and error state etc
