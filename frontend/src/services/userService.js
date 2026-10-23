import api from "./api";

// GET /api/users/me
export const getMyProfile = async () => {
  const { data } = await api.get("/users/me");
  return data.user;
};

// PUT /api/users/me
export const updateMyProfile = async (payload) => {
  const { data } = await api.put("/users/me", payload);
  return data.user;
};

// PUT /api/users/me/profile-picture (expects FormData with field "image")
export const uploadProfilePicture = async (formData) => {
  const { data } = await api.put("/users/me/profile-picture", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.user;
};

// POST /api/users/me/farm-photos (expects FormData with field "photo", Farmer only)
export const uploadFarmPhoto = async (formData) => {
  const { data } = await api.post("/users/me/farm-photos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.user;
};

// POST /api/users/me/business-photos (expects FormData with field "photo", Buyer only)
export const uploadBusinessPhoto = async (formData) => {
  const { data } = await api.post("/users/me/business-photos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.user;
};

// GET /api/users/farmers (Buyer, Farmer, Admin)
export const getActiveFarmers = async (params = {}) => {
  const { data } = await api.get("/users/farmers", { params });
  return data.farmers;
};

// GET /api/users (Admin only)
export const getAllUsers = async () => {
  const { data } = await api.get("/users");
  return data.users;
};

// PUT /api/users/:id/status (Admin only)
export const updateUserStatus = async (id, isActive) => {
  const { data } = await api.put(`/users/${id}/status`, { isActive });
  return data.user;
};

// DELETE /api/users/:id (Admin only)
export const deleteUser = async (id) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

// GET /api/users/verification (Admin only)
export const getVerificationUsers = async (params = {}) => {
  const { data } = await api.get("/users/verification", { params });
  return data.users;
};

// PUT /api/users/:id/verification (Admin only)
export const updateVerificationStatus = async (userId, status) => {
  const { data } = await api.put(`/users/${userId}/verification`, { status });
  return data.user;
};
