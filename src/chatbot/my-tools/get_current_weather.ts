import { ITool, IToolUse } from "../../utilities";
import { AskReturnVal } from "../AskReturnVal";
import { ToolContext } from "./ToolContext";
import { ToolImplType } from "./ToolImplType";

export const get_current_weather_def: ITool = {
  type: "function",
  function: {
    name: "get_current_weather",
    description: "Get the current weather of a named city and state",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA"
        },
      },
      required: ["location"]
    }
  }
};

export const get_current_weather_impl: ToolImplType = async (
  toolContext: ToolContext,
  options: IToolUse
): Promise<AskReturnVal> => {

  console.log(options);

  if (typeof(options.arguments.location) !== 'string') {
    return {
      type: 'response',
      data: 'the "location" argument is missing.\ncould not invoke the "weather" tool',
    };
  }

  const response = await toolContext.myQueryHandler.askSomething({
    prompt: `answer like a professional anchor but keep it short.`,
    question: `Describe the weather in "${options.arguments.location}"`,
    context: `the weather in "${options.arguments.location}" is always nice`,
  }, {
    temperature: 0.3,
    num_predict: 256,
  });

  console.log(response);

  return response;
};

