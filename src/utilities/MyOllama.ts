
export interface ITool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: {
        [key in string]: {
          type: "string";
          enum?: string[];
          description: string;
        };
      };
      required: string[];
    };
  };
}


export class MyOllama {

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

  //
  //
  //

  get embeddingModel(): string { return this._embeddingModel; }
  get generationModel(): string { return this._generationModel; }

}
