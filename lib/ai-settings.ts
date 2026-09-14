export type LlmProvider = 'anthropic' | 'openai';
export type CredentialMode = 'managed' | 'byok';

export type LlmModelOption = { value:string; label:string; description:string; inputUsdPerMillion:number; outputUsdPerMillion:number };

export const llmModels:Record<LlmProvider, LlmModelOption[]> = {
  anthropic: [
    { value:'claude-fable-5-1', label:'Claude Fable 5.1', description:'Highest capability for demanding, long-form work', inputUsdPerMillion:10, outputUsdPerMillion:50 },
    { value:'claude-opus-5', label:'Claude Opus 5', description:'Complex professional and enterprise documents', inputUsdPerMillion:5, outputUsdPerMillion:25 },
    { value:'claude-sonnet-5', label:'Claude Sonnet 5', description:'Strong balance of quality, speed and cost', inputUsdPerMillion:2, outputUsdPerMillion:10 },
    { value:'claude-haiku-4-5-20251001', label:'Claude Haiku 4.5', description:'Fastest, lowest-cost Claude option', inputUsdPerMillion:1, outputUsdPerMillion:5 },
  ],
  openai: [
    { value:'gpt-6-astra', label:'GPT-6 Astra', description:'Highest capability for complex document work', inputUsdPerMillion:10, outputUsdPerMillion:50 },
    { value:'gpt-5.6-sol', label:'GPT-5.6 Sol', description:'Flagship quality for professional documents', inputUsdPerMillion:4, outputUsdPerMillion:20 },
    { value:'gpt-5.6-terra', label:'GPT-5.6 Terra', description:'Recommended balance of intelligence and cost', inputUsdPerMillion:2, outputUsdPerMillion:12 },
    { value:'gpt-5.6-luna', label:'GPT-5.6 Luna', description:'Fast, cost-efficient high-volume generation', inputUsdPerMillion:.2, outputUsdPerMillion:1.2 },
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
    const migratedModel = stored.model === 'claude-haiku-4-5' ? 'claude-haiku-4-5-20251001' : provider === 'openai' && ['gpt-5.3-chat-latest','gpt-5-mini','gpt-4.1-mini'].includes(stored.model||'') ? 'gpt-5.6-terra' : stored.model;
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
