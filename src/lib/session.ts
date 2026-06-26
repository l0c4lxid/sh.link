import { getCookie, deleteCookie } from "@tanstack/react-start/server";
import { verifyJwt } from "@/lib/jwt";

export function getUserFromSession() {
  const token = getCookie("jwt_token");
  if (!token) return null;
  return verifyJwt(token);
}
