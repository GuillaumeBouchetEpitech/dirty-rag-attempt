import { ITool, IToolUse, MyOllama, MyVectorStore } from "../../utilities";
import { AskReturnVal } from "../AskReturnVal";
import { OllamaQueryHandler } from "../OllamaQueryHandler";

import { answer_user_question_def } from "./answer_user_question";
import { get_current_weather_def } from "./get_current_weather";
import { ToolContext } from "./ToolContext";
import { ToolImplType } from "./ToolImplType";

export const determine_tools_def: ITool = {
  type: "function",
  function: {
    name: "determine_tools",
    description: "will answer one question and determine a relevant tool to calls",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The user's question"
        },
      },
      required: ["question"]
    }
  }
};

export const determine_tools_impl: ToolImplType = async (
  toolContext: ToolContext,
  options: IToolUse,
): Promise<AskReturnVal> => {

  console.log(options);

  if (typeof(options.arguments.question) !== 'string') {
    return {
      type: 'response',
      data: 'the "question" argument is missing.\ncould not invoke the "determine" tool'
    };
  }

  const response = await toolContext.myQueryHandler.askSomething({
    tools: [
      answer_user_question_def,
      get_current_weather_def,
    ],
    prompt: [
      "Determine which tools to use.",
      "Don't answer anything else.",
      "just give the tool calls.",
    ].join('\n'),
    question: options.arguments.question,
  });

  console.log(response);

  if (response.type !== 'tool_use') {
    return {
      type: 'response',
      data: 'the "determine_tools" tool response is incorrect -> failure'
    };
  }

  return response;
};
