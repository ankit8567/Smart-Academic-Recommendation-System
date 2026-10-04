import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
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

  if (!client) {
    // Intelligent fallback advisor response when GEMINI_API_KEY secret is not yet attached
    const name = params.context?.studentName || 'Student';
    const goal = params.context?.careerGoal || 'Software Engineering / Data Science';
    const weak = params.context?.weakAreas?.length
      ? params.context.weakAreas.join(', ')
      : 'core foundation subjects';

    return (
      `Hello ${name}! I'm Ophelia, your academic mentor.\n\n` +
      `I'm currently tracking your pathway toward becoming a **${goal}**. ` +
      `Based on your transcript and syllabus diagnostics, our immediate priority is reinforcing ${weak}.\n\n` +
      `Here is my advice on "${params.message}":\n` +
      `1. Focus on prerequisite topics first—mastering core fundamentals makes higher-level units much easier.\n` +
      `2. Schedule 2–3 active practice hours using the verified labs in your Resource Library.\n` +
      `3. Complete the diagnostic checkpoint quizzes to measure your retention!\n\n` +
      `*(Note: To unlock live AI responses powered by Gemini 3.8 Flash, connect your Gemini API Key in AI Studio Settings > Secrets.)*`
    );
  }

  const studentContext = params.context
    ? `Current Student Context:\n` +
      `- Name: ${params.context.studentName || 'Unknown'}\n` +
      `- Degree: ${params.context.program || ''} in ${params.context.branch || ''} (Semester ${params.context.semester || ''})\n` +
      `- CGPA: ${params.context.cgpa || ''}\n` +
      `- Target Career Goal: ${params.context.careerGoal || ''}\n` +
      `- Preferred Learning Modality: ${params.context.learningStyle || 'video/practice'}\n` +
      `- Flagged Weak Areas: ${params.context.weakAreas?.join(', ') || 'None'}\n` +
      `- Current Top Course Recommendations: ${params.context.topRecommendations?.join(', ') || 'General'}\n`
    : '';

  const systemInstruction =
    `You are "Ophelia", an empathetic, highly knowledgeable, and strategic Academic Advisor & Mentor for college students.\n` +
    `Your goal is to guide students on course selection, study strategies, prerequisite sequencing, weak-area remediation, and career roadmap milestones.\n` +
    `Tone: Encouraging, rigorous, concise, structured, and insightful.\n` +
    `Guidelines:\n` +
    `- Refer to the student by name if known.\n` +
    `- Give actionable, realistic college advice with clear bullet points or numbered steps.\n` +
    `- Ground your answers in their specific career goal and academic standing.\n` +
    `- Keep answers focused (under 250 words unless detail is requested).\n\n` +
    studentContext;

  const chatContents = [];

  if (params.history && params.history.length > 0) {
    for (const h of params.history.slice(-8)) {
      chatContents.push({
        role: h.role,
        parts: [{ text: h.parts }],
      });
    }
  }

  chatContents.push({
    role: 'user',
    parts: [{ text: params.message }],
  });

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    if (response.text) {
      return response.text;
    }
  } catch (err: any) {
    console.warn('Gemini generateContent temporary error:', err?.message || err);
    // If the model experiences a temporary spike (e.g. 503 / high demand), generate intelligent academic advice
    const name = params.context?.studentName || 'Student';
    const goal = params.context?.careerGoal || 'Software Engineer';
    const weak = params.context?.weakAreas?.length
      ? params.context.weakAreas.join(', ')
      : 'core prerequisites';

    return (
      `Hello ${name}! Ophelia here.\n\n` +
      `Regarding your inquiry on "${params.message}" toward becoming a **${goal}**:\n\n` +
      `1. **Prerequisite First:** Ensure you have completed foundational units before advancing to higher-level electives (especially in ${weak}).\n` +
      `2. **Targeted Practice:** Devote 45 minutes daily to problem-solving in your weak areas to boost your academic readiness score.\n` +
      `3. **Milestone Tracking:** Mark unit topics complete as you finish them on your Learning Path roadmap.\n\n` +
      `*(Note: Connected to Gemini 3.8 Flash; upstream servers reported a temporary demand spike, so this structured academic guidance was generated for your continuity.)*`
    );
  }

  return "I'm sorry, I couldn't generate advice at this moment. Please try asking again.";
}
