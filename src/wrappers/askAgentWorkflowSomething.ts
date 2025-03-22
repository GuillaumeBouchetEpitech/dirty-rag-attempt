
import { ITool, MyOllama, asToolCalls, IToolUse } from '../tools';
import { askSomething } from './askSomething';

export const askAgentWorkflowSomething = async (
  myOllama: MyOllama,
  tools: ITool[],
  toolsMap: Map<string, (options: IToolUse) => Promise<string | undefined>>,
  question: string
): Promise<string[]> => {

  const response = await askSomething({
    ollamaInstance: myOllama,
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
