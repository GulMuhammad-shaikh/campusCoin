import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register({ onRegister }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedStudentId = studentId.trim();

    if (!normalizedName || !normalizedEmail || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    let accounts = [];

    try {
      accounts = JSON.parse(
        localStorage.getItem("campusCoinAccounts") || "[]"
      );
    } catch {
      setError("Your saved account data could not be read. Please try again.");
      return;
    }

    const emailAlreadyExists = accounts.some(
      (account) =>
        account.email?.trim().toLowerCase() === normalizedEmail
    );

    if (emailAlreadyExists) {
      setError("An account with this email already exists. Please sign in.");
      return;
    }

    const newAccount = {
      id: Date.now().toString(),
      name: normalizedName,
      email: normalizedEmail,
      studentId: normalizedStudentId,
      password,
    };

    const updatedAccounts = [...accounts, newAccount];

    try {
      localStorage.setItem(
        "campusCoinAccounts",
        JSON.stringify(updatedAccounts)
      );
    } catch {
      setError("Could not save your account in this browser. Please try again.");
      return;
    }

    const signedInStudent = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      studentId: newAccount.studentId,
    };

    if (typeof onRegister === "function") {
      onRegister(signedInStudent);
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brandMark}>C</div>

        <p style={styles.eyebrow}>GET STARTED</p>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>
          Join CampusCoin and start organizing your student finances.
        </p>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="register-name">
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Enter your full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.label} htmlFor="register-email">
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.label} htmlFor="register-student-id">
            Student ID <span style={styles.optional}>(optional)</span>
          </label>
          <input
            id="register-student-id"
            type="text"
            name="studentId"
            placeholder="Enter your student ID"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            style={styles.input}
          />

          <label style={styles.label} htmlFor="register-password">
            Password
          </label>
          <div style={styles.passwordWrap}>
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              placeholder="Create a password (at least 6 characters)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={styles.passwordInput}
            />

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              style={styles.eyeButton}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          <label style={styles.label} htmlFor="register-confirm-password">
            Confirm password
          </label>
          <div style={styles.passwordWrap}>
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              style={styles.passwordInput}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((visible) => !visible)
              }
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              title={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
              style={styles.eyeButton}
            >
              {showConfirmPassword ? "🙈" : "👁"}
            </button>
          </div>

          <button type="submit" style={styles.submitButton}>
            Create account
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 80px)",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 18px",
    background: "#f5f8f7",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    color: "#172033",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    boxSizing: "border-box",
    background: "#ffffff",
    border: "1px solid #e5ebe8",
    borderRadius: 20,
    padding: "32px",
    boxShadow: "0 18px 50px rgba(19, 42, 34, 0.08)",
  },
  brandMark: {
    width: 46,
    height: 46,
    display: "grid",
    placeItems: "center",
    borderRadius: 14,
    background: "#07865f",
    color: "#ffffff",
    fontSize: 23,
    fontWeight: 900,
    marginBottom: 22,
  },
  eyebrow: {
    color: "#07865f",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    margin: "0 0 8px",
  },
  title: {
    fontSize: 26,
    lineHeight: 1.25,
    fontWeight: 850,
    margin: 0,
  },
  subtitle: {
    color: "#748092",
    fontSize: 14,
    lineHeight: 1.6,
    margin: "10px 0 22px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },
  label: {
    color: "#354055",
    fontSize: 13,
    fontWeight: 700,
    marginTop: 5,
  },
  optional: {
    color: "#8993a2",
    fontSize: 12,
    fontWeight: 500,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #dce3e8",
    borderRadius: 10,
    background: "#ffffff",
    color: "#172033",
    fontSize: 14,
    outlineColor: "#07865f",
    fontFamily: "inherit",
  },
  passwordWrap: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 48px 12px 14px",
    border: "1px solid #dce3e8",
    borderRadius: 10,
    background: "#ffffff",
    color: "#172033",
    fontSize: 14,
    outlineColor: "#07865f",
    fontFamily: "inherit",
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    border: 0,
    background: "transparent",
    borderRadius: 7,
    padding: "5px 7px",
    fontSize: 17,
    cursor: "pointer",
    color: "#657184",
  },
  submitButton: {
    width: "100%",
    border: 0,
    borderRadius: 10,
    padding: "14px 18px",
    marginTop: 12,
    background: "#07865f",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 7px 16px rgba(7, 134, 95, 0.18)",
  },
  error: {
    background: "#fff1f0",
    color: "#b42318",
    border: "1px solid #ffd2cf",
    borderRadius: 9,
    padding: "11px 13px",
    fontSize: 13,
    marginBottom: 15,
  },
  footerText: {
    color: "#778194",
    fontSize: 13,
    textAlign: "center",
    margin: "22px 0 0",
  },
  link: {
    color: "#07865f",
    fontWeight: 800,
    textDecoration: "none",
  },
};