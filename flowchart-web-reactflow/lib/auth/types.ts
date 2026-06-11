export type ProfileRole = "editor" | "viewer" | "admin";

export type AuthContext = {
  userId: string;
  email: string;
  role: ProfileRole;
};
