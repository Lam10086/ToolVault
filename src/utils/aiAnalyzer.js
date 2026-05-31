/**
 * AI-powered resource analysis using DeepSeek (or any OpenAI-compatible API).
 * 
 * Given a URL, it asks the AI to research the tool and return a structured
 * card data object ready to fill in the AddResourceModal form.
 */

const DEFAULT_API_BASE = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-chat';

function getAIConfig() {
  try {
    const stored = localStorage.getItem('tv-ai-config');
    if (stored) return JSON.parse(stored);
  } catch {}
  return { apiKey: '', apiBase: DEFAULT_API_BASE, model: DEFAULT_MODEL };
}

export function hasAIConfig() {
  const config = getAIConfig();
  return !!(config.apiKey && config.apiKey.trim());
}

const ANALYSIS_PROMPT = (url) => `
You are a professional software tool researcher. Analyze the following tool/resource URL and return structured data.

URL: ${url}

Research this tool thoroughly based on your knowledge. Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "title": "Official tool name",
  "description": "One clear sentence about what this tool does",
  "purpose": "One sentence: who needs it and why (the value it provides)",
  "scenario": "2-3 typical use cases, comma separated",
  "diffValue": "What makes this tool stand out vs competitors? Key differentiator",
  "pitfalls": "Known limitations, pricing gotchas, or user complaints if any",
  "rating": 4.2,
  "pricings": [
    {"type": "free", "model": "Free tier", "priceNum": 0, "currency": "$"},
    {"type": "subscription", "model": "Pro", "priceNum": 20, "currency": "$"}
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "url": "${url}"
}

For pricings: type must be "free", "subscription", or "one-time". Only include real pricing tiers.
For rating: estimate based on general community reception, 1.0-5.0.
For tags: 3-5 descriptive tags in Chinese (e.g. "在线可用", "免安装", "中文界面", "开源项目").
Keep all text responses in Chinese except for proper nouns and technical terms.
`;

export async function analyzeUrlWithAI(url) {
  const config = getAIConfig();
  
  if (!config.apiKey || !config.apiKey.trim()) {
    throw new Error('请先在设置中配置 AI API Key');
  }

  const apiBase = (config.apiBase || DEFAULT_API_BASE).replace(/\/$/, '');
  const model = config.model || DEFAULT_MODEL;

  const response = await fetch(`${apiBase}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a software tool researcher. Always respond with valid JSON only, no markdown code blocks.'
        },
        {
          role: 'user',
          content: ANALYSIS_PROMPT(url)
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 请求失败 (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) throw new Error('AI 返回了空内容');

  // Clean up potential markdown code blocks
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  try {
    const parsed = JSON.parse(cleaned);
    // Ensure pricings have IDs
    if (parsed.pricings) {
      parsed.pricings = parsed.pricings.map((p, i) => ({ ...p, id: Date.now() + i }));
    }
    return parsed;
  } catch {
    throw new Error('AI 返回数据格式有误，请重试');
  }
}
