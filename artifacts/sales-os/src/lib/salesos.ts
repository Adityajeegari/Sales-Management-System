import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
  useUser,
} from "@clerk/react";
import { shadcn } from "@clerk/themes";

// Re-export Clerk APIs and provide a Sales OS alias for the main provider.
export { SignIn, SignUp, Show, useClerk, useUser, shadcn };
export const SalesOsProvider = ClerkProvider;

// Also export the original name for convenience
export { ClerkProvider };

export default null as unknown as void;
