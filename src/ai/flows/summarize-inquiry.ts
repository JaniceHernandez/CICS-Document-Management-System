'use server';
/**
 * @fileOverview An AI agent for summarizing student inquiries.
 *
 * - summarizeInquiry - A function that handles the inquiry summarization process.
 * - SummarizeInquiryInput - The input type for the summarizeInquiry function.
 * - SummarizeInquiryOutput - The return type for the summarizeInquiry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeInquiryInputSchema = z
  .string()
  .describe('The full text content of the student inquiry to be summarized.');
export type SummarizeInquiryInput = z.infer<typeof SummarizeInquiryInputSchema>;

const SummarizeInquiryOutputSchema = z
  .string()
  .describe('A brief, concise summary of the student inquiry.');
export type SummarizeInquiryOutput = z.infer<typeof SummarizeInquiryOutputSchema>;

export async function summarizeInquiry(input: SummarizeInquiryInput): Promise<SummarizeInquiryOutput> {
  return summarizeInquiryFlow(input);
}

const summarizeInquiryPrompt = ai.definePrompt({
  name: 'summarizeInquiryPrompt',
  input: {schema: SummarizeInquiryInputSchema},
  output: {schema: SummarizeInquiryOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing student inquiries from the College of Informatics and Computer Studies (CICS).
Your goal is to provide a brief, concise summary of the provided inquiry text, highlighting the key points, main question, or core issue.

Inquiry Text:
"""{{{this}}}"""

Provide a summary that is no more than 3-4 sentences long and directly addresses the essence of the inquiry.`,
});

const summarizeInquiryFlow = ai.defineFlow(
  {
    name: 'summarizeInquiryFlow',
    inputSchema: SummarizeInquiryInputSchema,
    outputSchema: SummarizeInquiryOutputSchema,
  },
  async input => {
    const {output} = await summarizeInquiryPrompt(input);
    return output!;
  }
);
