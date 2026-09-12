'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { BrowserAuthService, PublicAuthConfig, SocialProvider } from '../../contracts';

function assertSuccess(error: { message:string } | null) {
  if (error) throw new Error(error.message);
}

export function createSupabaseBrowserAuthService(config: PublicAuthConfig): BrowserAuthService {
  const client = createBrowserClient(config.endpoint, config.publicKey);
  return {
    async signInWithSocial(provider:SocialProvider, redirectTo:string) {
      const mappedProvider = provider === 'microsoft' ? 'azure' : 'google';
      const { error } = await client.auth.signInWithOAuth({ provider:mappedProvider, options:{ redirectTo, ...(mappedProvider==='azure'?{scopes:'email'}:{}) } });
      assertSuccess(error);
    },
    async signInWithPassword(email:string,password:string) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      assertSuccess(error);
    },
    async signUpWithPassword(email:string,password:string,redirectTo:string) {
      const { data,error } = await client.auth.signUp({ email,password,options:{emailRedirectTo:redirectTo} });
      assertSuccess(error);
      return { sessionCreated:Boolean(data.session) };
    },
    async sendPasswordReset(email:string,redirectTo:string) {
      const { error } = await client.auth.resetPasswordForEmail(email,{redirectTo});
      assertSuccess(error);
    },
    async updatePassword(password:string) {
      const { error } = await client.auth.updateUser({password});
      assertSuccess(error);
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      assertSuccess(error);
    },
    async listTotpFactors() {
      const { data,error } = await client.auth.mfa.listFactors();
      assertSuccess(error);
      return (data?.totp||[]).map(factor=>({id:factor.id,friendlyName:factor.friendly_name||null,status:factor.status}));
    },
    async enrollTotp(friendlyName:string) {
      const { data,error } = await client.auth.mfa.enroll({factorType:'totp',friendlyName});
      assertSuccess(error);
      if (!data?.totp) throw new Error('The authentication provider did not return an authenticator setup.');
      return {id:data.id,qrCode:data.totp.qr_code,secret:data.totp.secret};
    },
    async verifyTotp(factorId:string,code:string) {
      const challenge = await client.auth.mfa.challenge({factorId});
      assertSuccess(challenge.error);
      if (!challenge.data) throw new Error('The authentication provider did not create an MFA challenge.');
      const result = await client.auth.mfa.verify({factorId,challengeId:challenge.data.id,code});
      assertSuccess(result.error);
    },
    async removeTotp(factorId:string) {
      const { error } = await client.auth.mfa.unenroll({factorId});
      assertSuccess(error);
    },
  };
}
