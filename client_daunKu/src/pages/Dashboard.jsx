import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchPlants } from "../store/slices/plantSlice";
import { fetchCareLogs } from "../store/slices/careLogSlice";
const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { plants, isLoading: plantsLoading } = useSelector(
    (state) => state.plants
  );
  const { careLogs, isLoading: careLogsLoading } = useSelector(
    (state) => state.careLogs
  );

  useEffect(() => {
    dispatch(fetchPlants());
    dispatch(fetchCareLogs());
  }, [dispatch]);

  const recentPlants = Array.isArray(plants) ? plants.slice(0, 3) : [];
  const recentCareLogs = Array.isArray(careLogs) ? careLogs.slice(0, 5) : [];

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="welcome-card">
        <h1 className="welcome-title">Welcome back, {user?.userName}! 🌱</h1>
        <p className="welcome-subtitle">
          Manage your plant collection and track their care schedules.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon green">🌿</div>
            <div className="stat-info">
              <p className="stat-label">Total Plants</p>
              <p className="stat-value">
                {plantsLoading ? "..." : recentPlants.length}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon blue">📝</div>
            <div className="stat-info">
              <p className="stat-label">Care Logs</p>
              <p className="stat-value">
                {careLogsLoading ? "..." : recentCareLogs.length}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon yellow">🔍</div>
            <div className="stat-info">
              <p className="stat-label">Quick Actions</p>
              <Link to="/identify" className="quick-action-link">
                Identify Plant →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Plants */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Recent Plants</h2>
          <Link to="/plants" className="view-all-link">
            View all →
          </Link>
        </div>
        <div className="section-content">
          {plantsLoading ? (
            <p className="loading-text">Loading plants...</p>
          ) : recentPlants.length > 0 ? (
            <div className="plants-grid">
              {recentPlants.map((plant) => (
                <Link
                  key={plant.id}
                  to={`/plants/${plant.id}`}
                  className="plant-card"
                >
                  <div className="plant-content">
                    <div className="plant-avatar">🌱</div>
                    <div className="plant-info">
                      <h3 className="plant-name">{plant.nickname}</h3>
                      <p className="plant-species">{plant.speciesName}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-text">No plants yet</p>
              <Link to="/add-plant" className="add-button">
                Add your first plant
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Care Logs */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Recent Care Activities</h2>
        </div>
        <div className="section-content">
          {careLogsLoading ? (
            <p className="loading-text">Loading care logs...</p>
          ) : recentCareLogs.length > 0 ? (
            <div className="care-logs-list">
              {recentCareLogs.map((log) => (
                <div key={log.id} className="care-log-item">
                  <div className="care-log-icon">💧</div>
                  <div className="care-log-content">
                    <p className="care-log-title">
                      {log.careType || log.type || "-"}
                      {" - "}
                      {log.Plant?.nickname ||
                        log.Plant?.name ||
                        "Unknown Plant"}
                    </p>
                    <p className="care-log-date">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleDateString()
                        : log.date
                        ? new Date(log.date).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text center">No care activities yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
