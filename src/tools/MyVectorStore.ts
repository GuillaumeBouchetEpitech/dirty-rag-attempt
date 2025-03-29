
import { LocalIndex } from 'vectra';

export interface IMetaData {
  filename: string;
  text: string;
}

export type getVectorCallbackType = (text: string) => Promise<number[]>;

export interface MyVectorStoreDef {
  pathToIndex: string;
  getVectorCallback: getVectorCallbackType;
};

export class MyVectorStore {

  private _index: LocalIndex;
  private _getVectorCallback: getVectorCallbackType;

  //
  //
  //

  constructor({
    pathToIndex,
    getVectorCallback
  }: MyVectorStoreDef) {
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

    const vector = await this._getVectorCallback(text);

    await this._index.insertItem({ vector, metadata: { filename, text } });
  }

  //
  //
  //

  async confirmFilenamePresence(filename: string): Promise<boolean> {

    const results = await this._index.listItemsByMetadata({ filename });

    return results.length > 0;
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
