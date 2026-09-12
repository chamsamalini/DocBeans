import { env } from 'cloudflare:workers';
import type { GeneratedJobDocument, JobGenerationResponse, JobPostInput } from '@/lib/job-generation';

const DOCBEANS_PRICE_SGD = 0.03;

type Provider = 'anthropic' | 'openai';
const PROVIDERS = {
  anthropic: {
    defaultModel: 'claude-sonnet-5',
    models: {
      'claude-sonnet-5': { input: 2, output: 10 },
      'claude-haiku-4-5': { input: 1, output: 5 },
    },
  },
  openai: {
    defaultModel: 'gpt-5-mini',
    models: {
      'gpt-5-mini': { input: 0.25, output: 2 },
      'gpt-4.1-mini': { input: 0.4, output: 1.6 },
    },
  },
} as const;

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title','context','organisation','companyUrl','aboutRole','responsibilities','requiredQualifications','preferredQualifications','benefits','application','inclusiveStatement','linkedinIntro','quality'],
  properties: {
    title: { type: 'string' },
    context: { type: 'string' },
    organisation: { type: 'string' },
    companyUrl: { type: 'string' },
    aboutRole: { type: 'string' },
    responsibilities: { type: 'array', items: { type: 'string' } },
    requiredQualifications: { type: 'array', items: { type: 'string' } },
    preferredQualifications: { type: 'array', items: { type: 'string' } },
    benefits: { type: 'array', items: { type: 'string' } },
    application: { type: 'string' },
    inclusiveStatement: { type: 'string' },
    linkedinIntro: { type: 'string' },
    quality: {
      type: 'object',
      additionalProperties: false,
      required: ['score','status','checks','missingInformation'],
      properties: {
        score: { type: 'integer' },
        status: { type: 'string', enum: ['ready','needs_review'] },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label','status','message'],
            properties: {
              label: { type: 'string' },
              status: { type: 'string', enum: ['pass','review'] },
              message: { type: 'string' },
            },
          },
        },
        missingInformation: { type: 'array', items: { type: 'string' } },
      },
    },
  },
} as const;

function clean(value:unknown, maxLength=5000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function parseInput(value:unknown): JobPostInput | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const input:JobPostInput = {
    title: clean(source.title, 160),
    context: clean(source.context, 300),
    organisation: clean(source.organisation, 160),
    companyUrl: clean(source.companyUrl, 500),
    responsibilities: clean(source.responsibilities),
    qualifications: clean(source.qualifications),
    preferredQualifications: clean(source.preferredQualifications, 2000),
    benefits: clean(source.benefits, 2000),
    application: clean(source.application, 1000),
    tone: clean(source.tone, 120),
  };
  return input.title && input.responsibilities && input.qualifications ? input : null;
}

function splitItems(value:string) {
  return value.split(/\r?\n|;|,(?=\s*[A-Za-z])/).map(item => item.replace(/^(?:[-•*]\s+|\d+[.)]\s+)/, '').trim()).filter(Boolean);
}

function sentence(value:string) {
  const cleanValue = value.trim().replace(/[.;,]+$/, '');
  return cleanValue ? cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1) : cleanValue;
}

function polishContext(value:string) {
  if (!value.trim()) return 'Working arrangement to be confirmed';
  return value.split(/[,;\n]|\s+[·|]\s+/).map(part => {
    const item = part.trim();
    if (!item) return '';
    if (/^ai$/i.test(item)) return 'AI';
    if (/^ai\s+team$/i.test(item)) return 'AI Team';
    if (/^full[- ]?time$/i.test(item)) return 'Full-time';
    if (/^part[- ]?time$/i.test(item)) return 'Part-time';
    if (/^remote$/i.test(item)) return 'Remote';
    if (/^hybrid$/i.test(item)) return 'Hybrid';
    if (/^singapore$/i.test(item)) return 'Singapore';
    return item.replace(/\b\w/g, character => character.toUpperCase());
  }).filter(Boolean).join(' · ');
}

