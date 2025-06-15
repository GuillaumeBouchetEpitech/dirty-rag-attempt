
import express from 'express';
import * as dotenv from 'dotenv';
import * as ws from 'ws';
import * as path from 'path';
import * as dns from 'dns';
import { OllamaQueryHandler } from './chatbot/OllamaQueryHandler';
import { AskReturnVal } from './chatbot/AskReturnVal';
import { answer_user_question_def, answer_user_question_impl } from './chatbot/my-tools/answer_user_question';
import { get_current_weather_def, get_current_weather_impl } from './chatbot/my-tools/get_current_weather';
import { determine_tools_def, determine_tools_impl } from './chatbot/my-tools/determine_tools';
import { decompose_input_def, decompose_input_impl } from './chatbot/my-tools/decompose_input';
import { determine_relevant_memory_def, determine_relevant_memory_impl } from './chatbot/my-tools/determine_relevant_memory';
import { decompose_relevant_memory_def, decompose_relevant_memory_impl } from './chatbot/my-tools/decompose_relevant_memory';

import { ToolImplType } from './chatbot/my-tools/ToolImplType';
import { handleResponseLoop } from './chatbot/handleResponseLoop';
import { ToolContext } from './chatbot/my-tools/ToolContext';
import { extractJsonStructures, MyOllama, MyVectorStore } from './utilities';

//
//
//
//
// LOGIC PART

dotenv.config(); // for OLLAMA_URL if using remote machines

dns.setDefaultResultOrder("ipv4first"); // solve ipv6 issues

const ollamaUrl = process.env['OLLAMA_URL'] || "http://localhost:11434";
const myOllama = new MyOllama(
  ollamaUrl,
  "nomic-embed-text:latest",

  // // will miss some tool calls
  // // will call the wrong tools
  // "mistral:latest",

  // is fast and (most of the time) accurate
  // it can sometime miss some tool calls
  "llama3.1:8b"

  // // is slower and bit more formal
  // // felt really accurate (...needs >16Go of VRAM)
  // "mistral-small:24b-instruct-2501-q4_K_M"

);

const pathToIndex = path.join(__dirname, '..', 'index-chat-history');

const chatHistoryVectorStore = new MyVectorStore({
  pathToIndex,
  getVectorCallback: (text: string) => myOllama.getVector(text)
});



const liveChatMemory: string[] = []
const allCollectedInformation: any = {};



const myQueryHandler = new OllamaQueryHandler(myOllama);


const toolsMap = new Map<string, ToolImplType>();
toolsMap.set(answer_user_question_def.function.name, answer_user_question_impl);
toolsMap.set(get_current_weather_def.function.name, get_current_weather_impl);
toolsMap.set(determine_tools_def.function.name, determine_tools_impl);
toolsMap.set(decompose_input_def.function.name, decompose_input_impl);
toolsMap.set(determine_relevant_memory_def.function.name, determine_relevant_memory_impl);
toolsMap.set(decompose_relevant_memory_def.function.name, decompose_relevant_memory_impl);






const initializeAgenticFramework = async (): Promise<void> => {

  await chatHistoryVectorStore.ensureCreated();

};






