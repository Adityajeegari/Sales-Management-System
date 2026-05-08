import {
  clerkMiddleware,
  clerkClient,
  getAuth,
} from "@clerk/express";

// Provide sales-os-prefixed aliases that wrap Clerk's server APIs.
export const salesOsMiddleware = clerkMiddleware;
export const salesOsClient = clerkClient;
export const getSalesOsAuth = getAuth;

// Also export originals for convenience
export { clerkMiddleware, clerkClient, getAuth };

export default null as unknown as void;
