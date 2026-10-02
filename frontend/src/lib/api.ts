import { ENV } from "../env";
import type { Group } from "../types";

async function request(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${ENV.BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json();
}

export const api = {
  listGroups: (token: string): Promise<Group[]> => request("/groups", token),

  getMyStats: (token: string): Promise<{ stats: any[], currentUserId: string }> => 
    request("/groups/stats/me", token),

  getGroup: (token: string, groupId: string): Promise<Group> => request(`/groups/${groupId}`, token),

  updateProfile: (token: string, name: string) =>
    request("/users/me", token, { method: "PUT", body: JSON.stringify({ name }) }),

  getNotifications: (token: string) => request("/notifications", token),

  markNotificationsRead: (token: string, ids: string[]) =>
    request("/notifications/read", token, { method: "POST", body: JSON.stringify({ ids }) }),

  createGroup: (token: string, body: { name: string; creditLimit: string; dailyLimit: number }) =>
    request("/groups", token, { method: "POST", body: JSON.stringify(body) }),

  getNonce: (token: string, groupId: string): Promise<{ nonce: string }> =>
    request(`/groups/${groupId}/nonce`, token),

  join: (token: string, groupId: string, body: { nonce: string; signature: string }) =>
    request(`/groups/${groupId}/join`, token, { method: "POST", body: JSON.stringify(body) }),

  // El deposito fiat en un producto real lo dispara el webhook de tu
  // proveedor de pagos (Mercado Pago/banco), no el propio usuario desde el
  // navegador. Para el prototipo lo dejamos como una llamada directa.
  deposit: (token: string, groupId: string, fiatAmount: number) =>
    request(`/groups/${groupId}/deposit`, token, { method: "POST", body: JSON.stringify({ fiatAmount }) }),

  requestExpense: (
    token: string,
    groupId: string,
    body: { amountMon: string; desc: string; forceApproval: boolean; nonce: string; signature: string },
  ) => request(`/groups/${groupId}/expense`, token, { method: "POST", body: JSON.stringify(body) }),

  vote: (token: string, groupId: string, body: { txId: number; approve: boolean; nonce: string; signature: string }) =>
    request(`/groups/${groupId}/vote`, token, { method: "POST", body: JSON.stringify(body) }),

  proposeLimitChange: (token: string, groupId: string, body: { newLimit: string; nonce: string; signature: string }) =>
    request(`/groups/${groupId}/limit-proposal`, token, { method: "POST", body: JSON.stringify(body) }),

  voteLimitChange: (token: string, groupId: string, body: { proposalId: number; approve: boolean; nonce: string; signature: string }) =>
    request(`/groups/${groupId}/limit-vote`, token, { method: "POST", body: JSON.stringify(body) }),

  deleteGroup: (token: string, groupId: string) =>
    request(`/groups/${groupId}`, token, { method: "DELETE" }),

  proposeDelete: (token: string, groupId: string) =>
    request(`/groups/${groupId}/propose-delete`, token, { method: "POST" }),

  voteDelete: (token: string, groupId: string, body: { proposalId: string; approve: boolean }) =>
    request(`/groups/${groupId}/vote-delete`, token, { method: "POST", body: JSON.stringify(body) }),

  changeAdminLeave: (token: string, groupId: string, body: { newAdminId: string; newAdminWallet: string; nonce: number; signature: string }) =>
    request(`/groups/${groupId}/change-admin-leave`, token, { method: "POST", body: JSON.stringify(body) }),

  updateGroup: (token: string, groupId: string, body: { name: string }) =>
    request(`/groups/${groupId}`, token, { method: "PATCH", body: JSON.stringify(body) }),
};
