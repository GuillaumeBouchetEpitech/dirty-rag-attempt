
import * as fs from 'fs';
import * as path from 'path';
import { LocalIndex } from 'vectra';
import * as dotenv from 'dotenv';
import * as dns from 'dns';



dotenv.config();

dns.setDefaultResultOrder("ipv4first");

// console.log(process.env);



interface IString {
  type: "string";
  enum?: string[];
  description: string;
};

interface ITool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: {
        [key in string]: IString;
      };
      required: string[];
    };
  };
}

interface IToolUse {
  name: string,
  arguments: Record<string, string>;
};

const asToolCalls = (str: string): IToolUse[] | undefined => {

  // scan for tool calls

  const allSlices: string[] = [];

  let tmpStr = str.slice(0);

  for (let ii = 0; ii < tmpStr.length; ++ii) {
    if (tmpStr[ii] === '[') {

      let squareBracketLevel = 1;
      let curlyBracketLevel = 0;
      let smoothBracketLevel = 0;
      // let singleQuoteLevel = 0;
      // let doubleQuoteLevel = 0;

      for (let jj = ii + 1; jj < tmpStr.length; ++jj) {
        if (tmpStr[jj] === '[') { squareBracketLevel += 1 };
        if (tmpStr[jj] === ']') { squareBracketLevel -= 1 };
        if (tmpStr[jj] === '{') { curlyBracketLevel += 1 };
        if (tmpStr[jj] === '}') { curlyBracketLevel -= 1 };
        if (tmpStr[jj] === '(') { smoothBracketLevel += 1 };
        if (tmpStr[jj] === ')') { smoothBracketLevel -= 1 };
        // if (tmpStr[jj] === "'") { singleQuoteLevel += 1 };
        // if (tmpStr[jj] === "'") { singleQuoteLevel -= 1 };
        // if (tmpStr[jj] === '"') { doubleQuoteLevel += 1 };
        // if (tmpStr[jj] === '"') { doubleQuoteLevel -= 1 };

        if (
          squareBracketLevel == 0 &&
          curlyBracketLevel == 0 &&
          smoothBracketLevel == 0 //&&
          // singleQuoteLevel == 0 &&
          // doubleQuoteLevel == 0
        ) {
          allSlices.push(tmpStr.slice(ii, jj + 1));
          ii = jj;
          break;
        }
      }

    }
  }

  // console.log('allSlices', allSlices);

  const allData: any[] = allSlices.map(tmpStr => {

    try {

      const currData = JSON.parse(tmpStr)

      // console.log('currData', currData);

      if (!Array.isArray(currData)) {
        // console.log('not an array');
        return undefined;
      }

      for (let ii = 0; ii < currData.length; ++ii) {
        if (
          typeof(currData[ii].name) !== 'string' ||
          typeof(currData[ii].arguments) !== 'object'
        ) {
          console.log('not an object');
          return;
        }
      }

      return currData;
    } catch (err) {
      return;
    }

  })
  .flat()
  .filter(val => val !== undefined);

  // console.log('allData', allData);

  return allData as IToolUse[];
};



class MyOllama {

  private _baseUrl: string;
  private _embeddingModel: string;
  private _generationModel: string;

  //
  //
  //

  constructor(
    baseUrl: string,
    embeddingModel: string,
    generationModel: string,
  ) {
    this._baseUrl = baseUrl;
    this._embeddingModel = embeddingModel;
    this._generationModel = generationModel;
  }

  //
  //
  //

  async getVector(text: string): Promise<number[]> {
    const result = await fetch(`${this._baseUrl}/api/embeddings`, {
      method: "POST",
      body: JSON.stringify({
        model: this._embeddingModel,
        prompt: text
      })
    });
    const jsonVal = await result.json();
    return jsonVal.embedding;
  };

  //
  //
  //

  async generate(text: string): Promise<string> {

    const result = await fetch(`${this._baseUrl}/api/generate`, {
      method: "POST",
      body: JSON.stringify({
        stream: false,
        model: this._generationModel,
        prompt: text,
        options: { temperature: 0 }
      })
    });
    const jsonVal = await result.json();
    return jsonVal.response;
  }

}











interface IMetaData {
  filename: string;
  text: string;
}

type getVectorCallbackType = (text: string) => Promise<number[]>;

class MyVectorStore {

  private _index: LocalIndex;
  private _getVectorCallback: getVectorCallbackType;

  //
  //
  //

  constructor(pathToIndex: string, getVectorCallback: getVectorCallbackType) {
    this._index = new LocalIndex(pathToIndex);
    this._getVectorCallback = getVectorCallback;
  }

  //
  //
  //

  async ensureCreated() {
    if (!await this._index.isIndexCreated()) {
      await this._index.createIndex();
    }
  }

  //
  //
  //

  async addItem(filename: string, text: string) {

    console.log(`add item`);

    const vector = await this._getVectorCallback(text);

    const results = await this._index.queryItems(vector, 1);

    if (
      results.length > 0 &&
      results[0].item.metadata.filename.toString() === filename
    ) {
      console.log(` -> duplicated item -> skipped`);
      return;
    }

    await this._index.insertItem({ vector, metadata: { filename, text } });
  }

  //
  //
  //

