import { GoogleGenAI } from '@google/genai';

/**
 * Initializes the official Google GenAI client using process.env.GEMINI_API_KEY.
 * Never hardcodes or exposes keys to the client.
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured in the server environment. ' +
      'Please add GEMINI_API_KEY in Vercel: Project Settings > Environment Variables, then trigger a redeploy.'
    );
  }

  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface UserContext {
  studentName?: string;
  program?: string;
  branch?: string;
  semester?: number | string;
  cgpa?: number | string;
  careerGoal?: string;
  learningStyle?: string;
  weakAreas?: string[];
  topRecommendations?: string[];
  [key: string]: any;
}

export interface AskOpheliaParams {
  message: string;
  history?: Array<{ role: 'user' | 'model'; parts: string }>;
  userContext?: UserContext;
  context?: UserContext; // alias for backwards compatibility
}

/**
 * Core Ophelia reasoning function using @google/genai.
 * Formats student context, validates alternating user/model turns,
 * and uses primary model with active fallbacks.
 */
export async function askOphelia(params: AskOpheliaParams): Promise<string> {
  const ai = getGeminiClient();
  const ctx = params.userContext || params.context || {};

  const name = ctx.studentName || 'Student';
  const program = ctx.program || 'B.Tech';
  const branch = ctx.branch || 'Computer Science & Engineering';
  const semester = ctx.semester || 4;
  const cgpa = ctx.cgpa || '8.42';
  const careerGoal = ctx.careerGoal || 'AI/ML Engineer';
  const learningStyle = ctx.learningStyle || 'video/practice';
  const weakAreas = Array.isArray(ctx.weakAreas) && ctx.weakAreas.length
    ? ctx.weakAreas.join(', ')
    : 'None currently flagged';
  const recommendations = Array.isArray(ctx.topRecommendations) && ctx.topRecommendations.length
    ? ctx.topRecommendations.join(', ')
    : 'Core Computer Science curriculum';

  const systemInstruction =
    `You are "Ophelia", an empathetic, highly knowledgeable, and strategic Academic and Career Advisor for university engineering students.\n` +
    `Your goal is to directly and thoroughly answer the student's questions, guide them on course selection, study strategies, prerequisite sequencing, weak-area remediation, concept explanations, and career roadmap milestones.\n\n` +
    `Current Student Context:\n` +
    `- Name: ${name}\n` +
    `- Program: ${program} in ${branch}, Semester ${semester}\n` +
    `- Current CGPA: ${cgpa}\n` +
    `- Target Career Goal: ${careerGoal}\n` +
    `- Learning Modality: ${learningStyle}\n` +
    `- Flagged Weak Areas / Focus Units: ${weakAreas}\n` +
    `- Top Recommended Courses: ${recommendations}\n\n` +
    `Guidelines:\n` +
    `1. Directly and helpfully answer whatever the student asks. If they ask a conceptual question (e.g. data structures, algorithms, databases, machine learning, systems), explain it clearly with structured sections, real-world examples, or step-by-step logic.\n` +
    `2. If they ask about study priorities, schedule, or career progression, tie your advice directly to their target career goal (${careerGoal}), their coursework, and academic standing.\n` +
    `3. Maintain an encouraging, intellectually rigorous, and structured tone.\n` +
    `4. Format with markdown bolding, bullet points, and numbered steps for high readability.\n` +
    `5. Keep answers focused and actionable (typically 150-300 words unless more detail is requested).`;

  // Sanitize history so that Gemini API receives strict user -> model alternating turns
  const cleanContents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

  if (params.history && Array.isArray(params.history)) {
    for (const h of params.history) {
      if (!h || typeof h.parts !== 'string' || !h.parts.trim()) continue;
      const role: 'user' | 'model' = h.role === 'model' ? 'model' : 'user';

      // Gemini history cannot start with a model message
      if (cleanContents.length === 0 && role === 'model') continue;

      // Do not allow consecutive turns with the same role
      if (cleanContents.length > 0 && cleanContents[cleanContents.length - 1].role === role) {
        cleanContents[cleanContents.length - 1] = {
          role,
          parts: [{ text: h.parts.trim() }],
        };
        continue;
      }

      cleanContents.push({
        role,
        parts: [{ text: h.parts.trim() }],
      });
    }
  }

  // Ensure last turn before new user message was model
  if (cleanContents.length > 0 && cleanContents[cleanContents.length - 1].role === 'user') {
    cleanContents.pop();
  }

  cleanContents.push({
    role: 'user',
    parts: [{ text: params.message.trim() }],
  });

  // Model hierarchy:
  // Primary: 'gemini-3.8-flash' (or custom process.env.GEMINI_MODEL)
  // Fallbacks: 'gemini-3.1-flash-lite', 'gemini-flash-latest'
  const customModel = process.env.GEMINI_MODEL?.trim();
  const modelsToTry = [
    ...(customModel ? [customModel] : []),
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: cleanContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      if (response && response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Ophelia] Model ${model} failed, trying next available model:`, err?.message || err);
    }
  }

  throw lastError || new Error('No response was generated by available Gemini models.');
}

/**
 * Safely parses request body for Vercel Serverless Function & Node.js HTTP.
 */
async function parseRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Vercel Serverless Function entry point (/api/chat).
 * Handles CORS preflight, enforces POST method, and returns real JSON error on failure.
 */
export default async function handler(req: any, res: any) {
  // 1. CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // 2. Enforce POST
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: `Method ${req.method} Not Allowed. Only POST is supported.`,
      })
    );
  }

  // 3. Process chat query
  try {
    const body = await parseRequestBody(req);
    const { message, history, userContext, context } = body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({ error: 'Field "message" (string) is required in request body.' })
      );
    }

    const reply = await askOphelia({
      message: message.trim(),
      history,
      userContext: userContext || context,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ reply }));
  } catch (error: any) {
    console.error('[Ophelia /api/chat error]:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: error?.message || 'Internal server error while processing request with Ophelia.',
      })
    );
  }
}
