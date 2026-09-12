import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AssuranceLevel, AuthUser, PublicAuthConfig } from '../../contracts';

async function createSupabaseServerClient(config:PublicAuthConfig) {
  const cookieStore = await cookies();
  return createServerClient(config.endpoint, config.publicKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: values => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write refreshed cookies. Route handlers can.
        }
      },
    },
  });
}

function normalizeUser(user:{id:string;email?:string|null;user_metadata?:Record<string,unknown>}):AuthUser {
  const name = user.user_metadata?.full_name || user.user_metadata?.name;
  return {id:user.id,email:user.email||null,displayName:typeof name==='string'?name:null};
}

export function createSupabaseServerAuthService(config:PublicAuthConfig) {
  return {
    async getUser():Promise<AuthUser|null> {
      const client = await createSupabaseServerClient(config);
      const {data,error}=await client.auth.getUser();
      return error||!data.user?null:normalizeUser(data.user);
    },
    async exchangeAuthorizationCode(code:string) {
      const client = await createSupabaseServerClient(config);
      const {error}=await client.auth.exchangeCodeForSession(code);
      if(error) throw new Error(error.message);
    },
    async getAssuranceLevel():Promise<AssuranceLevel> {
      const client = await createSupabaseServerClient(config);
      const {data,error}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if(error||!data) return null;
      return data.currentLevel==='aal2'?'aal2':'aal1';
    },
  };
}
