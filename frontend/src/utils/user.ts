import type { User } from "../types/api";

export const getDisplayName = (user: Pick<User, "display_name" | "email">) => {
  if (user.display_name && user.display_name.trim().length > 0) {
    return user.display_name;
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
