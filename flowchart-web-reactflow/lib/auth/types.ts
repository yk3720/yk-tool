export type ProfileRole = "editor" | "viewer";

export type AuthContext = {
  userId: string;
  email: string;
  role: ProfileRole;
};
