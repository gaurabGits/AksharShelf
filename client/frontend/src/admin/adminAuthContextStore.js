import { createContext } from 'react';

/** @type {import('react').Context<{
 *   admin: any;
 *   loginAdmin: (adminData: any) => void;
 *   logoutAdmin: () => void;
 * } | null>} */
export const AdminAuthContext = createContext(null);
