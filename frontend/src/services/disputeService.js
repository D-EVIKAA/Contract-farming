import api from "./api";

// POST /api/disputes
export const createDispute = async (payload) => {
  const { data } = await api.post("/disputes", payload);
  return data.dispute;
};

// GET /api/disputes
export const getDisputes = async () => {
  const { data } = await api.get("/disputes");
  return data.disputes;
};

// GET /api/disputes/:id
export const getDisputeById = async (id) => {
  const { data } = await api.get(`/disputes/${id}`);
  return data.dispute;
};

// PUT /api/disputes/:id/status (Admin only)
export const updateDisputeStatus = async (id, status, resolutionDetails) => {
  const { data } = await api.put(`/disputes/${id}/status`, { status, resolutionDetails });
  return data.dispute;
};
