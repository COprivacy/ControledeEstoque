
function getAuthHeaders(): Record<string, string> {
  const userStr = localStorage.getItem("user");
  if (!userStr) return {};
  
  try {
    const user = JSON.parse(userStr);
    const headers: Record<string, string> = {
      "x-user-id": user.id,
      "x-user-type": user.tipo || "usuario",
    };
    
    if (user.tipo === "funcionario" && user.conta_id) {
      headers["x-conta-id"] = user.conta_id;
    }
    
    return headers;
  } catch (e) {
    return {};
  }
}

export const apiRequest = async (method: string, url: string, body?: any) => {
  const authHeaders = getAuthHeaders();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };

  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (response.status === 401) {
    throw new Error("Unauthorized: Please log in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response;
};
