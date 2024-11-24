
import * as fs from 'fs';
import * as path from 'path';
import { LocalIndex } from 'vectra';










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


















const asyncRun = async () => {



  const myOllama = new MyOllama(
    "http://localhost:11434",
    "nomic-embed-text:latest",
    "mistral:latest"
  );



  const pathToIndex = path.join(__dirname, '..', 'index');

  const myVectorStore = new MyVectorStore(pathToIndex, myOllama.getVector.bind(myOllama));

  await myVectorStore.ensureCreated();


  //
  // ingest text files from folder
  //

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
  // ingest text files from folder
  //

  const question = "Who was Boudicca and what did she do?"

  console.log(`\nQUESTION:\n -> "${question}"`)

  const context = await myVectorStore.query(question);

  console.log(`\ncontext retrieved: ${context.length}`)
  for (let ii = 0; ii < context.length; ++ii) {
    console.log(` -> context[${ii}]: "${context[ii].filename}"`)
  }

  const startTime = Date.now();

  const response = await myOllama.generate(`
    Say you don't know if you don't know.
    otherwise use the context to answer the question of the user.

    CONTEXT:

    ${context.map(val => val.text).join("\n\n")}

    QUESTION:

    ${question}
  `);

  const stopTime = Date.now();
  const deltaTime = stopTime - startTime;

  console.log(`\nRESPONSE:\n -> "${response}"\n`)
  console.log(`\ntime elapsed: ${deltaTime}ms (${deltaTime / 1000}s)\n`);






};
asyncRun();

