<h1 align="center">Document Intelligence Platform</h1>

<p align="center">A self-hosted document question-answering platform built with retrieval-augmented generation.</p>

## About the project

Document Intelligence Platform turns a collection of PDF, DOCX, and TXT files into a searchable knowledge base. Administrators upload and manage documents. Verified users can then ask questions in a chat interface and receive answers based only on the uploaded content.

The application extracts text from each document, splits it into smaller sections, creates vector embeddings, and stores them in PostgreSQL with pgvector. When a user asks a question, the backend finds the most relevant sections and gives that context to Gemini. Answers are streamed to the browser as they are generated, and chat history is saved for later.

## Features

- Upload and process PDF, DOCX, and TXT documents up to 20 MB
- Search document content using vector similarity
- Stream answers to the chat interface with Server-Sent Events
- Keep conversations and messages between sessions
- Register accounts with email verification
- Manage users, including blocking and unblocking access
- Separate admin and user interfaces
- Change account passwords from the application

## Technology

| Part | Tools |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL, Sequelize, pgvector |
| Document processing | pdf-parse, Mammoth |
| AI | Google Gemini embeddings and text generation |
| Authentication | JWT, bcrypt |
| Email | Nodemailer with SMTP |

## How it works

1. An administrator uploads a supported document.
2. The backend extracts its text and splits it into overlapping chunks.
3. Each chunk is converted into an embedding and stored in PostgreSQL.
4. A user asks a question in the chat.
5. The question is embedded and compared with the stored chunks.
6. The five closest chunks are sent to Gemini as context.
7. The answer is streamed to the user and saved with the conversation.

Gemini is instructed to answer from the retrieved context. If the uploaded documents do not contain the answer, the assistant should say that it does not know.

## Project structure

```text
.
├── backend/     Express API, authentication, document processing, and RAG logic
├── frontend/    React application
└── docs/        Architecture, API, frontend, and contributor documentation
```

The backend follows a route, controller, service, repository, and model structure. The frontend keeps API access in `frontend/src/lib/api.ts` and application state in React hooks.

## Setting up the project

### Prerequisites

Install the following before starting:

- Node.js and npm
- PostgreSQL
- The pgvector PostgreSQL extension
- A Google Gemini API key
- SMTP credentials if you want verification emails to be delivered

### 1. Clone the repository

```bash
git clone <repository-url>
cd Document-Intelligence-Platform-RAG-
```

### 2. Install dependencies

The frontend and backend have separate package files.

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Create the database

Create a PostgreSQL database and enable pgvector in it. Replace the database name if you plan to use a different value in your environment file.

```sql
CREATE DATABASE document_intelligence;
```

Connect to the new database, then run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The backend creates its tables when it starts. This project does not use database migrations.

### 4. Configure the backend

Create `backend/.env` and add the following values:

```env
DB_NAME=document_intelligence
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=replace_with_a_long_random_secret
PORT=8000

GEMINI_API_KEY=your_gemini_api_key

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_SECURE=false

APP_URL=http://localhost:8000
VERIFICATION_SUCCESS_URL=http://localhost:8000/api/auth/verification-success
```

`DB_PORT` should normally be `5432`. The current database connection uses PostgreSQL's default port.

SMTP is optional for local development. If the SMTP values are missing, the backend prints the verification link in its terminal instead of sending an email. Do not use that fallback in production.

### 5. Configure the frontend

The frontend uses `http://localhost:8000` by default. If the backend is running somewhere else, create or update `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 6. Start the application

Open two terminals from the project root.

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser. The API runs at `http://localhost:8000` by default.

## Creating an admin account

The registration screen creates normal user accounts. To create the first administrator in a local environment, send a registration request directly to the API:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"change-this-password","role":"admin"}'
```

Open the verification link sent by email or printed in the backend terminal. After verification, sign in through the frontend. Administrators can upload and delete documents, view user accounts, and control user access.

## Available commands

Run backend commands from `backend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with automatic restarts |
| `npm run build` | Compile the TypeScript backend |
| `npm start` | Run the compiled backend |

Run frontend commands from `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run typecheck` | Check TypeScript types without building |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |

There are currently no automated tests or linting commands. The available frontend checks are:

```bash
cd frontend
npm run typecheck
npm run build
```

## User roles

| Role | Access |
| --- | --- |
| User | View available documents, ask questions, manage conversations, and update their password |
| Admin | All user features, plus document upload and deletion, user management, and dashboard access |

All accounts must be verified before protected parts of the application can be used. Blocking an account takes effect on its next request.

## Documentation

More detailed project documentation is available in [`docs/`](./docs):

- [`docs/AGENTS.md`](./docs/AGENTS.md) contains the repository map, commands, conventions, and known issues.
- [`docs/architecture.md`](./docs/architecture.md) explains the database, backend, frontend, and RAG pipeline.
- [`docs/api.md`](./docs/api.md) lists the current HTTP endpoints and response formats.
- [`docs/frontend.md`](./docs/frontend.md) describes the React components, state, and styling.

## Current limitations

- Document embeddings are created one chunk at a time, so large uploads can take a while.
- Vector search does not currently use an index and is intended for smaller collections.
- Database changes are applied through Sequelize at startup rather than through migrations.
- The chat interface searches across the full document collection rather than letting users choose one document.
