
import { ITool, MyOllama, asToolCalls, IToolUse } from '../utilities';
import { askSomething } from './askSomething';

interface IAgentWorkflowQuestionsDef {
  ollamaInstance: MyOllama,
  tools: ITool[],
  toolsMap: Map<string, (options: IToolUse) => Promise<string | undefined>>,
  question: string
}

export const askAgentWorkflowSomething = async ({
  ollamaInstance,
  tools,
  toolsMap,
  question,
}: IAgentWorkflowQuestionsDef): Promise<string[]> => {

  const response = await askSomething({
    ollamaInstance,
    prompt: `determine which tools to use, don't answer anything else. just give the tool calls`,
    question: question,
    tools,
  });

  const allToolCalls = asToolCalls(response);

  console.log('allToolCalls', allToolCalls);

  const responses: string[] = [];

  for (const currCall of allToolCalls) {
    // console.log(currCall);

    const currTool = toolsMap.get(currCall.name);
    if (!currTool) {
      continue; // tool not found -> skip
    }

    console.log(`\nTOOL CALL: "${JSON.stringify(currCall)}"\n`);

    const response = await currTool(currCall);
    if (response) {
      responses.push(response);
    }

  }

  return responses;
};
