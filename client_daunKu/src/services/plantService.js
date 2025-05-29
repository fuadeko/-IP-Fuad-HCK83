import api from "./api";

const plantService = {
  getPlants: () => {
    return api.get("/plants");
  },

  getPlantById: (plantId) => {
    return api.get(`/plants/${plantId}`);
  },

  addPlant: (plantData) => {
    // Perbaikan: gunakan route yang benar
    return api.post("/plants/add-plant", plantData);
  },

  deletePlant: (plantId) => {
    return api.delete(`/plants/${plantId}`);
  },

  identifyPlant: (imageFile) => {
    // imageFile sudah berupa FormData dari frontend
    return api.post("/plants/identify", imageFile, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export default plantService;
