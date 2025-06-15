import { ITool, IToolUse } from "../../utilities";
import { AskReturnVal } from "../AskReturnVal";
import { ToolContext } from "./ToolContext";
import { ToolImplType } from "./ToolImplType";

export const decompose_relevant_memory_def: ITool = {
  type: "function",
  function: {
    name: "decompose_relevant_memory",
    description: "Decompose a message in chunks of interesting chunks to memorize",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The message to inspect"
        },
      },
      required: ["message"]
    }
  }
};

export const decompose_relevant_memory_impl: ToolImplType = async (
  toolContext: ToolContext,
  options: IToolUse,
): Promise<AskReturnVal> => {

  console.log(options);

  if (typeof(options.arguments.message) !== 'string') {
    return {
      type: 'response',
      data: 'the "message" argument is missing.\ncould not invoke the "decompose_relevant_memory" tool'
    };
  }

  const response = await toolContext.myQueryHandler.askSomething({
    prompt: [
      "Do not answer the question.",
      "Use the context to extract any personal information or topic about the user.",
      "Separate and list the multiples topics and values in the context.",
      `Respond in the format [{"topic": 'the topic name', "value": 'something about about the topic' }].`,
      "Always return as a JSON array.",
      "Do not use variables.",
      // "Only reply in JSON.",
    ].join('\n'),

    context: options.arguments.message,

    question: "Inspect the context",
  }, {
    temperature: 0,
    // num_predict: 1,
  });

  if (response.type !== 'response') {
    return {
      type: 'response',
      data: 'the "decompose_relevant_memory" tool response is incorrect -> failure'
    };
  }

  console.log('response', response);

  return response;
};
