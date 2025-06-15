import { ITool, IToolUse, MyOllama, MyVectorStore } from "../../utilities";
import { AskReturnVal } from "../AskReturnVal";
import { OllamaQueryHandler } from "../OllamaQueryHandler";
import { ToolContext } from "./ToolContext";
import { ToolImplType } from "./ToolImplType";

export const answer_user_question_def: ITool = {
  type: "function",
  function: {
    name: "answer_user_question",
    description: "Answer the user's question(s)",
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

export const answer_user_question_impl: ToolImplType = async (
  toolContext: ToolContext,
  options: IToolUse,
): Promise<AskReturnVal> => {

  console.log(options);

  if (typeof(options.arguments.question) !== 'string') {
    return {
      type: 'response',
      data: 'the "question" argument is missing.\ncould not invoke the "answering" tool'
    };
  }

  const maxRetrieval = 3;
  const retrievedTexts = await toolContext.chatHistoryVectorStore.query(options.arguments.question, maxRetrieval);

  const currentTime = new Date();


  let context: string = "";

  if (retrievedTexts.length > 0) {
    context += `\n`;
    context += "# Here is a potentially old but relevant chat history:"
    context += `\n`;
    context += retrievedTexts.map<string>((currText) => currText.text).join('\n');
    context += `\n`;
  }

  if (toolContext.liveChatMemory.length > 0) {
    context += `\n`;
    context += `# Here is the last ${toolContext.liveChatMemory.length} messages from the current conversation:`;
    context += `\n`;
    context += toolContext.liveChatMemory.join('\n');
    context += `\n`;
  }
  else {
    context += `\n`;
    context += `# This is the first message you have received in this conversation:`;
    context += `\n`;
  }

  context += `\n`;
  context += `## the current date is ${currentTime.toDateString()}\n`;
  context += `## the current time is ${currentTime.toTimeString()}\n`;
  context += `\n`;

  const response = await toolContext.myQueryHandler.askSomething({
    // ollamaInstance: myOllama,
    prompt: [
      "You are George, a helpful assistant.",
      "Answer the user's question.",
      "Say you don't know if you don't know.",
      "use the provided context if present and useful.",
    ].join('\n'),

    question: options.arguments.question,

    context,
  });

  console.log(response);

  return response;
};