function polishResponsibility(value:string) {
  const item = value.trim().replace(/[.;,]+$/, '');
  if (/ai initiatives?/i.test(item)) return 'Lead internal AI initiatives aligned with business priorities and measurable outcomes';
  if (/literacy/i.test(item)) return 'Design and deliver practical AI literacy programmes for employees across the organisation';
  if (/fluency/i.test(item)) return 'Build AI fluency by helping teams apply tools confidently, responsibly and effectively';
  if (/requirement|business need|use case/i.test(item)) return 'Partner with stakeholders to identify, assess and prioritise business requirements and AI use cases';
  if (/gap.*infrastructure|infrastructure/i.test(item)) return 'Assess gaps in AI infrastructure and recommend appropriate platforms, security controls and governance practices';
  if (/suggest|recommend|fix|improvement/i.test(item)) return 'Recommend practical improvements based on identified business and technical needs';
  if (/build|application|prototype/i.test(item)) return 'Prototype and support the delivery of business-focused AI applications';
  if (/^(lead|drive|identify|develop|build|deliver|define|manage|create|design|assess|advise|partner|establish|implement|support|translate|coordinate|monitor|evaluate)\b/i.test(item)) return sentence(item);
  return sentence(item);
}

function polishQualification(value:string) {
  const item = value.trim().replace(/[.;,]+$/, '');
  if (/^masters?\s+(degree\s+)?in\s+computer science$/i.test(item)) return 'Master’s degree in computer science';
  if (/certificat(e|ion).*(ai|artificial intelligence).*(app|application|development)|supporting skills certificate.*ai/i.test(item)) return 'Relevant certification in AI application development';
  if (/^\d+\+?\s*years?$/i.test(item)) return `At least ${item.match(/\d+/)?.[0] || '2'} years of relevant experience`;
  return sentence(item.replace(/\bai\b/gi, 'AI'));
}

function polishBenefit(value:string) {
  const item = value.trim().replace(/[.;,]+$/, '');
  if (/^medical benefit$/i.test(item)) return 'Medical benefits';
  if (/^annual bonus$/i.test(item)) return 'Annual bonus';
  return sentence(item);
}

function isWeakFragment(value:string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.length < 3 || /\b(anything|something|whatever|etc\.?|relevant to ai)\b/i.test(value) || /^(deliver gaps|deliver suggest|own (ai|suggest|train)|supporting skills certificate)/i.test(value) || /\bai\b/.test(value);
}

function validCompanyUrl(value:string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname.includes('.'));
  } catch { return false; }
}

function hasApplicationDestination(value:string) {
  const text = value.trim();
  if (!text) return false;
  if (/https?:\/\/\S+|www\.\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/i.test(text)) return true;
  if (/\b(linkedin|indeed|jobstreet|careers? (?:page|site)|application portal|company website)\b/i.test(text)) return true;
  return /\b(?:apply|submit|send)\b[\s\S]{0,80}\b(?:at|to|through|via|on)\b\s+\S+/i.test(text);
}

function logGeneration(level:'info'|'warn'|'error', data:Record<string, unknown>) {
  console[level](JSON.stringify({ service:'docbeans-generation', ...data }));
}

