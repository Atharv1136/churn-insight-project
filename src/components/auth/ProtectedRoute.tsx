import { ReactNode } from "react";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  // Bypass auth for development
  return <>{children}</>;
};
