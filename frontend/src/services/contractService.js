import api from "./api";

// GET /api/contracts
export const getContracts = async () => {
  const { data } = await api.get("/contracts");
  return data.contracts;
};

// GET /api/contracts/:id
export const getContractById = async (id) => {
  const { data } = await api.get(`/contracts/${id}`);
  return data.contract;
};

// POST /api/contracts (Requires farmerId in payload)
export const createContract = async (payload) => {
  const { data } = await api.post("/contracts", payload);
  return data.contract;
};

// PUT /api/contracts/:id/accept (Farmer only)
export const acceptContract = async (id) => {
  const { data } = await api.put(`/contracts/${id}/accept`);
  return data.contract;
};

// PUT /api/contracts/:id/reject (Farmer only)
export const rejectContract = async (id) => {
  const { data } = await api.put(`/contracts/${id}/reject`);
  return data.contract;
};

// PUT /api/contracts/:id/progress (Farmer only; payload can be FormData or object)
export const addProgressNote = async (id, payload) => {
  let response;
  if (payload instanceof FormData) {
    response = await api.put(`/contracts/${id}/progress`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    response = await api.put(`/contracts/${id}/progress`, { note: payload });
  }
  return response.data.contract;
};

// PUT /api/contracts/:id/ready (Farmer only)
export const markContractReady = async (id) => {
  const { data } = await api.put(`/contracts/${id}/ready`);
  return data.contract;
};

// PUT /api/contracts/:id/dispatch (Farmer only)
export const dispatchContract = async (id) => {
  const { data } = await api.put(`/contracts/${id}/dispatch`);
  return data.contract;
};

// PUT /api/contracts/:id/confirm-delivery (Buyer only)
export const confirmDelivery = async (id) => {
  const { data } = await api.put(`/contracts/${id}/confirm-delivery`);
  return data.contract;
};

// PUT /api/contracts/:id/complete (Buyer only)
export const completeContract = async (id) => {
  const { data } = await api.put(`/contracts/${id}/complete`);
  return data.contract;
};

// PUT /api/contracts/:id/initiate-payment (Buyer only)
export const initiatePayment = async (id) => {
  const { data } = await api.put(`/contracts/${id}/initiate-payment`);
  return data.contract;
};

// PUT /api/contracts/:id/confirm-payment (Farmer recipient only)
export const confirmPayment = async (id) => {
  const { data } = await api.put(`/contracts/${id}/confirm-payment`);
  return data.contract;
};

// PUT /api/contracts/:id/cancel (Buyer or Admin)
export const cancelContract = async (id) => {
  const { data } = await api.put(`/contracts/${id}/cancel`);
  return data.contract;
};
