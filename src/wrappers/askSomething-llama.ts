
import { AskOptions } from "./AskOptions"

export const _llamaSyntax = ({
  prompt,
  question,
  context,
  tools,
}: AskOptions): string => {

  let completePrompt = "";

  const hasTools = (tools && tools.length > 0);

  completePrompt += `<|begin_of_text|>\n`;
  completePrompt += `<|start_header_id|>system<|end_header_id|>\n`;
  completePrompt += `Cutting Knowledge Date: December 2023\n`;
  completePrompt += `Today Date: 23 July 2024\n`;

  // if (hasTools) {
  //   completePrompt += `You are a helpful assistant with tool calling capabilities.\n`;
  // } else {
  //   completePrompt += `You are a helpful assistant.\n`;
  // }

  completePrompt += `${prompt}\n`;

  completePrompt += `<|eot_id|>\n`;
  completePrompt += `<|start_header_id|>user<|end_header_id|>\n`;

  if (context) {
    completePrompt += `Context: ${context}\n`;
  }

  if (hasTools) {
    completePrompt += `Given the following functions, please respond with a JSON for a function call with its proper arguments that best answers the given prompt.\n`;
    completePrompt += `Respond in the format {"name": function name, "arguments": dictionary of argument name and its value}. Do not use variables.\n`;
    completePrompt += JSON.stringify(tools);;
  }

  completePrompt += `Question:\n`;
  completePrompt += question;;

  completePrompt += `<|eot_id|>\n`;
  completePrompt += `<|start_header_id|>assistant<|end_header_id|>\n`;

  return completePrompt;
};
