# 🪙 CampusCoin — Smart Campus Financial Management System

A modern, full-stack financial tracking and AI-powered advisory web application designed specifically for university students. CampusCoin helps students monitor daily allowances, track expenses by categories, set savings targets, analyze spending trends, and receive personalized financial advice powered by Google Gemini AI.

---

## 🌐 Live Deployments & URLs

| Service | Type | URL / Connection String |
| :--- | :--- | :--- |
| **Frontend** | Production Web App (Vercel) | [https://campus-coin-six.vercel.app/](https://campus-coin-six.vercel.app/) |
| **Backend API** | RESTful API Service (Vercel) | [https://campus-coin-backend.vercel.app/](https://campus-coin-backend.vercel.app/) |
| **Local Database** | MongoDB URI | `mongodb://127.0.0.1:27017/campus_coin_db` |

---

## ✨ Key Features

- **📊 Comprehensive Financial Dashboard:** Live overview of net balance, total income, total expenses, active financial streaks, and quick action shortcuts.
- **💸 Transaction Management:** Add, edit, filter, and categorize income and expenses with date-range filters and search functionality.
- **📈 Interactive Analytics & Reports:** Interactive charts powered by Recharts (Expense distribution donut charts, Monthly spending bars, and Yearly cash flow).
- **🎯 Smart Savings Goals:** Set customizable savings targets with real-time progress bars, completion estimates, and milestone rewards.
- **💡 AI-Powered Financial Advisory (Google Gemini):** Generates personalized, actionable saving recommendations dynamically tailored to your actual spending records.
- **🤖 Built-in AI Financial Chatbot:** Floating student assistant supporting financial queries, budgeting tips, and real-time guidance.
- **🌗 Dark / Light Mode Support:** Complete high-contrast theming system designed for seamless readability in both dark and light modes.
- **📱 Fully Responsive Design:** Optimized mobile and desktop user experience with responsive cards and mobile-adapted modals.
- **🔐 Secure Authentication:** JWT-based session security with bcrypt password encryption.

---

## 🛠️ Technology Stack

### Frontend (`/CoinFrontend`)
- **Framework:** React 19 + Vite 8
- **Routing:** React Router DOM v7
- **Data Visualization:** Recharts
- **HTTP Client:** Axios
- **Icons & UI:** FontAwesome Icons, Canvas Confetti, SweetAlert2
- **Theming:** Custom CSS3 Design System with CSS variables and dynamic ThemeContext

### Backend (`/backend`)
- **Runtime:** Node.js + Express.js
- **Architecture:** MVC (Model-View-Controller) Pattern
- **Database / ODM:** MongoDB + Mongoose
- **Security & Auth:** JSON Web Tokens (JWT), bcryptjs, CORS, Dotenv

---

## 📁 Repository Structure

```plaintext
campusCoin/
├── CoinFrontend/            # Frontend React application
│   ├── public/              # Static assets (logos, icons)
│   ├── src/
│   │   ├── components/      # UI components (Navbar, Footer, AiChatbot, etc.)
│   │   ├── context/         # Theme and App Context providers
│   │   ├── pages/           # Application views (Dashboard, Analytics, Tips, Savings, etc.)
│   │   └── utils/           # API handlers, audio effects, formatting helpers
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 # Backend Node.js / Express API
│   ├── src/
│   │   ├── config/          # Database configuration (MongoDB connection)
│   │   ├── controllers/     # Business logic controllers
│   │   ├── models/          # Mongoose database schemas
│   │   ├── routes/          # Express route definitions
│   │   └── middleware/      # JWT verification and auth middleware
│   ├── server.js            # Server entry point
│   ├── package.json
│   └── .env.example
│
└── README.md                # Project documentation
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** running locally or a MongoDB Atlas connection string
- **Git**

---

### 2. Backend Setup

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` directory (you can copy `.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/campus_coin_db
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *The server will start on `http://localhost:5000` connected to `mongodb://127.0.0.1:27017/campus_coin_db`.*

---

### 3. Frontend Setup

1. In a new terminal window, navigate to the frontend folder:
   ```bash
   cd CoinFrontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `CoinFrontend/.env`:
   ```env
   # API URL (Optional for local dev, defaults to auto-detecting or deployed backend)
   VITE_API_URL=http://localhost:5000

   # Google Gemini API Key for AI Financial Tips & Chatbot
   VITE_GEMINI_KEY=your_gemini_api_key_here
   ```

4. Launch the frontend development server:
   ```bash
   npm run dev
   ```
   *Open your browser and navigate to `http://localhost:5173` (or the port indicated in your console).*

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new student account | No |
| `POST` | `/api/auth/login` | Login with email and password | No |
| `GET` | `/api/auth/me` | Fetch logged-in student profile | Yes |
| `PUT` | `/api/auth/profile` | Update profile settings / currency | Yes |
| `GET` | `/api/transactions` | Retrieve all transactions with filters | Yes |
| `POST` | `/api/transactions` | Add a new transaction (Income/Expense) | Yes |
| `PUT` | `/api/transactions/:id` | Update an existing transaction | Yes |
| `DELETE` | `/api/transactions/:id`| Remove a transaction | Yes |
| `GET` | `/api/transactions/summary`| Get summary (Total income, expense, balance) | Yes |
| `GET` | `/api/categories` | Retrieve all active transaction categories | Yes |
| `GET` | `/api/savings` | Get current student savings goal & progress | Yes |
| `POST` | `/api/savings` | Set or update savings goal target | Yes |

---

## 🔒 Security Best Practices
- Passwords are salted and hashed using **bcryptjs**.
- Protected endpoints require a valid Bearer token verified via **jsonwebtoken**.
- CORS is configured to safely permit communications across frontend and backend environments.
- Secrets and API credentials are kept in `.env` files and excluded via `.gitignore`.

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
