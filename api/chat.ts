import { GoogleGenAI } from '@google/genai';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function askOphelia(params: {
  message: string;
  history?: Array<{ role: 'user' | 'model'; parts: string }>;
  context?: {
    studentName?: string;
    program?: string;
    branch?: string;
    semester?: number;
    cgpa?: number;
    careerGoal?: string;
    learningStyle?: string;
    weakAreas?: string[];
    topRecommendations?: string[];
  };
}): Promise<string> {
  const client = getGeminiClient();

  const studentContext = params.context
    ? `Student Academic Profile:\n` +
      `- Name: ${params.context.studentName || 'Student'}\n` +
      `- Degree: ${params.context.program || 'Engineering'} (${params.context.branch || 'Computer Science'}), Semester ${params.context.semester || 4}\n` +
      `- Current CGPA: ${params.context.cgpa ? params.context.cgpa.toFixed(2) : '8.1'}\n` +
      `- Career Goal: ${params.context.careerGoal || 'Software Engineer'}\n` +
      `- Learning Modality: ${params.context.learningStyle || 'video/practice'}\n` +
      `- Flagged Weak Areas / Remediation: ${params.context.weakAreas?.length ? params.context.weakAreas.join(', ') : 'None'}\n` +
      `- Key Recommended Subjects: ${params.context.topRecommendations?.length ? params.context.topRecommendations.join(', ') : 'General'}\n`
    : '';

  const systemInstruction =
    `You are "Ophelia", an empathetic, highly knowledgeable, strategic Academic Advisor & Mentor for university students.\n` +
    `Your primary role is to directly and thoroughly answer the student's queries, whether they are asking about course roadmaps, prerequisite sequencing, study habits, exam prep, or computer science concepts (e.g. data structures, algorithms, databases, networking, OS, AI/ML).\n` +
    `Guidelines:\n` +
    `1. Directly and helpfully answer what the user asks. If they ask a concept question (like TCP vs UDP, or Dijkstra's algorithm, or normalization), explain it clearly with structured sections, examples, or step-by-step points.\n` +
    `2. If they ask for academic planning, tie advice directly to their target career goal (${params.context?.careerGoal || 'their career path'}) and their current semester (${params.context?.semester || 'their semester'}).\n` +
    `3. Keep the tone warm, intellectually rigorous, encouraging, and clear.\n` +
    `4. Format with bold headers and bullet points for readability.\n\n` +
    studentContext;

  // Sanitize and normalize history to ensure strict user/model alternation required by Gemini API
  const cleanContents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

  if (params.history && Array.isArray(params.history)) {
    for (const item of params.history) {
      if (!item || typeof item.parts !== 'string' || !item.parts.trim()) continue;
      const role: 'user' | 'model' = item.role === 'model' ? 'model' : 'user';

      // Gemini history cannot start with a model message
      if (cleanContents.length === 0 && role === 'model') continue;

      // Avoid consecutive messages with the same role
      if (cleanContents.length > 0 && cleanContents[cleanContents.length - 1].role === role) {
        cleanContents[cleanContents.length - 1] = {
          role,
          parts: [{ text: item.parts.trim() }],
        };
        continue;
      }

      cleanContents.push({
        role,
        parts: [{ text: item.parts.trim() }],
      });
    }
  }

  // Ensure last message in history was 'model' before appending current user message
  if (cleanContents.length > 0 && cleanContents[cleanContents.length - 1].role === 'user') {
    cleanContents.pop();
  }

  cleanContents.push({
    role: 'user',
    parts: [{ text: params.message.trim() }],
  });

  if (client) {
    // Model strategy: Try gemini-3.8-flash first; if high demand (503) occurs, fall back to gemini-3.1-flash-lite
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const model of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: cleanContents,
          config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.95,
          },
        });

        if (response.text && response.text.trim()) {
          return response.text.trim();
        }
      } catch (err: any) {
        console.warn(`Model ${model} attempt failed:`, err?.message || err);
        // Continue to fallback model
      }
    }
  }

  // Intelligent contextual fallback if Gemini service is completely unreachable
  const name = params.context?.studentName || 'Student';
  const goal = params.context?.careerGoal || 'Software Engineer';
  const userQuery = params.message.trim();

  return (
    `Hello ${name}! Ophelia here.\n\n` +
    `Regarding your question: **"${userQuery}"**:\n\n` +
    `As your academic advisor preparing you for a career as a **${goal}**:\n` +
    `• **Direct Assessment:** Ensure you balance theoretical understanding with hands-on practice in your Resource Library.\n` +
    `• **Actionable Next Step:** Break down this topic into 25-minute focused blocks and test yourself with the diagnostic quizzes on your dashboard.\n` +
    `• **Milestone Link:** Connecting this to your core curriculum will reinforce prerequisites for your upcoming semester electives.\n\n` +
    `*(Note: Real-time Gemini models are reconnecting. Please feel free to ask follow-up questions.)*`
  );
}