function validateDocument(document:GeneratedJobDocument, input:JobPostInput) {
  const allProfessionalItems = [...document.responsibilities, ...document.requiredQualifications, ...document.preferredQualifications];
  const normalizedResponsibilities = document.responsibilities.map(item => item.toLowerCase().replace(/\W/g, ''));
  const distinctResponsibilities = new Set(normalizedResponsibilities).size === document.responsibilities.length;
  const actionLed = document.responsibilities.every(item => /^(lead|drive|identify|develop|build|deliver|define|manage|create|design|assess|advise|partner|establish|implement|support|translate|coordinate|monitor|evaluate|recommend|prototype|help)/i.test(item));
  const grammarPass = document.aboutRole.trim().split(/\s+/).length >= 12 && allProfessionalItems.every(item => !isWeakFragment(item));
  const responsibilitiesPass = document.responsibilities.length >= 4 && document.responsibilities.length <= 8 && distinctResponsibilities && actionLed;
  const repeatedPhraseCount = document.responsibilities.filter(item => /clear ownership and measurable outcomes/i.test(item)).length;
  const repetitionPass = repeatedPhraseCount <= 1 && distinctResponsibilities;
  const inputClaims = `${input.qualifications} ${input.preferredQualifications} ${input.benefits}`.toLowerCase();
  const generatedClaims = `${document.requiredQualifications.join(' ')} ${document.preferredQualifications.join(' ')} ${document.benefits.join(' ')}`.toLowerCase();
  const inputNumbers = new Set(inputClaims.match(/\b\d+\+?\b/g) || []);
  const generatedNumbers = generatedClaims.match(/\b\d+\+?\b/g) || [];
  const unsupportedPass = generatedNumbers.every(number => inputNumbers.has(number)) && (input.benefits.trim() || document.benefits.length === 0);
  const publicationPass = Boolean(document.context.trim() && input.organisation.trim() && hasApplicationDestination(document.application) && validCompanyUrl(input.companyUrl));
  const checks = [
    { label:'Grammar and structure', status:grammarPass ? 'pass' : 'review', message:grammarPass ? 'Complete, professional language with no weak fragments.' : 'One or more phrases are incomplete, vague or need rewriting.' },
    { label:'Responsibilities', status:responsibilitiesPass ? 'pass' : 'review', message:responsibilitiesPass ? `${document.responsibilities.length} distinct, action-led responsibilities.` : 'Use 4–8 distinct responsibilities that begin with clear action verbs.' },
    { label:'Repetition', status:repetitionPass ? 'pass' : 'review', message:repetitionPass ? 'No duplicated or formulaic responsibilities detected.' : 'Remove duplicated or formulaic responsibility wording.' },
    { label:'Unsupported claims', status:unsupportedPass ? 'pass' : 'review', message:unsupportedPass ? 'No unsupported numeric, benefit or credential claims detected.' : 'Confirm claims that were not clearly supplied in the brief.' },
    { label:'Publication details', status:publicationPass ? 'pass' : 'review', message:publicationPass ? 'Working context, organisation and application route are present.' : 'Add or correct essential publication details.' },
  ] as GeneratedJobDocument['quality']['checks'];
  const rawPreferred = splitItems(input.preferredQualifications);
  const missingInformation = [
    !input.context && 'Location, workplace model and employment type',
    !input.organisation && 'Organisation name',
    !hasApplicationDestination(input.application) && 'A specific application destination, such as an email address, careers page or job portal',
    input.companyUrl && !validCompanyUrl(input.companyUrl) && 'A valid company website beginning with http:// or https://',
    rawPreferred.some(isWeakFragment) && 'Clarify or remove incomplete preferred qualifications',
    splitItems(input.qualifications).some(item => /^\d+\+?\s*years?$/i.test(item)) && 'Specify the field or type of experience required',
  ].filter(Boolean) as string[];
  const reviewCount = checks.filter(check => check.status === 'review').length;
  const score = Math.max(40, Math.min(96, 96 - reviewCount * 12 - missingInformation.length * 4));
  return { score, status:reviewCount === 0 && missingInformation.length === 0 ? 'ready' : 'needs_review', checks, missingInformation } as GeneratedJobDocument['quality'];
}

function localDraft(input:JobPostInput):GeneratedJobDocument {
  const responsibilities = [...new Set(splitItems(input.responsibilities).map(polishResponsibility))].slice(0, 8);
  const requiredQualifications = splitItems(input.qualifications).map(polishQualification).slice(0, 8);
  const preferredQualifications = splitItems(input.preferredQualifications).filter(item => !isWeakFragment(item)).map(polishQualification).slice(0, 6);
  const benefits = splitItems(input.benefits).map(polishBenefit).slice(0, 6);
  const isAIRole = /\bai\b|artificial intelligence/i.test(`${input.title} ${input.responsibilities}`);
  const aboutRole = isAIRole
    ? `The ${input.title} will lead practical AI adoption across the organisation, translating business needs into responsible solutions, capability-building programmes and measurable outcomes.`
    : `The ${input.title} will translate business priorities into practical delivery, working across stakeholders to achieve clear, measurable outcomes.`;
  const document:GeneratedJobDocument = {
    title: input.title,
    context: polishContext(input.context),
    organisation: input.organisation,
    companyUrl: validCompanyUrl(input.companyUrl) ? input.companyUrl : '',
    aboutRole,
    responsibilities,
    requiredQualifications,
    preferredQualifications,
    benefits,
    application: input.application || 'Add the application method and closing date before publishing.',
    inclusiveStatement: 'We welcome applicants from different backgrounds who can demonstrate the skills and outcomes required for this role.',
    linkedinIntro: `${input.organisation ? `${input.organisation} is` : 'We are'} looking for a ${input.title} to turn business needs into practical, responsible and measurable outcomes.`,
    quality: { score:0, status:'needs_review', checks:[], missingInformation:[] },
  };
  document.quality = validateDocument(document, input);
  return document;
}

