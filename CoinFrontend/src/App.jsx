import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import TransactionModal from "./components/TransactionModal";
import CategoryModal from "./components/CategoryModal";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TransactionsPage from "./pages/TransactionsPage";
import Savings from "./pages/Savings";
import Tips from "./pages/Tips";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";

const STUDENT_KEY = "campusCoinCurrentStudent";
const TOKEN_KEY = "campusCoinToken";

function isTokenValid(token) {
  if (!token || typeof token !== "string") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Token expired
    }
    return true;
  } catch {
    return false;
  }
}

function readAuthenticatedStudent() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!isTokenValid(token)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(STUDENT_KEY);
      return null;
    }
    return JSON.parse(localStorage.getItem(STUDENT_KEY) || "null");
  } catch {
    return null;
  }
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem(TOKEN_KEY);
  const storedStudent = localStorage.getItem(STUDENT_KEY);

  // If token is missing, expired, or invalid, redirect to login
  if (!token || !storedStudent || !isTokenValid(token)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STUDENT_KEY);
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppLayout() {
  const [student, setStudent] = useState(readAuthenticatedStudent);
  const navigate = useNavigate();

  // Listen for auth expiration from API response interceptor
  React.useEffect(() => {
    const onAuthExpired = () => {
      setStudent(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener("campusCoinAuthExpired", onAuthExpired);
    return () => window.removeEventListener("campusCoinAuthExpired", onAuthExpired);
  }, [navigate]);

  function handleLogin(studentData) {
    const rawId = studentData?.user_id || studentData?._id || studentData?.id;
    const user = {
      ...studentData,
      user_id: rawId,
      _id: rawId,
      id: rawId,
      name:
        studentData?.name ||
        studentData?.fullName ||
        studentData?.username ||
        "Student",
    };
    localStorage.setItem(STUDENT_KEY, JSON.stringify(user));
    setStudent(user);
    navigate("/dashboard");
  }

  function handleLogout() {
    localStorage.removeItem(STUDENT_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setStudent(null);
    navigate("/login");
  }

  const [modalType, setModalType] = useState(null); // null | "income" | "expense" | "category" | "edit"
  const [modalData, setModalData] = useState(null);

  function openModal(type, data = null) {
    setModalType(type);
    setModalData(data);
  }

  function closeModal() {
    setModalType(null);
    setModalData(null);
  }

  return (
    <div style={styles.app}>
      {/* Navbar is hidden when any modal is open */}
      {!modalType && (
        <Navbar
          student={student}
          onLogout={handleLogout}
        />
      )}

      <main style={styles.main}>
        <Routes>
          <Route
            path="/"
            element={
              student ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Home />
              )
            }
          />

          <Route
            path="/login"
            element={
              student ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="/register"
            element={
              student ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register onRegister={handleLogin} />
              )
            }
          />

          {/* Dashboard – receives openModal and onViewAll (navigate to /transactions) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute student={student}>
                <Dashboard
                  student={student}
                  onOpenModal={openModal}
                  onViewAll={() => navigate("/transactions")}
                />
              </ProtectedRoute>
            }
          />

          {/* Full Transactions history page with all filters */}
          <Route
            path="/transactions"
            element={
              <ProtectedRoute student={student}>
                <TransactionsPage
                  student={student}
                  onClose={() => navigate("/dashboard")}
                />
              </ProtectedRoute>
            }
          />

          {/* /income and /expenses redirect to dashboard and open modal */}
          <Route
            path="/income"
            element={
              <ProtectedRoute student={student}>
                <Navigate to="/dashboard" replace state={{ openModal: "income" }} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute student={student}>
                <Navigate to="/dashboard" replace state={{ openModal: "expense" }} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/savings"
            element={
              <ProtectedRoute student={student}>
                <Savings student={student} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tips"
            element={
              <ProtectedRoute student={student}>
                <Tips student={student} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute student={student}>
                <Profile student={student} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute student={student}>
                <Analytics student={student} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer hidden when modal is open */}
      {!modalType && <Footer />}

      {/* Global Modals */}
      {(modalType === "income" || modalType === "expense" || modalType === "edit") && student && (
        <TransactionModal
          student={student}
          type={modalType === "edit" ? (modalData?.type || "expense") : modalType}
          initialData={modalData}
          onClose={closeModal}
          onOpenCategoryModal={() => openModal("category")}
        />
      )}

      {modalType === "category" && (
        <CategoryModal onClose={closeModal} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background:
      "radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.04) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(6, 182, 212, 0.04) 0%, transparent 40%), #f8fafc",
    color: "#0f172a",
    fontFamily: "var(--font-sans)",
  },
  main: {
    flex: 1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
};