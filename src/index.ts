
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as dns from 'dns';

import { ITool, MyOllama } from './MyOllama';
import { MyVectorStore } from './MyVectorStore';
import { asToolCalls, extractJsonStructures, IToolUse } from './extractData';
import { askSomething } from './askSomething';

import { preprocessSkLearnDoc } from './pre-processing/pre-process-sklearn-doc';


dotenv.config(); // for OLLAMA_URL if using remote machines

dns.setDefaultResultOrder("ipv4first"); // solve ipv6 issues










const _initializeVectorStore = async (myOllama: MyOllama): Promise<MyVectorStore> => {

  //
  // initialize vector store
  //

  const pathToIndex = path.join(__dirname, '..', 'index');

  const myVectorStore = new MyVectorStore(pathToIndex, (...args) => myOllama.getVector(...args));

  await myVectorStore.ensureCreated();

  // experimental: ingestion logic

  const allDocs = await preprocessSkLearnDoc();

  for (let ii = 0; ii < allDocs.length; ++ii) {

    console.log(`progress: ${ii} / ${allDocs.length}`)

    const currDoc = allDocs[ii];

    const alreadyPresent = await myVectorStore.confirmFilenamePresence(currDoc.filepath);
    if (alreadyPresent) {
      continue;
    }

    await myVectorStore.addItem(currDoc.filepath, currDoc.content);
  }


  // console.log({allDocs});

  // OLD: ingestion logic

  // const docsDir = path.join(__dirname, '..', 'my-docs');

  // const dirContent = fs.readdirSync(docsDir, {withFileTypes: true});

  // for (const docName of dirContent) {

  //   if (!docName.isFile()) {
  //     continue;
  //   }

  //   const docPath = path.join(docName.path, docName.name);

  //   const docContent = fs.readFileSync(docPath, 'utf8');

  //   console.log("==========");
  //   console.log(docPath);

  //   await myVectorStore.addItem(docPath, docContent);
  // }

  return myVectorStore
};





















const _initializeToolCalling = (
  myOllama: MyOllama,
  myVectorStore: MyVectorStore
): {
  tools: ITool[];
  toolsMap: Map<string, (options: IToolUse) => Promise<string | undefined>>;
} => {

  //
  //
  //

  // const get_context_information_def: ITool = {
  //   type: "function",
  //   function: {
  //     name: "get_context_information",
  //     description: "Get answers about english history",
  //     parameters: {
  //       type: "object",
  //       properties: {
  //         question: {
  //           type: "string",
  //           description: "The question to ask"
  //         },
  //       },
  //       required: ["question"]
  //     }
  //   }
  // };

  // const get_context_information_impl = async (
  //   options: IToolUse
  // ): Promise<string | undefined> => {

  //   console.log(options);

  //   const { question } = options.arguments;

  //   if (typeof(question) !== 'string') {
  //     return;
  //   }

  //   const retrievedTexts = await myVectorStore.query(question, 1);

  //   // console.log(`\ncontext retrieved: ${context.length}`)
  //   // for (let ii = 0; ii < context.length; ++ii) {
  //   //   console.log(` -> context[${ii}]: "${context[ii].filename}"`)
  //   // }

  //   const response = await askSomething({
  //     ollamaInstance: myOllama,
  //     prompt: `Say you don't know if you don't know. otherwise use the context to answer the question of the user.`,
  //     question,
  //     context: retrievedTexts.map(val => val.text).join("\n\n"),
  //   });

  //   console.log(response);

  //   return response;
  // };

  //
  //
  //

  const get_context_information_def: ITool = {
    type: "function",
    function: {
      name: "get_context_information",
      description: "Get answers about the machine learn library named sklearn",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question to ask"
          },
        },
        required: ["question"]
      }
    }
  };

  const get_context_information_impl = async (
    options: IToolUse
  ): Promise<string | undefined> => {

    console.log(options);

    const { question } = options.arguments;

    if (typeof(question) !== 'string') {
      return;
    }

    const maxRetrieval = 3;
    const retrievedTexts = await myVectorStore.query(question, maxRetrieval);

    // console.log(`\ncontext retrieved: ${context.length}`)
    // for (let ii = 0; ii < context.length; ++ii) {
    //   console.log(` -> context[${ii}]: "${context[ii].filename}"`)
    // }

    const response = await askSomething({
      ollamaInstance: myOllama,
      prompt: `
        Say you don't know if you don't know.
        otherwise use the context to answer the question of the user.
      `,
      question,
      context: retrievedTexts.map(val => val.text).join("\n\n"),
    });

    console.log(response);

    return response;
  };

  //
  //
  //

  const get_current_weather_def: ITool = {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA"
          },
          format: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "The temperature unit to use. Infer this from the users location."
          }
        },
        required: ["location", "format"]
      }
    }
  };

  const get_current_weather_impl = async (options: IToolUse): Promise<string | undefined> => {

    console.log(options);

    if (typeof(options.arguments.location) !== 'string') {
      return;
    }

    const response = await askSomething({
      ollamaInstance: myOllama,
      prompt: `answer like a professional anchor.`,
      question: `Describe the weather in "${options.arguments.location}"`,
      context: `the weather in "${options.arguments.location}" is always nice`,
    });

    console.log(response);

    return response;
  };

  //
  //
  //

  const toolsMap = new Map<string, (options: IToolUse) => Promise<string | undefined>>([
    [
      get_context_information_def.function.name,
      get_context_information_impl
    ],
    [
      get_current_weather_def.function.name,
      get_current_weather_impl
    ]
  ]);

  const tools: ITool[] = [
    get_context_information_def,
    get_current_weather_def,
  ];

  return { tools, toolsMap }
};

























