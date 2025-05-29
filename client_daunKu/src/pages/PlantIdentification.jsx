import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { identifyPlant } from "../store/slices/plantSlice";
import "./PlantIdentification.css";

const PlantIdentification = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const dispatch = useDispatch();
  const { identificationResult, isLoading, error } = useSelector(
    (state) => state.plants
  );

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentify = async () => {
    if (!selectedFile) {
      alert("Please select an image first");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    dispatch(identifyPlant(formData));
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="plant-identification-container">
      <div className="plant-identification-header">
        <h1 className="plant-identification-title">
          <span>🔍</span>
          Plant Identification
        </h1>
        <p className="plant-identification-subtitle">
          Upload a photo of a plant to identify its species using AI.
        </p>
      </div>

      <div className="plant-identification-grid">
        {/* Upload Section */}
        <div className="plant-identification-card">
          <h2 className="section-title">Upload Plant Image</h2>

          <div className="upload-section">
            <div className={`upload-dropzone ${preview ? "has-file" : ""}`}>
              {preview ? (
                <div className="preview-container">
                  <img
                    src={preview}
                    alt="Plant preview"
                    className="preview-image"
                  />
                  <button onClick={handleReset} className="change-image-btn">
                    Choose different image
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <p className="upload-text">
                    Click to upload or drag and drop
                  </p>
                  <p className="upload-subtext">PNG, JPG up to 10MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
              />
            </div>

            <button
              onClick={handleIdentify}
              disabled={!selectedFile || isLoading}
              className={`identify-btn ${isLoading ? "loading" : ""}`}
            >
              {isLoading ? "Identifying..." : "Identify Plant"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="plant-identification-card">
          <h2 className="section-title">Identification Results</h2>

          <div className="results-section">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>Error: {error}</span>
              </div>
            )}

            {isLoading && (
              <div className="loading-state">
                <div className="loading-icon">🔍</div>
                <p className="loading-text">Analyzing your plant image...</p>
              </div>
            )}

            {identificationResult && !isLoading && (
              <div className="results-section">
                <div className="result-card species">
                  <h3 className="result-title species">
                    <span>🌿</span>
                    Identified Species
                  </h3>
                  <p className="species-name">
                    {identificationResult.species || "Unknown Species"}
                  </p>
                  {identificationResult.confidence && (
                    <p className="confidence-score">
                      Confidence:{" "}
                      {Math.round(identificationResult.confidence * 100)}%
                    </p>
                  )}
                </div>

                {identificationResult.careAdvice && (
                  <div className="result-card care-advice">
                    <h3 className="result-title care-advice">
                      <span>💡</span>
                      Care Advice
                    </h3>
                    <p className="care-advice-text">
                      {identificationResult.careAdvice}
                    </p>
                  </div>
                )}

                {identificationResult.commonNames &&
                  identificationResult.commonNames.length > 0 && (
                    <div className="result-card common-names">
                      <h3 className="result-title common-names">
                        Common Names
                      </h3>
                      <div className="common-names-container">
                        {identificationResult.commonNames.map((name, index) => (
                          <span key={index} className="common-name-tag">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {!identificationResult && !isLoading && !error && (
              <div className="empty-state">
                <div className="empty-icon">🌱</div>
                <p className="empty-text">
                  Upload an image to start identification
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantIdentification;
