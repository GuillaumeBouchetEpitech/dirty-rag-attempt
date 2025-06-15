import { IToolUse, MyOllama, MyVectorStore } from "../utilities";
import { AskReturnVal, ResponseReturnVal } from "./AskReturnVal";
import { ToolContext } from "./my-tools/ToolContext";
import { ToolImplType } from "./my-tools/ToolImplType";
import { OllamaQueryHandler } from "./OllamaQueryHandler";


export const handleResponseLoop = async (
  toolContext: ToolContext,
  allResponses: AskReturnVal[],
): Promise<ResponseReturnVal[]> => {

  const collectFinalResponses: ResponseReturnVal[] = [];

  while (allResponses.length > 0) {

    const currResponse = allResponses.shift();

    if (!currResponse) {
      break;
    }

    if (currResponse.type === 'response') {
      collectFinalResponses.push(currResponse);
      continue;
    }

    if (currResponse.type !== 'tool_use') {
      continue;
    }

    for (const currToolCall of currResponse.data) {

      const currTool = toolContext.toolsMap.get(currToolCall.name);
      if (!currTool) {
        throw new Error(`the tool "${currToolCall.name}" was not found`);
        // continue; // tool not found -> skip
      }

      const latestResponse = await currTool(
        toolContext,
        currToolCall,
      );

      allResponses.push(latestResponse);
    }
  }

  return collectFinalResponses;
}

