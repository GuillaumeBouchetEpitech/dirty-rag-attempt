
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

    // console.log(`add item "${filename}"`);

    const vector = await this._getVectorCallback(text);

    // const results = await this._index.queryItems(vector, 1);

    // if (
    //   results.length > 0 &&
    //   results[0].item.metadata.filename.toString() === filename
    // ) {
    //   console.log(` -> duplicated item -> skipped`);
    //   return;
    // }

    await this._index.insertItem({ vector, metadata: { filename, text } });
  }

  //
  //
  //

  async confirmFilenamePresence(filename: string): Promise<boolean> {

    // console.log(`confirm item "${filename}"`);

    const results = await this._index.listItemsByMetadata({ filename });

    // console.log(`results`, results);

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
