import api from "./api";

const careLogService = {
  getCareLogs: (plantId = null) => {
    if (plantId) {
      return api.get(`/care-logs/plant/${plantId}`);
    }
    return api.get("/care-logs");
  },

  addCareLog: (careLogData) => {
    return api.post("/care-logs/add-care", careLogData); // ✅ Perbaiki endpoint
  },

  generateCareSchedule: (plantIds) => {
    return api.post("/ai/care-schedule", { plantIds });
  },
};

export default careLogService;
