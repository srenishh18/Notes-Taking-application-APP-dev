# Little Notes

A notes app built with React, Express, Mongoose, and MongoDB. Notes can be created, searched, edited, colored, pinned, and deleted. Notes are stored in the `little-notes` database.

## Local MongoDB setup

Install MongoDB Community Server and make sure its local service is running. The app connects to `mongodb://127.0.0.1:27017/little-notes` by default. On startup, it adds five example notes if the database has no notes yet; it leaves existing notes unchanged.

To use a different MongoDB instance, copy `.env.example` to `.env` and set `MONGODB_URI` to its connection string. The `.env` file is ignored by Git.

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`). Vite proxies `/api` requests to the Express server on port 4000. The API health check is available at `http://localhost:4000/api/health`.

## API

- `GET /api/notes` lists notes; `?pinned=true` returns pinned notes.
- `POST /api/notes` creates a note with `title`, `content`, `color`, and `pinned` fields.
- `PUT /api/notes/:id` updates supplied note fields.
- `DELETE /api/notes/:id` deletes a note.

## Verify and production build

```powershell
npm test
npm run build
```

For a single-server production deployment, build the frontend and run the API with `NODE_ENV=production`; Express serves the generated `dist` directory. Set `MONGODB_URI` and `PORT` in the hosting provider's environment settings.