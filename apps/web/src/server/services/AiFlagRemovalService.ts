import type { OpenAI } from "openai";

export class AIFlagRemovalService {
  constructor(private openai: OpenAI) {}

  async removeFlagFromCode(code: string, flagName: string) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert in code refactoring and have been assigned to update a codebase to remove calls to the useFeatureFlag hook where the parameter is ${flagName}. Your task is to ensure that all code paths that depend on the truthiness of this hook are always executed. But don't just replace the result of the function with true but rather remove the variable (if used). and update the code as if there was never a flag that prevented certain paths. You should only include the code without any other information or formatting. You should never update any other code that isnt related to the flag with the name ${flagName}. You should keep the formatting and line ending of the original code.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: code,
            },
          ],
        },
      ],
      temperature: 1,
      max_tokens: 16383,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    return response.choices[0]?.message.content;
  }
}
