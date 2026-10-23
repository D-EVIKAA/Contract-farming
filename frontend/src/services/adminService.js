import api from "./api";

// GET /api/admin/stats
export const getSystemStats = async () => {
  const { data } = await api.get("/admin/stats");
  return data;
};
