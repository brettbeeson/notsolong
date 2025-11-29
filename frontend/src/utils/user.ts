import type { User } from "../types/api";

export const getDisplayName = (user: Pick<User, "username" | "email">) => {
  if (user.username && user.username.trim().length > 0) {
    return user.username;
  }
  if (user.email) {
    const [local] = user.email.split("@");
    if (local) {
      return local;
    }
    return user.email;
  }
  return "Anonymous";
};
