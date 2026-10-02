# Dundoo React Frontend

This is a standalone React/Vite frontend recreated from the supplied Dundoo reference screenshot.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Backend

This frontend is intentionally separate from the existing Flask backend.
Later, replace the local demo data in `src/App.jsx` with API calls to your Flask endpoints.


## Dundoo Main integration

The original Flask frontend has been preserved in `../frontend_legacy/`. The Flask backend remains in `../backend/`. Connect the React components to the backend API endpoints as needed.
