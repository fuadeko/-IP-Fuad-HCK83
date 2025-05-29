import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlantById, deletePlant } from "../store/slices/plantSlice";
import { fetchCareLogs, addCareLog } from "../store/slices/careLogSlice";
import "./PlantDetail.css";

const PlantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedPlant, isLoading } = useSelector((state) => state.plants);
  const { careLogs } = useSelector((state) => state.careLogs);

  useEffect(() => {
    if (id) {
      dispatch(fetchPlantById(id));
      dispatch(fetchCareLogs());
    }
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this plant?")) {
      try {
        const result = await dispatch(deletePlant(id));
        if (deletePlant.fulfilled.match(result)) {
          navigate("/plants");
        } else {
          alert("Failed to delete plant:" + result.payload);
        }
      } catch (error) {
        alert(
          "An error occurred while deleting the plant.occurred while deleting the plant."
        );
      }
    }
  };

  const handleAddCareLog = async (careType) => {
    const careData = {
      plantId: parseInt(id),
      careType,
      notes: `${careType} performed on ${new Date().toLocaleDateString()}`,
    };
    await dispatch(addCareLog(careData));
    dispatch(fetchCareLogs());
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading plant details...</div>
      </div>
    );
  }

  if (!selectedPlant) {
    return (
      <div className="not-found-container">
        <h2 className="not-found-title">Plant not found</h2>
        <Link to="/plants" className="back-link">
          Back to Plants
        </Link>
      </div>
    );
  }

  const plantCareLogs = careLogs.filter((log) => log.plantId === parseInt(id));

  return (
    <div className="plant-detail-container">
      {/* Header */}
      <div className="plant-header">
        <div className="plant-header-info">
          <Link to="/plants" className="back-to-plants">
            ← Back to Plants
          </Link>
          <h1 className="plant-title">
            {selectedPlant.nickname || selectedPlant.name || "-"}
          </h1>
          <p className="plant-species">
            {selectedPlant.speciesName || selectedPlant.species || "-"}
          </p>
        </div>
        <button onClick={handleDelete} className="delete-plant-btn">
          Delete Plant
        </button>
      </div>

      {/* Plant Info */}
      <div className="plant-info-card">
        <div className="plant-info-content">
          <div className="plant-avatar">
            {selectedPlant.imageUrl ? (
              <img
                src={selectedPlant.imageUrl}
                alt="Plant"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span role="img" aria-label="plant">
                🌿
              </span>
            )}
          </div>
          <div className="plant-details">
            <div className="plant-info-grid">
              <div className="info-section">
                <h3>Plant Information</h3>
                <p>
                  <strong>Species:</strong>{" "}
                  {selectedPlant.speciesName || selectedPlant.species || "-"}
                </p>
                <p>
                  <strong>Added:</strong>{" "}
                  {selectedPlant.createdAt
                    ? new Date(selectedPlant.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div className="care-actions">
                <h3>Care Actions</h3>
                <div className="care-buttons">
                  <button
                    onClick={() => handleAddCareLog("watering")}
                    className="care-btn care-btn-water"
                  >
                    💧 Water
                  </button>
                  <button
                    onClick={() => handleAddCareLog("fertilizing")}
                    className="care-btn care-btn-fertilize"
                  >
                    🌱 Fertilize
                  </button>
                  <button
                    onClick={() => handleAddCareLog("pruning")}
                    className="care-btn care-btn-prune"
                  >
                    ✂️ Prune
                  </button>
                </div>
              </div>
            </div>
            {selectedPlant.notes && (
              <div className="notes-section">
                <h3>Notes</h3>
                <div className="notes-content">{selectedPlant.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Care History */}
      <div className="care-history-card">
        <div className="care-history-header">
          <h2 className="care-history-title">Care History</h2>
        </div>
        <div className="care-history-content">
          {plantCareLogs.length === 0 ? (
            <div className="no-care-logs">No care activities recorded yet</div>
          ) : (
            <div className="care-logs-list">
              {plantCareLogs.map((log) => (
                <div key={log.id} className="care-log-item">
                  <div className="care-log-icon">
                    {(log.careType || log.type) === "watering" && "💧"}
                    {(log.careType || log.type) === "fertilizing" && "🌱"}
                    {(log.careType || log.type) === "pruning" && "✂️"}
                  </div>
                  <div className="care-log-details">
                    <p className="care-log-type">
                      {log.careType || log.type || "-"}
                    </p>
                    <p className="care-log-date">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleDateString()
                        : log.date
                        ? new Date(log.date).toLocaleDateString()
                        : "-"}
                      {log.createdAt
                        ? ` at ${new Date(log.createdAt).toLocaleTimeString()}`
                        : log.date
                        ? ` at ${new Date(log.date).toLocaleTimeString()}`
                        : ""}
                    </p>
                    {log.notes && <p className="care-log-notes">{log.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantDetail;