const handleUserQuery = async (
  userQuery: string,
  sendCallback: (message: string) => void,
): Promise<void> => {

  myQueryHandler.clearListeners();

  myQueryHandler.on('tools_list', (tools) => {
    const markdownTools = "```\n" + tools + "\n```";
    sendCallback(JSON.stringify({ type: "tools_list", data: markdownTools }));
  });

  myQueryHandler.on('prompt', (prompt) => {
    const markdownPrompt = "```\n" + prompt + "\n```";
    sendCallback(JSON.stringify({ type: "prompt", data: markdownPrompt }));
  });

  myQueryHandler.on('context', (context) => {
    sendCallback(JSON.stringify({ type: "context", data: context }));
  });

  // myQueryHandler.on('question', (question) => {
  //   sendCallback(JSON.stringify({ type: "user", data: question }));
  // });

  myQueryHandler.on('logic', (logic) => {
    sendCallback(JSON.stringify({ type: "logic", data: logic }));
  });

  myQueryHandler.on('tool_use', (toolUse) => {
    const markdownToolUse = "### Tool call:\n```yaml\n" + toolUse + "\n```";
    sendCallback(JSON.stringify({ type: "tool_use", data: markdownToolUse }));
  });

  // myQueryHandler.on('response', (response) => {
  //   sendCallback(JSON.stringify({ type: "assistant", data: response }));
  // });

  myQueryHandler.on('separator', () => {
    sendCallback(JSON.stringify({ type: "separator", data: "" }));
  });

  sendCallback(JSON.stringify({ type: "user", data: userQuery }));

  const initialResponse: AskReturnVal = {
    type: 'tool_use',
    data: [
      {
        // name: decompose_input_def.function.name,
        name: determine_tools_def.function.name,
        arguments: {
          question: userQuery,
        },
      },
    ],
  };



  console.log('initialResponse');
  console.log(initialResponse);
  console.log('/initialResponse');

  const toolContext: ToolContext = {
    myQueryHandler,
    chatHistoryVectorStore,
    liveChatMemory,
    toolsMap,
  };

  const answers = await handleResponseLoop(toolContext, [initialResponse]);

  const currentTime = new Date();

  // update the memory
  for (const currAnswer of answers) {

    const asText = [
      "",
      `### the user's question asked the ${currentTime.toDateString()} at ${currentTime.toTimeString()} is:`,
      `${userQuery}`,
      "",
      `### the answer from the assistant was:`,
      `${currAnswer.data}`,
      "",
    ].join('\n');

    // push latest
    liveChatMemory.push(asText);
    // keep only the 5 latest messages
    while (liveChatMemory.length > 5) {
      // remove the oldest message
      liveChatMemory.shift();
    }



    {
      const subResponse: AskReturnVal = {
        type: 'tool_use',
        data: [
          {
            name: determine_relevant_memory_def.function.name,
            arguments: {
              message: userQuery,
            },
          },
        ],
      };

      console.log('subResponse');
      console.log(JSON.stringify(subResponse, null, 2));
      console.log('/subResponse');

      const subAnswers = await handleResponseLoop(toolContext, [subResponse]);

      console.log('subAnswers');
      console.log(subAnswers);
      console.log('/subAnswers');

      if (
        subAnswers.length > 0 &&
        subAnswers[0].data === "Y"
      ) {

        await chatHistoryVectorStore.addItem(currentTime.toISOString(), asText);

        sendCallback(JSON.stringify({ type: "logic", data: "this is now memorized!" }));
      } else {
        sendCallback(JSON.stringify({ type: "logic", data: "this is ignored!" }));
      }
    }

    // {
    //   // decompose_relevant_memory_def

    //   const subResponse: AskReturnVal = {
    //     type: 'tool_use',
    //     data: [
    //       {
    //         name: decompose_relevant_memory_def.function.name,
    //         arguments: {
    //           message: userQuery,
    //         },
    //       },
    //     ],
    //   };

    //   console.log('subResponse');
    //   console.log(JSON.stringify(subResponse, null, 2));
    //   console.log('/subResponse');

    //   const subAnswers = await handleResponseLoop(toolContext, [subResponse]);

    //   console.log('subAnswers');
    //   console.log(subAnswers);
    //   console.log('/subAnswers');

    //   for (const currAnswer of subAnswers) {
    //     if (currAnswer.type !== 'response') {
    //       continue;
    //     }

    //     let jsonData = extractJsonStructures(currAnswer.data);

    //     // preemptive flatting of the result
    //     jsonData = jsonData.flat();

    //     console.log('jsonData', jsonData)

    //     for (const currData of jsonData) {

    //       const allKeys = Object.keys(currData);

    //       const _keyMap: any = {};
    //       const safeKeys = allKeys
    //         .map(val => {
    //           const newVal = val.toLowerCase();
    //           _keyMap[newVal] = val;
    //           return newVal;
    //         })
    //         .sort();

    //       if (
    //         safeKeys.length === 2 &&
    //         safeKeys[0] === 'topic' &&
    //         safeKeys[1] === 'value'
    //       ) {
    //         const currKey = currData[_keyMap['topic']];
    //         let values = allCollectedInformation[currKey];
    //         if (!values) {
    //           values = [];
    //           allCollectedInformation[currKey] = values;
    //         }

    //         values.push(currData[_keyMap['value']]);
    //       }
    //       else {
    //         for (const currKey of Object.keys(currData)) {

    //           const safeKey = currKey.toLowerCase();

    //           let values = allCollectedInformation[safeKey];
    //           if (!values) {
    //             values = [];
    //             allCollectedInformation[safeKey] = values;
    //           }

    //           values.push(currData[currKey]);
    //         }
    //       }
    //     }

    //     let collectedData = "";
    //     collectedData += "# allData\n";

    //     for (const currKey of Object.keys(allCollectedInformation)) {
    //       collectedData += `- ${currKey}:\n`;
    //       for (const currValue of allCollectedInformation[currKey]) {
    //         collectedData += `    - ${currValue}\n`;
    //       }
    //     }

    //     sendCallback(JSON.stringify({
    //       type: "logic",
    //       data: collectedData,
    //     }));


    //   }


    // }




    sendCallback(JSON.stringify({ type: "assistant", data: currAnswer.data }));
  }

};

//
//
//
//
// NETWORK PART

const initializeNetwork = async (
  onClientQuery: (
    clientQuery: string,
    sendCallback: (message: string) => void,
  ) => Promise<void>
) => {

  //
  //
  // HTTP SERVER

  const app = express();

  app.use(express.static(path.join(__dirname, '..', 'pages')));

  const server = app.listen(11234, () => {
    console.log("listening");
  });

  //
  //
  // WEBSOCKET SERVER

  const _ensureString = (data: ws.RawData): string => {
    if (data instanceof ArrayBuffer) {
      return data.toString();
    }
    return data.toString('utf8');
  };

  const _ensureStrings = (data: ws.RawData): string[] => {
    if (Array.isArray(data)) {
      return data.map<string>(_ensureString);
    }
    return [_ensureString(data)];
  };

  const wsServer = new ws.WebSocketServer({ noServer: true });
  wsServer.on('connection', socket => {

    socket.on('message', async (message: ws.RawData) => {

      const safeStr = _ensureStrings(message);

      for (const currStr of safeStr) {
        console.log(' ->', currStr);

        await onClientQuery(currStr, (msg) => socket.send(msg));
      }
    });
  });

  server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
      wsServer.emit('connection', socket, request);
    });
  });
};

const asyncRun = async () => {
  await initializeAgenticFramework();
  await initializeNetwork(handleUserQuery);
};
asyncRun();

