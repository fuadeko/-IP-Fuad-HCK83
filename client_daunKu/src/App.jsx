import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { restoreAuth } from "./store/slices/authSlice"; // ✅ Tambahkan import
import Layout from "./components/Layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Plants from "./pages/Plants";
import PlantDetail from "./pages/PlantDetail";
import AddPlant from "./pages/AddPlant";
import PlantIdentification from "./pages/PlantIdentification";
import "./index.css";

function App() {
  const dispatch = useDispatch(); // ✅ Tambahkan useDispatch
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  
  // ✅ Tambahkan useEffect untuk restore auth saat app load
  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 App State:', { 
      isAuthenticated, 
      hasUser: !!user, 
      hasToken: !!token,
      tokenFromStorage: !!localStorage.getItem('access_token')
    });
  }, [isAuthenticated, user, token]);

  // Tambahkan error boundary
  if (!document.getElementById('root')) {
    console.error('❌ Root element not found!');
    return <div>Error: Root element not found</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              !isAuthenticated ? <Login /> : <Navigate to="/dashboard" />
            }
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? <Register /> : <Navigate to="/dashboard" />
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="plants" element={<Plants />} />
            <Route path="plants/:id" element={<PlantDetail />} />
            <Route path="add-plant" element={<AddPlant />} />
            <Route path="identify" element={<PlantIdentification />} />
          </Route>

          {/* Catch all */}
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
