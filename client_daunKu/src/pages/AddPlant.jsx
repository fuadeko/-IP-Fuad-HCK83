import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addPlant } from "../store/slices/plantSlice";
import "./AddPlant.css";

const AddPlant = () => {
  const [formData, setFormData] = useState({
    nickname: "", // Ubah dari nickname ke name
    speciesName: "",
    commonName: "",
    notes: "",
    location: "",
    imageUrl: "",
    needsLight: false,
    needsWater: false,
    needsHumidity: false,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.plants);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(addPlant(formData));
    if (result.type === "plants/add/fulfilled") {
      navigate("/plants");
    }
  };

  return (
    <div className="add-plant-container">
      <div className="add-plant-header">
        <h1 className="add-plant-title">
          Add New Plant <span className="plant-icon">🌱</span>
        </h1>
        <p className="add-plant-subtitle">
          Add a new plant to your collection and start tracking its care.
        </p>
      </div>

      <div className="add-plant-card">
        <form onSubmit={handleSubmit} className="add-plant-form">
          <div className="form-group">
            <label htmlFor="nickname" className="form-label">
              Plant Name <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname" // ✅ Ubah name attribute
              required
              className="form-input"
              placeholder="e.g., My Monstera"
              value={formData.nickname} // ✅ Ubah value
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="speciesName" className="form-label">
              Species <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="speciesName"
              name="speciesName" // Ubah dari speciesName ke species
              required
              className="form-input"
              placeholder="e.g., Monstera deliciosa"
              value={formData.speciesName} // Ubah dari speciesName ke species
              onChange={handleChange}
            />
          </div>

          {/* ✅ Tambahkan field commonName */}
          <div className="form-group">
            <label htmlFor="commonName" className="form-label">
              Common Name <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="commonName"
              name="commonName" // Ubah dari nickname ke name
              required
              className="form-input"
              placeholder="e.g., My Monstera"
              value={formData.commonName} // Ubah dari nickname ke name
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              className="form-textarea"
              placeholder="Any additional notes about your plant..."
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>

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
              <span>Error: {error}</span>
            </div>
          )}

          <div className="button-container">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Adding Plant...
                </>
              ) : (
                "Add Plant"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/plants")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlant;