  async query(text: string): Promise<IMetaData[]> {

    const vector = await this._getVectorCallback(text);
    const results = await this._index.queryItems(vector, 1);

    return results.map<IMetaData>(val => ({
      filename: val.item.metadata.filename.toString(),
      text: val.item.metadata.text.toString()
    }));
  }

}






type AskOptions = {
  ollamaInstance: MyOllama,
  prompt: string,
  question: string,
  context?: string,
  // vectorStore?: MyVectorStore,
  tools?: ITool[],
};

const _ask = async ({
  ollamaInstance,
  prompt,
  question,
  context,
  // vectorStore,
  tools,
}: AskOptions): Promise<string> => {

  console.log(`\nQUESTION:\n -> "${question}"`)

  let completePrompt = "";

  if (tools && tools.length > 0) {
    completePrompt += `[AVAILABLE_TOOLS]`;
    completePrompt += JSON.stringify(tools);
    completePrompt += `[/AVAILABLE_TOOLS]`;
  }

  completePrompt += `\n`;
  completePrompt += `[INSTRUCTION]\n`;
  completePrompt += `\n`;
  completePrompt += `${prompt}\n`;
  completePrompt += `\n`;

  if (context) {
    completePrompt += `CONTEXT:\n`;
    completePrompt += `\n`;
    completePrompt += `${context}\n`;
  }

  completePrompt += `\n`;
  completePrompt += `QUESTION:\n`;
  completePrompt += `\n`;
  completePrompt += `${question}\n`;
  completePrompt += `\n`;
  completePrompt += `[/INSTRUCTION]\n`;
  completePrompt += `\n`;

  console.log(`
####
#########
################## PROMPT ######################
"${completePrompt}"
################## PROMPT ######################
#########
####
`)

  const startTime = Date.now();

  const response = await ollamaInstance.generate(completePrompt);

  const stopTime = Date.now();
  const deltaTime = stopTime - startTime;

  console.log(`\nRESPONSE:\n -> "${response}"\n`)
  console.log(`\ntime elapsed: ${deltaTime}ms (${deltaTime / 1000}s)\n`);

  return response;
};











const asyncRun = async () => {


  const ollamaUrl = process.env['OLLAMA_URL'] || "http://localhost:11434";

  const myOllama = new MyOllama(
    ollamaUrl,
    "nomic-embed-text:latest",
    "mistral:latest"
    // "llama3-groq-tool-use"
  );

  //
  // initialize vector store
  //

  const pathToIndex = path.join(__dirname, '..', 'index');

  const myVectorStore = new MyVectorStore(pathToIndex, myOllama.getVector.bind(myOllama));

  await myVectorStore.ensureCreated();

  // ingestion logic

  const docsDir = path.join(__dirname, '..', 'my-docs');

  const dirContent = fs.readdirSync(docsDir, {withFileTypes: true});

  for (const docName of dirContent) {

    if (!docName.isFile()) {
      continue;
    }

    const docPath = path.join(docName.path, docName.name);

    const docContent = fs.readFileSync(docPath, 'utf8');

    console.log("==========");
    console.log(docPath);

    await myVectorStore.addItem(docPath, docContent);
  }

  //
  // initialize the tools
  //

  const tools: ITool[] = [
    {
      type: "function",
      function: {
        name: "get_context_information",
        description: "Get answers about english history",
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
    },
    {
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
    }
  ];

  const toolsMap = new Map<string, (options: IToolUse) => Promise<void>>([
    [
      'get_context_information',
      async (options: IToolUse) => {

        console.log(options);

        if (typeof(options.arguments.question) !== 'string') {
          return;
        }

        const context = await myVectorStore.query(options.arguments.question);

        // console.log(`\ncontext retrieved: ${context.length}`)
        // for (let ii = 0; ii < context.length; ++ii) {
        //   console.log(` -> context[${ii}]: "${context[ii].filename}"`)
        // }

        const response = await _ask({
          ollamaInstance: myOllama,
          prompt: `Say you don't know if you don't know. otherwise use the context to answer the question of the user.`,
          question: options.arguments.question,
          context: context.map(val => val.text).join("\n\n"),
        });

        console.log(response);
      }
    ],
    [
      'get_current_weather',
      async (options: IToolUse) => {

        console.log(options);

        if (typeof(options.arguments.location) !== 'string') {
          return;
        }

        const response = await _ask({
          ollamaInstance: myOllama,
          prompt: `answer like a professional anchor.`,
          question: `Describe the weather in "${options.arguments.location}"`,
          context: `the weather in "${options.arguments.location}" is always nice`,
        });

        console.log(response);
      }
    ]
  ]);

  //
  // start
  //

  const response = await _ask({
    ollamaInstance: myOllama,
    prompt: `determine which tools to use, don't answer anything else. just give the tool calls`,
    question: `Who was Boudicca and what did she do?
    and give me the weather in Paris while you're at it <3`,
    tools,
  });

  const allToolCalls = asToolCalls(response) || [];

  console.log('allToolCalls', allToolCalls);

  for (const currCall of allToolCalls) {
    // console.log(currCall);

    const currTool = toolsMap.get(currCall.name);
    if (!currTool) {
      continue;
    }

    console.log(`\nTOOL CALL: "${JSON.stringify(currCall)}"\n`);

    await currTool(currCall);
  }

};
asyncRun();