function apiKey(provider:Provider, request:Request) {
  const suppliedKey = request.headers.get('X-Provider-API-Key')?.trim();
  if (suppliedKey) return suppliedKey;
  try {
    const workerEnv = env as unknown as { ANTHROPIC_API_KEY?: string; OPENAI_API_KEY?: string };
    return provider === 'anthropic' ? workerEnv.ANTHROPIC_API_KEY : workerEnv.OPENAI_API_KEY;
  } catch {}
  return provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;
}

function anthropicOutputText(response:Record<string, unknown>) {
  const content = Array.isArray(response.content) ? response.content : [];
  for (const block of content) {
    if (block && typeof block === 'object' && (block as {type?:unknown}).type === 'text' && typeof (block as {text?:unknown}).text === 'string') {
      return (block as {text:string}).text;
    }
  }
  return '';
}

function openAIOutputText(response:Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object' || !Array.isArray((item as {content?:unknown}).content)) continue;
    for (const part of (item as {content:unknown[]}).content) {
      if (part && typeof part === 'object' && typeof (part as {text?:unknown}).text === 'string') return (part as {text:string}).text;
    }
  }
  return '';
}

function providerSelection(payload:unknown) {
  const source = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const provider:Provider = source.provider === 'openai' ? 'openai' : 'anthropic';
  const providerConfig = PROVIDERS[provider];
  const modelRates = providerConfig.models as Record<string, { input:number; output:number }>;
  const requestedModel = typeof source.model === 'string' ? source.model : '';
  const model = requestedModel in modelRates ? requestedModel : providerConfig.defaultModel;
  return { provider, model, rates:modelRates[model] };
}

