import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    let accounts = [];

    try {
      accounts = JSON.parse(
        localStorage.getItem("campusCoinAccounts") || "[]"
      );
    } catch {
      setError("Your saved account data could not be read. Please register again.");
      return;
    }

    const account = accounts.find(
      (item) => item.email?.trim().toLowerCase() === normalizedEmail
    );

    if (!account || account.password !== password) {
      setError("Incorrect email or password. Please try again.");
      return;
    }

    const signedInStudent = {
      id: account.id || Date.now().toString(),
      name: account.name,
      email: account.email,
      studentId: account.studentId || "",
    };

    if (typeof onLogin === "function") {
      onLogin(signedInStudent);
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brandMark}>C</div>

        <p style={styles.eyebrow}>WELCOME BACK</p>
        <h1 style={styles.title}>Sign in to CampusCoin</h1>
        <p style={styles.subtitle}>
          Manage your income, expenses, and savings in one place.
        </p>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="login-email">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.label} htmlFor="login-password">
            Password
          </label>

          <div style={styles.passwordWrap}>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
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

          <button type="submit" style={styles.submitButton}>
            Sign in
          </button>
        </form>

        <p style={styles.footerText}>
          Don’t have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create an account
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
    maxWidth: 440,
    boxSizing: "border-box",
    background: "#ffffff",
    border: "1px solid #e5ebe8",
    borderRadius: 20,
    padding: "34px 32px",
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
    marginBottom: 25,
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
    margin: "10px 0 24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  label: {
    color: "#354055",
    fontSize: 13,
    fontWeight: 700,
    marginTop: 5,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
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
    padding: "13px 48px 13px 14px",
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
    margin: "23px 0 0",
  },
  link: {
    color: "#07865f",
    fontWeight: 800,
    textDecoration: "none",
  },
};