import { ITool, IToolUse } from "../../utilities";
import { AskReturnVal } from "../AskReturnVal";
import { ToolContext } from "./ToolContext";
import { ToolImplType } from "./ToolImplType";

export const determine_relevant_memory_def: ITool = {
  type: "function",
  function: {
    name: "determine_relevant_memory",
    description: "Determine if a message is interesting to memorize",
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

export const determine_relevant_memory_impl: ToolImplType = async (
  toolContext: ToolContext,
  options: IToolUse,
): Promise<AskReturnVal> => {

  console.log(options);

  if (typeof(options.arguments.message) !== 'string') {
    return {
      type: 'response',
      data: 'the "message" argument is missing.\ncould not invoke the "determine_relevant_memory" tool'
    };
  }

  const response = await toolContext.myQueryHandler.askSomething({
    prompt: [
      "You must determine if the context is worth being remembered",
      "We want to remember any personal information or topic about the user",
      "Do not use tools",
      "Only answer the 'Y' or 'N'.",
    ].join('\n'),

    context: options.arguments.message,

    question: "is the context worth being remembered?",
  }, {
    temperature: 0,
    num_predict: 1,
  });

  if (response.type !== 'response') {
    return {
      type: 'response',
      data: 'the "determine_relevant_memory" tool response is incorrect -> failure'
    };
  }

  console.log('response', response);

  return response;
};
