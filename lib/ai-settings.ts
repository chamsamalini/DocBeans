export type LlmProvider = 'anthropic' | 'openai';
export type CredentialMode = 'managed' | 'byok';

export type LlmModelOption = { value:string; label:string; description:string; inputUsdPerMillion:number; outputUsdPerMillion:number };

export const llmModels:Record<LlmProvider, LlmModelOption[]> = {
  anthropic: [
    { value:'claude-sonnet-5', label:'Claude Sonnet 5', description:'Best balance of writing quality and reasoning', inputUsdPerMillion:2, outputUsdPerMillion:10 },
    { value:'claude-haiku-4-5-20251001', label:'Claude Haiku 4.5', description:'Fast, lower-cost generation · active pinned model', inputUsdPerMillion:1, outputUsdPerMillion:5 },
  ],
  openai: [
    { value:'gpt-5-mini', label:'GPT-5 mini', description:'Fast, capable document generation', inputUsdPerMillion:.25, outputUsdPerMillion:2 },
    { value:'gpt-5.3-chat-latest', label:'GPT-5.3 Chat', description:'ChatGPT Instant model · deprecated by OpenAI', inputUsdPerMillion:1.75, outputUsdPerMillion:14 },
    { value:'gpt-4.1-mini', label:'GPT-4.1 mini', description:'Reliable instruction following', inputUsdPerMillion:.4, outputUsdPerMillion:1.6 },
  ],
};

export type AiSettings = {
  provider:LlmProvider;
  model:string;
  credentialMode:CredentialMode;
  apiKey:string;
};

export const defaultAiSettings:AiSettings = {
  provider:'anthropic',
  model:llmModels.anthropic[0].value,
  credentialMode:'managed',
  apiKey:'',
};

const PREFERENCES_KEY = 'docbeans.ai-preferences.v1';
const API_KEY = 'docbeans.ai-api-key.v1';

export function loadAiSettings():AiSettings {
  if (typeof window === 'undefined') return defaultAiSettings;
  try {
    const stored = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || '{}') as Partial<AiSettings>;
    const provider:LlmProvider = stored.provider === 'openai' ? 'openai' : 'anthropic';
    const migratedModel = stored.model === 'claude-haiku-4-5' ? 'claude-haiku-4-5-20251001' : stored.model;
    const model = llmModels[provider].some(item=>item.value === migratedModel) ? migratedModel as string : llmModels[provider][0].value;
    const credentialMode:CredentialMode = stored.credentialMode === 'byok' ? 'byok' : 'managed';
    return { provider, model, credentialMode, apiKey:window.sessionStorage.getItem(API_KEY) || '' };
  } catch {
    return defaultAiSettings;
  }
}

export function saveAiSettings(settings:AiSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ provider:settings.provider, model:settings.model, credentialMode:settings.credentialMode }));
  if (settings.credentialMode === 'byok' && settings.apiKey.trim()) window.sessionStorage.setItem(API_KEY, settings.apiKey.trim());
}

export function clearSessionApiKey() {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(API_KEY);
}
