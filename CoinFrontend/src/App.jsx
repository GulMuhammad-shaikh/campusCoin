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

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Savings from "./pages/Savings";
import Tips from "./pages/Tips";
import Profile from "./pages/Profile";

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
  const navigate = useNavigate();

  function handleLogin(studentData) {
    const user = {
      ...studentData,
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
    setStudent(null);
    navigate("/");
  }

  return (
    <div style={styles.app}>
      <Navbar student={student} onLogout={handleLogout} />

      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Home />} />

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

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute student={student}>
                <Dashboard student={student} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/income"
            element={
              <ProtectedRoute student={student}>
                <Income student={student} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute student={student}>
                <Expenses student={student} />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
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