const askAgentWorkflowSomething = async (
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

  const allToolCalls = asToolCalls(response) || [];

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

























const _askDecomposedQuestions = async (
  myOllama: MyOllama,
  question: string,
  callback: (question: string) => Promise<string>,
): Promise<string> => {


  // decompose
  const responseA = await askSomething({
    ollamaInstance: myOllama,
    prompt: `decompose the user's question into mutliple tasks in a json array of string`,
    question,
  });

  const allStrings = extractJsonStructures(responseA).flat();

  console.log('allStrings', allStrings);

  const finalResults: { question: string;  answers: string }[] = [];

  for (const subQuestion of allStrings) {

    const answers = await callback(subQuestion);

    finalResults.push({ question, answers });
  }

  for (const {question, answers} of finalResults) {
    console.log('-> question')
    console.log(' ---> ', question)
    console.log('answers')
    console.log(answers)
  }

  const finalQuestion = finalResults
    .map(({answers}) => `\n${answers}\n`)
    .join('\n');

  // recompose
  return await askSomething({
    ollamaInstance: myOllama,
    prompt: `merge the answers into one big answer`,
    question: finalQuestion,
  });
};

























const asyncRun = async () => {

  console.log("");
  for (let ii = 0; ii < 5; ++ii)
    console.log("START");
  console.log("");

  //
  // initialize
  //

  const ollamaUrl = process.env['OLLAMA_URL'] || "http://localhost:11434";

  const myOllama = new MyOllama(
    ollamaUrl,
    "nomic-embed-text:latest",
    "mistral:latest"
  );

  const myVectorStore = await _initializeVectorStore(myOllama);

  const { tools, toolsMap } = _initializeToolCalling(myOllama, myVectorStore);

  //
  // start
  //

  const answer = await _askDecomposedQuestions(
    myOllama,
    // `Who was Boudicca and what did she do?
    // and give me the weather in Paris while you're at it <3`,
    `Could you explain to me what does the sklearn Binarizer class does?
    and give me the weather in Paris while you're at it <3`,
    async (subQuestion: string): Promise<string> => {
      const answers = await askAgentWorkflowSomething(myOllama, tools, toolsMap, subQuestion);
      return answers.join('\n\n');
    }
  );


  for (let ii = 0; ii < 5; ++ii)
    console.log(`answer`);
  console.log(`\n"${answer}"\n`);
  for (let ii = 0; ii < 5; ++ii)
    console.log(`/answer`);

  console.log("");
  for (let ii = 0; ii < 5; ++ii)
    console.log("STOP");
  console.log("");

};
asyncRun();

