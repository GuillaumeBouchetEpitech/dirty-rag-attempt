

// import { ITool, MyOllama } from '../tools';

import { AskOptions } from './AskOptions';

import { _mistralSmallSyntax } from './askSomething-mistral-small';
import { _mistralSyntax } from './askSomething-mistral';
import { _llamaSyntax } from './askSomething-llama';

import { runWithProgress } from './runWithProgress';
import { OllamaOptions } from '../utilities';

//
//
//

//
//
//

//
//
//

export const askSomething = async (
  {
    ollamaInstance,
    prompt,
    question,
    context,
    tools,
  }: AskOptions,
  ollamaOptions?: OllamaOptions
): Promise<string> => {

  console.log(`######################################################################################`);
  console.log(`######################################################################################`);
  console.log(`######################################################################################`);
  console.log(`\nQUESTION:\n -> "${question}"`);

  let completePrompt: string = '';
  if (ollamaInstance.generationModel.indexOf('mistral-small') >= 0) {
    completePrompt = _mistralSmallSyntax({ ollamaInstance, prompt, question, context, tools });
  }
  else if (ollamaInstance.generationModel.indexOf('mistral') >= 0) {
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
`);

  const response = await runWithProgress(
    () => ollamaInstance.generate(
      completePrompt,
      ollamaOptions
    )
  );

  console.log(`\n[RESPONSE]\n"${response}"\n[/RESPONSE]\n`);

  return response;
};

