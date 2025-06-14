
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as dns from 'dns';

import {
  ITool,
  MyOllama,
  MyVectorStore,
  IToolUse,
} from './utilities';

import {
  preprocessSkLearnDoc,
} from './pre-processing';

import {
  askSomething,
  askAgentWorkflowSomething,
  askDecomposedQuestions,
} from './wrappers';

//
//
//
//
//

//
//
//
//
//

//
//
//
//
//

//
//
//
//
//

dotenv.config(); // for OLLAMA_URL if using remote machines

dns.setDefaultResultOrder("ipv4first"); // solve ipv6 issues

//
//
//
//
//

//
//
//
//
//

//
//
//
//
//

//
//
//
//
//

const _initializeVectorStore = async (myOllama: MyOllama): Promise<MyVectorStore> => {

  //
  // initialize vector store
  //

  const pathToIndex = path.join(__dirname, '..', 'index');

  const myVectorStore = new MyVectorStore({
    pathToIndex,
    getVectorCallback: (text: string) => myOllama.getVector(text)
  });

  await myVectorStore.ensureCreated();

  // experimental: ingestion logic

  const allDocs = await preprocessSkLearnDoc();

  let totalAdded = 0;

  for (let ii = 0; ii < allDocs.length; ++ii) {

    process.stdout.write(`\r -> ingestion progress: ${ii} / ${allDocs.length}`)

    const currDoc = allDocs[ii];

    const alreadyPresent = await myVectorStore.confirmFilenamePresence(currDoc.filepath);
    if (alreadyPresent) {
      continue;
    }

    await myVectorStore.addItem(currDoc.filepath, currDoc.content);

    totalAdded += 1;
  }

  process.stdout.write(`\n`);
  console.log(`---> total ingested ${totalAdded} / ${allDocs.length} (done once, then cached)`);

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

//
//
//
//
//

//
//
//
//
//

//
//
//
//
//

//
//
//
//
//

const _initializeToolCalling = (
  myOllama: MyOllama,
  myVectorStore: MyVectorStore
): {
  allTools: ITool[];
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

  const allTools: ITool[] = [
    get_context_information_def,
    get_current_weather_def,
  ];

  return { allTools, toolsMap }
};

//
//
//
//
//

//
//
//
//
//

//
//
//
//
//

//
//
//
//
//

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
    // "mistral:latest"
    "llama3.1:8b"
  );

  const myVectorStore = await _initializeVectorStore(myOllama);

  const { allTools, toolsMap } = _initializeToolCalling(myOllama, myVectorStore);

  //
  // start
  //

  const question = `
    if I want to use sklearn how do I binarize a dataset column?
    and give me the weather in Paris while you're at it <3
  `;

  const answer = await askDecomposedQuestions({
    ollamaInstance: myOllama,
    question,
    callback: async (subQuestion: string): Promise<string> => {

      const answers = await askAgentWorkflowSomething({
        ollamaInstance: myOllama,
        tools: allTools,
        toolsMap,
        question: subQuestion,
      });

      return answers.join('\n\n');
    }
  });

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

