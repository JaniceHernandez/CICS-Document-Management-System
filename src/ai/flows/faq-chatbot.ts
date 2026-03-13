'use server';
/**
 * @fileOverview An AI-powered chatbot for students to get answers to their questions.
 *
 * - askChatbot - A function that handles the student's question and returns an AI-generated answer.
 * - StudentQuestionInput - The input type for the askChatbot function.
 * - ChatbotAnswerOutput - The return type for the askChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentQuestionInputSchema = z.object({
  question: z.string().describe("The student's question to the chatbot."),
});
export type StudentQuestionInput = z.infer<typeof StudentQuestionInputSchema>;

const ChatbotAnswerOutputSchema = z.string().describe('The AI-generated answer to the student question.');
export type ChatbotAnswerOutput = z.infer<typeof ChatbotAnswerOutputSchema>;

export async function askChatbot(input: StudentQuestionInput): Promise<ChatbotAnswerOutput> {
  return studentFaqChatbotFlow(input);
}

const studentFaqChatbotPrompt = ai.definePrompt({
  name: 'studentFaqChatbotPrompt',
  input: {schema: StudentQuestionInputSchema},
  output: {schema: ChatbotAnswerOutputSchema},
  prompt: `You are the official CICS Virtual Assistant for the COLLEGE OF INFORMATICS AND COMPUTING STUDIES (CICS) DOCUMENT MANAGEMENT SYSTEM.

Your primary goal is to help students navigate the system and understand university/departmental filing policies.

### Context for Your Knowledge:
1. **Institutional Library**: This is the repository for official CICS resources like curriculum checklists, syllabi, and departmental guides. These are provided by Administrators.
2. **My Submissions**: This portal is for students to file **Required Documents** (e.g., Capstone requirements, internship forms, official filings). It is NOT for contributing academic content to the library.
3. **Privacy**: Students can only see their own filed requirements. Administrators review these filings for institutional compliance.
4. **Programs**: We support BSCS, BSIS, and BSIT programs. Documents are often filtered by these program affiliations.

### Tone and Guidelines:
- Be professional, helpful, and institutional.
- If a student asks how to submit a requirement, direct them to "My Submissions" -> "New Submission".
- If a student asks for a checklist or form, tell them to check the "Institutional Library".
- Emphasize that "My Submissions" is for official filings reviewed by the CICS office.
- If you don't know an answer, politely direct them to the CICS office at computerstudies@neu.edu.ph or visit the Main Building, 4th Floor.

Student's question: {{{question}}}`,
});

const studentFaqChatbotFlow = ai.defineFlow(
  {
    name: 'studentFaqChatbotFlow',
    inputSchema: StudentQuestionInputSchema,
    outputSchema: ChatbotAnswerOutputSchema,
  },
  async input => {
    const {output} = await studentFaqChatbotPrompt(input);
    return output!;
  }
);