export async function POST(request:Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const payload = await request.json().catch(() => null);
  const input = parseInput(payload);
  if (!input) {
    logGeneration('warn', { event:'request_rejected', requestId, status:400, durationMs:Date.now() - startedAt, reason:'missing_required_fields' });
    return Response.json({ error: 'Job title, responsibilities and required qualifications are required.' }, { status:400, headers:{'X-Request-ID':requestId} });
  }

  const { provider, model, rates } = providerSelection(payload);
  const isByok = request.headers.get('X-DocBeans-Billing-Mode') === 'byok' && Boolean(request.headers.get('X-Provider-API-Key')?.trim());
  const key = apiKey(provider, request);
  if (!key) {
    const result:JobGenerationResponse = {
      document: localDraft(input),
      usage: { mode: 'local-fallback', billingMode:'none', model: 'Local quality rules', responseId: null, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, providerCostUsd: 0, credits: 0, customerChargeSgd: 0 },
      notice: `${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} is not configured. Add your own API key or configure a server key. This draft uses local quality rules and consumes no provider tokens or DocBeans credits.`,
    };
    logGeneration('info', { event:'generation_completed', requestId, status:200, durationMs:Date.now() - startedAt, mode:result.usage.mode, qualityStatus:result.document.quality.status, qualityScore:result.document.quality.score, responsibilityCount:result.document.responsibilities.length, totalTokens:0, credits:0 });
    return Response.json(result, { headers:{'X-Request-ID':requestId} });
  }

  const systemPrompt = 'You are DocBeans, a meticulous senior talent-acquisition writer. Produce a credible, inclusive and publication-ready job description. Correct spelling, capitalisation and grammar. Rewrite fragments into natural professional language. Preserve all supplied facts. Never invent salary, benefits, credentials, years of experience, reporting lines, company claims or deadlines. Use empty arrays or explicit missing-information notes when facts are absent. Responsibilities must be distinct, action-led and outcome-oriented. Separate required from preferred qualifications. The LinkedIn introduction must be concise and candidate-friendly. Reproduce companyUrl exactly when supplied; do not browse it or infer facts from it. Quality status may be ready only when grammar, structure and all essential publication details pass.';
  const providerResponse = provider === 'anthropic' ? await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role:'user', content:JSON.stringify(input) }],
      output_config: { format: { type:'json_schema', schema:responseSchema } },
    }),
  }) : await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization:`Bearer ${key}`, 'Content-Type':'application/json' },
    body: JSON.stringify({
      model,
      max_output_tokens:4000,
      input:[{ role:'system', content:systemPrompt }, { role:'user', content:JSON.stringify(input) }],
      text:{ format:{ type:'json_schema', name:'job_document', strict:true, schema:responseSchema } },
    }),
  });

  const raw = await providerResponse.json() as Record<string, unknown>;
  if (!providerResponse.ok) {
    const providerMessage = raw.error && typeof raw.error === 'object' && typeof (raw.error as {message?:unknown}).message === 'string' ? (raw.error as {message:string}).message : 'The generation provider could not complete this request.';
    logGeneration('error', { event:'generation_failed', requestId, status:502, durationMs:Date.now() - startedAt, mode:provider, model, providerStatus:providerResponse.status, reason:'provider_error' });
    return Response.json({ error: providerMessage }, { status:502, headers:{'X-Request-ID':requestId} });
  }

  const text = provider === 'anthropic' ? anthropicOutputText(raw) : openAIOutputText(raw);
  const stopReason = provider === 'anthropic' ? raw.stop_reason : raw.status;
  if (!text) {
    logGeneration('error', { event:'generation_failed', requestId, status:502, durationMs:Date.now() - startedAt, mode:provider, model, stopReason, reason:'empty_provider_output' });
    return Response.json({ error: 'The generation provider returned no document.' }, { status:502, headers:{'X-Request-ID':requestId} });
  }
  let document:GeneratedJobDocument;
  try {
    document = JSON.parse(text) as GeneratedJobDocument;
  } catch {
    logGeneration('error', { event:'generation_failed', requestId, status:502, durationMs:Date.now() - startedAt, mode:provider, model, stopReason, outputCharacters:text.length, reason:'invalid_provider_json' });
    const message = stopReason === 'max_tokens' || stopReason === 'incomplete'
      ? 'The selected model reached its output limit before finishing. Please try again.'
      : 'The generation provider returned an invalid document. Please try again.';
    return Response.json({ error:message }, { status:502, headers:{'X-Request-ID':requestId} });
  }
  document.companyUrl = input.companyUrl;
  document.quality = validateDocument(document, input);
  const usage = (raw.usage || {}) as { input_tokens?:number; output_tokens?:number; input_tokens_details?:{cached_tokens?:number}; cache_read_input_tokens?:number };
  const inputTokens = usage.input_tokens || 0;
  const cachedInputTokens = usage.cache_read_input_tokens || usage.input_tokens_details?.cached_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const providerCostUsd = (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
  const result:JobGenerationResponse = {
    document,
    usage: {
      mode: provider, billingMode:isByok?'byok':'managed', model: typeof raw.model === 'string' ? raw.model : model, responseId: typeof raw.id === 'string' ? raw.id : null,
      inputTokens, cachedInputTokens, outputTokens, totalTokens: inputTokens + cachedInputTokens + outputTokens,
      providerCostUsd, credits:isByok?0:1, customerChargeSgd:isByok?0:DOCBEANS_PRICE_SGD,
    },
    notice:isByok?'BYOK generation: your AI provider bills this model usage directly. No DocBeans AI credit was consumed.':undefined,
  };
  logGeneration('info', { event:'generation_completed', requestId, status:200, durationMs:Date.now() - startedAt, mode:result.usage.mode, model:result.usage.model, qualityStatus:document.quality.status, qualityScore:document.quality.score, responsibilityCount:document.responsibilities.length, totalTokens:result.usage.totalTokens, credits:result.usage.credits });
  return Response.json(result, { headers:{'X-Request-ID':requestId} });
}
