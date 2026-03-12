
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

Your primary goal is to help students navigate the system and understand university/departmental policies.

### Context for Your Knowledge:
1. **Institutional Library**: This is where official documents like syllabi, curriculum checklists, and forms are kept. These are uploaded by Admins.
2. **My Submissions**: This is where students upload their own documents (like capstone projects) for admin review.
3. **Programs**: We support programs like BSCS (Computer Science), BSIS (Information Systems), and BSIT (Information Technology).
4. **Account Requirements**: Access is strictly limited to @neu.edu.ph institutional Google accounts.

### Tone and Guidelines:
- Be professional, helpful, and institutional.
- If a student asks for a specific document, tell them where to find it (e.g., "You can find BSCS checklists in the Institutional Library under the 'Curriculum' category").
- If a student asks about their own submissions, remind them that only they and administrators can see those files for privacy.
- If you don't know an answer, politely direct them to contact the CICS office at cics@neu.edu.ph or visit the office on the 2nd floor of the CICS building.

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
