# HR CRM with Auto-Generated Questionnaires

An MVP for HR professionals to create vacancies, auto-generate candidate questionnaires with ChatGPT, and analyze candidate responses.

## Requirements

- Docker and docker-compose
- Node.js 20+
- OpenAI API Key

## Setup

1. Clone this repository
2. Create a `.env` file in the root directory with:

```
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=hrcrm

# JWT
JWT_SECRET=your_jwt_secret_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

## Development

```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Start development environment
npm run docker:up
```

The services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

## API Endpoints

- POST `/api/login` - Authentication
- GET/POST/PUT/DELETE `/api/vacancies` - Vacancy management
- POST `/api/vacancies/:id/generate-quiz` - Generate quiz for a vacancy
- POST `/api/candidates/:vacancyId/answer` - Submit candidate answers (public)
- GET `/api/candidates/:vacancyId` - Get candidates for a vacancy

## Default User

The seed script creates a default HR user:
- Email: hr@example.com
- Password: password123

## Production

For production, update the `.env` file with secure credentials and set `NODE_ENV=production`. 