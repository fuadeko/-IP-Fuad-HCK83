import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../store/slices/authSlice";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(formData));
    if (result.type === "auth/login/fulfilled") {
      navigate("/dashboard");
    }
  };

  // Google OAuth Implementation
  useEffect(() => {
    async function handleCredentialResponse(response) {
      console.log("Encoded JWT ID token: " + response.credential);

      try {
        // Kirim token ke backend untuk verifikasi
        const apiResponse = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:3000"
          }/auth/google`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_token: response.credential, // Konsisten dengan backend
            }),
          }
        );

        const data = await apiResponse.json();
        console.log("Google login response:", data); // Debug log

        if (apiResponse.ok) {
          localStorage.setItem("access_token", data.access_token);

          // Update Redux state juga
          dispatch({
            type: "auth/login/fulfilled",
            payload: {
              user: data.user,
              token: data.access_token,
            },
          });

          console.log("Navigating to dashboard...");
          navigate("/dashboard");
        } else {
          console.error("Google login failed:", data.message);
          // Tampilkan error ke user jika perlu
        }
      } catch (err) {
        console.error("Google login error:", err);
      }
    }

    // Initialize Google OAuth dengan pengecekan
    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id:
            import.meta.env.VITE_GOOGLE_CLIENT_ID ||
            "656049011535-oht6cgegs4oqvvd6oeq56m6a4gtt4je6.apps.googleusercontent.com",
          callback: handleCredentialResponse,
        });

        const buttonElement = document.getElementById("google-signin-button");
        if (buttonElement) {
          window.google.accounts.id.renderButton(buttonElement, {
            theme: "filled_blue", // Ubah theme untuk tampilan lebih baik
            size: "large",
            width: "100%",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
          });
        }
      } else {
        // Retry after a short delay if Google script hasn't loaded yet
        setTimeout(initializeGoogleSignIn, 100);
      }
    };

    // Start initialization
    initializeGoogleSignIn();
  }, [navigate, dispatch]); // Tambahkan dispatch ke dependency

  return (
    <div className="login-container">
      <div className="login-background"></div>

      <div className="login-card">
        {/* Header Section */}
        <div className="login-header">
          <div className="login-icon">
            <span className="plant-emoji">🌿</span>
          </div>
          <h1 className="login-title">Selamat Datang</h1>
          <p className="login-subtitle">Masuk ke akun DaunKu Anda</p>
        </div>

        {/* Form Section */}
        <div className="login-form-section">
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Alamat Email
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Kata Sandi
              </label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="form-input"
                  placeholder="Masukkan kata sandi"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <div className="error-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="error-text">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`submit-button ${isLoading ? "loading" : ""}`}
            >
              {isLoading ? (
                <div className="loading-content">
                  <div className="spinner"></div>
                  <span>Sedang masuk...</span>
                </div>
              ) : (
                <div className="button-content">
                  <span>Masuk</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">atau</span>
              <div className="divider-line"></div>
            </div>

            {/* Google Login Button */}
            <div className="google-signin-container">
              <div id="google-signin-button"></div>
            </div>

            {/* Register Link */}
            <div className="register-link">
              <p>
                Belum punya akun?{" "}
                <Link to="/register" className="register-link-text">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <p className="footer-text">
          <span>Dibuat dengan</span>
          <span className="heart">💚</span>
          <span>untuk para pecinta tanaman</span>
        </p>
        <p className="copyright">© 2024 DaunKu - Plant Management System</p>
      </div>
    </div>
  );
};

export default Login;
