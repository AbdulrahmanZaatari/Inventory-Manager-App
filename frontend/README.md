# Next.js Frontend

This is the frontend application built with Next.js and Tailwind CSS. It connects to a Spring Boot backend API to manage inventory items.

## Features

- Frontend-only authentication using hardcoded credentials
- Protected routes
- View, add, edit, and delete items
- Environment variable support
- Dockerized setup

## Requirements

- Node.js v18 or higher
- NPM
- Backend API available and running

## Setup Instructions

1. Install dependencies:

npm install

2. Create a `.env.local` file in the root directory:

NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api

3. Run the development server:

npm run dev

The application will be available at http://localhost:3000.

## Default Credentials

Username: admin  
Password: password

## Docker Instructions

1. Build the Docker image:

docker build -t next-frontend .

2. Run the Docker container:

docker run -p 3000:3000 next-frontend

## Notes

- The backend must be running and reachable at the API base URL provided in `.env.local`.
- This project assumes the backend follows RESTful conventions for item endpoints.
