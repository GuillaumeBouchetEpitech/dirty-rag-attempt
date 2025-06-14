
import { AskOptions } from "./AskOptions"

export const _mistralSyntax = ({
  prompt,
  question,
  context,
  tools,
}: AskOptions): string => {

  let completePrompt = "";

  if (tools && tools.length > 0) {
    completePrompt += `[AVAILABLE_TOOLS]`;
    completePrompt += JSON.stringify(tools);
    completePrompt += `[/AVAILABLE_TOOLS]`;
  }

  completePrompt += `\n`;
  completePrompt += `[INSTRUCTION]\n`;
  completePrompt += `\n`;
  completePrompt += `${prompt}\n`;
  completePrompt += `\n`;

  if (context) {
    completePrompt += `CONTEXT:\n`;
    completePrompt += `\n`;
    completePrompt += `${context}\n`;
  }

  completePrompt += `\n`;
  completePrompt += `QUESTION:\n`;
  completePrompt += `\n`;
  completePrompt += `${question}\n`;
  completePrompt += `\n`;
  completePrompt += `[/INSTRUCTION]\n`;
  completePrompt += `\n`;

  return completePrompt;
};
