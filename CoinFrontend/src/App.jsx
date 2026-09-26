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

function readStudent() {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_KEY) || "null");
  } catch {
    return null;
  }
}

function ProtectedRoute({ student, children }) {
  return student ? children : <Navigate to="/login" replace />;
}

function AppLayout() {
  const [student, setStudent] = useState(readStudent);
  const [modalType, setModalType] = useState(null); // null | "income" | "expense" | "category"
  const navigate = useNavigate();

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
    localStorage.removeItem("campusCoinToken");
    setStudent(null);
    navigate("/");
  }

  function openModal(type) {
    setModalType(type);
  }

  function closeModal() {
    setModalType(null);
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
                <Tips />
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
      {(modalType === "income" || modalType === "expense") && student && (
        <TransactionModal
          student={student}
          type={modalType}
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
    background: "#f5f8f7",
    color: "#17283e",
    fontFamily: "Inter, Arial, sans-serif",
  },
  main: {
    flex: 1,
    width: "100%",
  },
};