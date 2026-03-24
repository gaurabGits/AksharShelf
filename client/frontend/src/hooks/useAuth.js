import { isJwtExpired } from "../utils/jwt";

export const useAuth = () => {
  const token = localStorage.getItem("token");

  if (token && isJwtExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { token: null };
  }

  return { token: token || null };
};

