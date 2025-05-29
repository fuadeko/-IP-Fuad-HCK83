import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchPlants, deletePlant } from "../store/slices/plantSlice";
import "./Plants.css";

const Plants = () => {
  const dispatch = useDispatch();
  const { plants, isLoading, error } = useSelector((state) => state.plants);

  useEffect(() => {
    dispatch(fetchPlants());
  }, [dispatch]);

  const handleDelete = async (plantId) => {
    if (window.confirm("Are you sure you want to delete this plant?")) {
      await dispatch(deletePlant(plantId));
      dispatch(fetchPlants());
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading plants...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="plants-page">
      <div className="plants-header">
        <h1 className="plants-title">My Plants 🌱</h1>
        <Link to="/add-plant" className="add-plant-btn">
          Add New Plant
        </Link>
      </div>

      {plants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <h2 className="empty-state-title">No plants yet</h2>
          <p className="empty-state-description">
            Start building your plant collection by adding your first plant.
          </p>
          <Link to="/add-plant" className="add-plant-btn">
            Add Your First Plant
          </Link>
        </div>
      ) : (
        <div className="plants-grid">
          {plants.map((plant) => (
            <div key={plant.id} className="plant-card">
              <div className="plant-card-content">
                <div className="plant-card-header">
                  <div className="plant-avatar">
                    <span>🌿</span>
                  </div>
                  <div className="plant-actions">
                    <Link to={`/plants/${plant.id}`} className="view-link">
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(plant.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <h3 className="plant-name">{plant.nickname || plant.name}</h3>
                <p className="plant-species">{plant.speciesName || plant.species}</p>
                <p className="plant-date">
                  Added: {new Date(plant.createdAt).toLocaleDateString()}
                </p>
                {plant.notes && <p className="plant-notes">{plant.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Plants;
