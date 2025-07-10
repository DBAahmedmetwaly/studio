"use server";

import { analyzeJournalEntries } from "@/ai/flows/financial-analysis";
import { z } from "zod";

const JournalEntriesSchema = z.object({
  journalEntries: z.string().min(50, "Please provide more detailed journal entries for a better analysis."),
});

type State = {
  message?: string | null;
  suggestions?: string | null;
  issues?: string[];
};

export async function getFinancialAnalysis(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = JournalEntriesSchema.safeParse({
    journalEntries: formData.get("journalEntries"),
  });

  if (!validatedFields.success) {
    return {
      issues: validatedFields.error.flatten().fieldErrors.journalEntries,
      message: "There was an error with your submission.",
    };
  }

  try {
    const result = await analyzeJournalEntries(validatedFields.data);
    return {
      message: "Analysis successful.",
      suggestions: result.suggestions,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "Failed to get analysis. Please try again later.",
    };
  }
}
