

import { ITool, MyOllama } from '../tools';

import { runWithProgress } from './runWithProgress';

export type AskOptions = {
  ollamaInstance: MyOllama,
  prompt: string,
  question: string,
  context?: string,
  tools?: ITool[],
};

//
//
//

//
//
//

//
//
//

const _mistralSyntax = ({
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

//
//
//

const _llamaSyntax = ({
  prompt,
  question,
  context,
  tools,
}: AskOptions): string => {

  let completePrompt = "";

  const hasTools = (tools && tools.length > 0);

  completePrompt += `
    <|begin_of_text|>

    <|start_header_id|>system<|end_header_id|>

    Cutting Knowledge Date: December 2023
    Today Date: 23 July 2024
  `;

  if (hasTools) {
    completePrompt += `You are a helpful assistant with tool calling capabilities.`;
  } else {
    completePrompt += `You are a helpful assistant.`;
  }

  completePrompt += `

    ${prompt}

    <|eot_id|>
    <|start_header_id|>user<|end_header_id|>
  `;

  if (context) {
    completePrompt += `
      Context: ${context}
    `;
  }


  if (hasTools) {
    completePrompt += `
      Given the following functions, please respond with a JSON for a function call with its proper arguments that best answers the given prompt.

      Respond in the format {"name": function name, "arguments": dictionary of argument name and its value}. Do not use variables.

      ${JSON.stringify(tools)}
    `;
  }

  completePrompt += `

    Question:
    ${question}

    <|eot_id|>
    <|start_header_id|>assistant<|end_header_id|>
  `;

  return completePrompt;
};

//
//
//

//
//
//

//
//
//

export const askSomething = async ({
  ollamaInstance,
  prompt,
  question,
  context,
  tools,
}: AskOptions): Promise<string> => {

  console.log(`\nQUESTION:\n -> "${question}"`);

  let completePrompt: string = '';
  if (ollamaInstance.generationModel.indexOf('mistral') >= 0) {
    completePrompt = _mistralSyntax({ ollamaInstance, prompt, question, context, tools });
  }
  else if (ollamaInstance.generationModel.indexOf('llama') >= 0) {
    completePrompt = _llamaSyntax({ ollamaInstance, prompt, question, context, tools });
  }

  console.log(`
####
#########
################## PROMPT ######################
"${completePrompt}"
################## PROMPT ######################
#########
####
`)

  const response = await runWithProgress(() => ollamaInstance.generate(completePrompt));

  console.log(`\n[RESPONSE]\n"${response}"\n[/RESPONSE]\n`);

  return response;
};

