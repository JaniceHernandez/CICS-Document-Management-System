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
  prompt: `You are an AI-powered chatbot for the College of Informatics and Computer Studies (CICS) Document Management App.
Your purpose is to assist students by answering their questions about documents, university policies, and common issues.
Provide clear, concise, and helpful answers based on available information.
If you don't know the answer to a specific query, politely state that you cannot assist with that specific query.

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
