# VipStroy - Tire & Automotive Service Management Platform

A modern, full-stack web application for managing tire and automotive service operations.

## Features

- **Customer Management**: Track customer information and service history
- **Appointment Scheduling**: Book and manage service appointments
- **Inventory Management**: Track tire and parts inventory
- **Service Orders**: Create and manage service orders
- **Analytics Dashboard**: View business metrics and insights
- **User Authentication**: Secure login and role-based access

## Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router
- Axios
- Lucide Icons
- Recharts (Analytics)
- Zustand (State Management)

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs
- Express Validator

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```bash
cd VipStroy
```

2. Install dependencies
```bash
npm run install-all
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your configuration

4. Start MongoDB (if running locally)
```bash
mongod
```

5. Run the application
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`
The backend will run on `http://localhost:5000`

## Project Structure

```
VipStroy/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx
│   └── package.json
├── server/                # Express backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── config/           # Configuration files
│   └── index.js
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create service order
- `GET /api/services/:id` - Get service by ID
- `PUT /api/services/:id` - Update service

### Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Add inventory item
- `PUT /api/inventory/:id` - Update inventory
- `DELETE /api/inventory/:id` - Remove inventory

## License

MIT
