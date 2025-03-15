
import { LocalIndex } from 'vectra';



export interface IMetaData {
  filename: string;
  text: string;
}

export type getVectorCallbackType = (text: string) => Promise<number[]>;

export class MyVectorStore {

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

  async query(text: string, total: number): Promise<IMetaData[]> {

    const vector = await this._getVectorCallback(text);
    const results = await this._index.queryItems(vector, total);

    return results.map<IMetaData>(val => ({
      filename: val.item.metadata.filename.toString(),
      text: val.item.metadata.text.toString()
    }));
  }

}
