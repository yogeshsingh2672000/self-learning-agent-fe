/**
 * Authentication utilities for JWT handling
 */
import Cookies from "js-cookie";

const TOKEN_KEY = "access_token";
const TOKEN_TYPE = "bearer";

export const authUtils = {
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      expires: 1 / 24, // 1 hour (js-cookie uses days)
    });
  },

  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
  },

  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
  },

  getAuthHeader: () => {
    const token = authUtils.getToken();
    if (!token) return {};
    return { Authorization: `${TOKEN_TYPE} ${token}` };
  },

  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },
};
