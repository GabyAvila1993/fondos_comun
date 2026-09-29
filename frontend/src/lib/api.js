import { ENV } from "../env";
async function request(path, token, options = {}) {
    const res = await fetch(`${ENV.BACKEND_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
    if (!res.ok)
        throw new Error(`Error ${res.status} en ${path}`);
    return res.json();
}
export const api = {
    listGroups: (token) => request("/groups", token),
    getMyStats: (token) => request("/groups/stats/me", token),
    getGroup: (token, groupId) => request(`/groups/${groupId}`, token),
    createGroup: (token, body) => request("/groups", token, { method: "POST", body: JSON.stringify(body) }),
    getNonce: (token, groupId) => request(`/groups/${groupId}/nonce`, token),
    join: (token, groupId, body) => request(`/groups/${groupId}/join`, token, { method: "POST", body: JSON.stringify(body) }),
    // El deposito fiat en un producto real lo dispara el webhook de tu
    // proveedor de pagos (Mercado Pago/banco), no el propio usuario desde el
    // navegador. Para el prototipo lo dejamos como una llamada directa.
    deposit: (token, groupId, fiatAmount) => request(`/groups/${groupId}/deposit`, token, { method: "POST", body: JSON.stringify({ fiatAmount }) }),
    requestExpense: (token, groupId, body) => request(`/groups/${groupId}/expense`, token, { method: "POST", body: JSON.stringify(body) }),
    vote: (token, groupId, body) => request(`/groups/${groupId}/vote`, token, { method: "POST", body: JSON.stringify(body) }),
};
