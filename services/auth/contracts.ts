export type AuthProvider = 'disabled' | 'supabase' | 'auth0';
export type SocialProvider = 'google' | 'microsoft';
export type AssuranceLevel = 'aal1' | 'aal2' | null;

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

export type PublicAuthConfig = {
  provider: AuthProvider;
  endpoint: string;
  publicKey: string;
};

export type AuthFactor = {
  id: string;
  friendlyName: string | null;
  status: 'verified' | 'unverified';
};

export type TotpEnrollment = {
  id: string;
  qrCode: string;
  secret: string;
};

export interface BrowserAuthService {
  signInWithSocial(provider: SocialProvider, redirectTo: string): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUpWithPassword(email: string, password: string, redirectTo: string): Promise<{ sessionCreated: boolean }>;
  sendPasswordReset(email: string, redirectTo: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
  listTotpFactors(): Promise<AuthFactor[]>;
  enrollTotp(friendlyName: string): Promise<TotpEnrollment>;
  verifyTotp(factorId: string, code: string): Promise<void>;
  removeTotp(factorId: string): Promise<void>;
}
