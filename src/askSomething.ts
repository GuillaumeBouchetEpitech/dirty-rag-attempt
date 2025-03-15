

import { ITool, MyOllama } from './MyOllama';


export type AskOptions = {
  ollamaInstance: MyOllama,
  prompt: string,
  question: string,
  context?: string,
  tools?: ITool[],
};

export const askSomething = async ({
  ollamaInstance,
  prompt,
  question,
  context,
  tools,
}: AskOptions): Promise<string> => {

  console.log(`\nQUESTION:\n -> "${question}"`)

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

  console.log(`
####
#########
################## PROMPT ######################
"${completePrompt}"
################## PROMPT ######################
#########
####
`)

  // const startTime = Date.now();

  const response = await ollamaInstance.generate(completePrompt);

  // const stopTime = Date.now();
  // const deltaTime = stopTime - startTime;

  console.log(`\n[RESPONSE]\n"${response}"\n[/RESPONSE]\n`)
  // console.log(`\ntime elapsed: ${deltaTime}ms (${deltaTime / 1000}s)\n`);

  return response;
};

