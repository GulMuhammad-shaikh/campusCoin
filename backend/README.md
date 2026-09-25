# CampusCoin Backend API (Node.js + Express + MongoDB)

MVC backend for **CampusCoin** (Student Expense & Budget Tracker) featuring MongoDB (Mongoose), JWT authentication, bcrypt password hashing, and flexible auth middleware.

---

## 📁 Project Structure (MVC Architecture)

```text
backend/
├── config/
│   └── db.js                 # MongoDB connection & default category seeder
├── controllers/
│   ├── authController.js     # Register, login, student profile & updates
│   ├── categoryController.js # Category listing, adding, deletion
│   ├── transactionController.js # Transaction CRUD & financial summary
│   ├── budgetController.js   # Monthly budget caps & tracking
│   └── insightController.js  # AI narrative insights & saving tips
├── models/
│   ├── User.js               # Student user schema
│   ├── Category.js           # Category schema (Food, Transport, etc.)
│   ├── Transaction.js        # Transaction schema (Income/Expense)
│   ├── Budget.js             # Budget limit schema per month & category
│   └── Insight.js            # AI savings insights schema
├── routes/
│   ├── authRoutes.js         # /api/auth
│   ├── categoryRoutes.js     # /api/categories
│   ├── transactionRoutes.js  # /api/transactions
│   ├── budgetRoutes.js       # /api/budgets
│   └── insightRoutes.js      # /api/insights
├── middlewares/
│   └── authMiddleware.js     # JWT verification + direct tokenless access
├── .env                      # Environment variables
├── .env.example              # Environment variables template
├── package.json              # Dependencies & scripts
└── server.js                 # Express application entry point
```

---

## 🗄️ Database Schemas (Mongoose)

### 1. User
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `_id` / `user_id` | ObjectId | Unique identifier for student |
| `name` | String | Full name of the student |
| `email` | String | Unique login email |
| `password_hash` | String | Encrypted password (bcrypt, 10 rounds) |
| `academic_year` | String | Optional profile field (e.g. "Year 2") |
| `monthly_savings_goal` | Number | Target savings amount set by student |
| `created_at` | Date | Account creation timestamp |

### 2. Category
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `_id` / `category_id` | ObjectId | Unique category identifier |
| `name` | String | Food, Transport, Hostel, Academics, etc. |
| `type` | String | `'income'` or `'expense'` |
| `is_default` | Boolean | System default (true) or user created |

### 3. Transaction
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `_id` / `transaction_id` | ObjectId | Unique transaction identifier |
| `user_id` | ObjectId | References User |
| `category_id` | ObjectId | References Category |
| `amount` | Number | Transaction amount |
| `type` | String | `'income'` or `'expense'` |
| `description` | String | Free-text note entered by user |
| `ai_suggested_category` | Mixed | Category suggested by AI |
| `date` | Date | Date of transaction |
| `created_at` | Date | Record timestamp |

### 4. Budget
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `_id` / `budget_id` | ObjectId | Unique budget entry ID |
| `user_id` | ObjectId | References User |
| `category_id` | ObjectId | References Category |
| `month` | String / Date | Target month (e.g., `"2026-09"`) |
| `limit_amount` | Number | Cap set by student |

### 5. Insight
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `_id` / `insight_id` | ObjectId | Unique insight identifier |
| `user_id` | ObjectId | References User |
| `month` | String / Date | Month the insight covers |
| `summary_text` | String | AI narrative summary |
| `tip_text` | String | Actionable saving tip |
| `generated_at` | Date | Generation timestamp |

---

## 🔐 Auth & Direct API Access

- **JWT + Bcrypt**: Passwords are securely hashed with `bcryptjs` upon registration. On login, the password is verified and a signed JWT token is issued.
- **Direct Access Without Token**: As requested, routes can be accessed directly without an `Authorization` header. You can pass `user_id` in the request body, URL query `?user_id=...`, or header `x-user-id`.
- **Protected Routes in React**: Protected route logic is handled on the client side in React (`<ProtectedRoute student={student}>`), while the backend accommodates both tokenized and direct requests seamlessly.

---

## 🚀 How to Run the Backend

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Start Development Server** (with nodemon):
   ```bash
   npm run dev
   ```

3. **Start Production Server**:
   ```bash
   npm start
   ```

Server will start on `http://localhost:5000`.

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a student (name, email, password, academic_year, monthly_savings_goal)
- `POST /api/auth/login` — Login with email and password (returns JWT & user)
- `GET /api/auth/profile` or `/api/auth/profile/:id` — Get student profile
- `PUT /api/auth/profile` or `/api/auth/profile/:id` — Update profile details
- `GET /api/auth/users` — List registered students (development)

### Categories (`/api/categories`)
- `GET /api/categories` — Get all categories (optional: `?type=income` or `?type=expense`)
- `GET /api/categories/:id` — Get single category
- `POST /api/categories` — Create custom category (`name`, `type`)
- `DELETE /api/categories/:id` — Delete category

### Transactions (`/api/transactions`)
- `GET /api/transactions?user_id=...` — List transactions (filters: `type`, `startDate`, `endDate`, `category_id`)
- `GET /api/transactions/summary?user_id=...` — Get total income, total expense, and balance
- `GET /api/transactions/:id` — Get single transaction
- `POST /api/transactions` — Add transaction (`user_id`, `category_id`, `amount`, `type`, `description`, `date`)
- `PUT /api/transactions/:id` — Update transaction
- `DELETE /api/transactions/:id` — Delete transaction

### Budgets (`/api/budgets`)
- `GET /api/budgets?user_id=...&month=2026-09` — Get budget limits
- `POST /api/budgets` — Set/update monthly budget (`user_id`, `category_id`, `month`, `limit_amount`)
- `DELETE /api/budgets/:id` — Delete budget cap

### Insights (`/api/insights`)
- `GET /api/insights?user_id=...` — List AI insights
- `GET /api/insights/latest?user_id=...` — Get latest AI insight and tip
- `POST /api/insights` — Record insight (`user_id`, `month`, `summary_text`, `tip_text`)
