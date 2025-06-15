import { ITool, IToolUse } from "../../utilities";
import { AskReturnVal } from "../AskReturnVal";
import { handleResponseLoop } from "../handleResponseLoop";
import { determine_tools_def } from "./determine_tools";
import { ToolContext } from "./ToolContext";
import { ToolImplType } from "./ToolImplType";


export const decompose_input_def: ITool = {
  type: "function",
  function: {
    name: "decompose_input",
    description: "count and decompose the user's question(s) in multiple sub questions",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The user's questions to decompose"
        },
      },
      required: ["question"]
    }
  }
};

export const decompose_input_impl: ToolImplType = async (
  toolContext: ToolContext,
  options: IToolUse,
): Promise<AskReturnVal> => {

  console.log(options);

  if (typeof(options.arguments.question) !== 'string') {
    return {
      type: 'response',
      data: 'the "question" argument is missing.\ncould not invoke the "decompose" tool'
    };
  }

  const response = await toolContext.myQueryHandler.askSomething({
    // ollamaInstance: myOllama,
    tools: [
      determine_tools_def,
    ],
    prompt: [
      "Count the total number of questions asked.",
      "Decompose the questions into an equal number of sub-questions.",
      "Then determine the tools calls from the sub questions.",
      "Don't answer the questions.",
      "just give the tool calls.",
    ].join('\n'),
    question: options.arguments.question,
  });

  console.log(response);

  if (response.type !== 'tool_use') {
    return {
      type: 'response',
      data: 'the "decompose" tool response is incorrect -> failure'
    };
  }

  ///
  ///
  ///
  ///

  const finalResponses = await handleResponseLoop(
    toolContext,
    [response]
  );

  ///
  ///
  ///
  ///

  console.log('finalResponses', finalResponses);

  if (finalResponses.length === 0) {
    return {
      type: 'response',
      data: 'there was no final answer to present -> failure'
    };
  }

  if (finalResponses.length > 1) {

    const finalQuestions = finalResponses
      .map((response, index) => {
        return [
          "",
          `## answer number ${index}:`,
          "",
          `${response.data}`,
          "",
        ].join('\n')
      })
      .join('\n');

    console.log('finalQuestions');
    console.log(finalQuestions);

    const finalResponse = await toolContext.myQueryHandler.askSomething({
      // ollamaInstance: myOllama,
      prompt: [
        "Don't answer any questions.",
        "There is already answered questions in the context",
        "You are very good presenting a list of answers in a friendly way.",
      ].join('\n'),
      context: finalQuestions,
      question: `present the answers in the context`,
    });

    console.log('finalResponse');
    console.log(finalResponse);

    return finalResponse;
  }

  return finalResponses[0];
};

