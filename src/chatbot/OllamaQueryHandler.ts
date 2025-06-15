
import * as json2yaml from 'json2yaml';
import { asToolCalls, MyOllama, MyVectorStore, OllamaOptions } from '../utilities';
import { askSomething } from '../wrappers';
import { AskOptions } from '../wrappers/AskOptions';
import { AskReturnVal } from "./AskReturnVal"

export class OllamaQueryHandler {

  private _onToolsList: ((tools: string) => void)[] = [];
  private _onPrompt: ((prompt: string) => void)[] = [];
  private _onContext: ((query: string) => void)[] = [];
  private _onLogic: ((query: string) => void)[] = [];
  // private _onQuestion: ((query: string) => void)[] = [];
  // private _onResponse: ((query: string) => void)[] = [];
  private _onToolUse: ((query: string) => void)[] = [];
  private _onSeparator: ((query: string) => void)[] = [];

  private _myOllama: MyOllama;

  constructor(myOllama: MyOllama) {
    this._myOllama = myOllama;
  }

  async askSomething(
    askOptions: Omit<AskOptions, 'ollamaInstance'>,
    ollamaOptions?: OllamaOptions,
  ): Promise<AskReturnVal> {

    for (const callback of this._onSeparator) {
      callback("");
    }

    // if (askOptions.isUser) {
    //   for (const callback of this._onQuestion) {
    //     callback(askOptions.question);
    //   }
    // } else {
      for (const callback of this._onLogic) {
        callback(askOptions.question);
      }
    // }

    if (askOptions.tools) {
      const toolsStr = json2yaml.stringify(askOptions.tools);

      for (const callback of this._onToolsList) {
        callback(toolsStr);
      }
    }

    for (const callback of this._onPrompt) {
      callback(askOptions.prompt);
    }

    if (askOptions.context) {
      for (const callback of this._onContext) {
        callback(askOptions.context);
      }
    }

    for (const callback of this._onLogic) {
      callback("processing...");
    }

    // process query here
    const response = await askSomething({
      ...askOptions,
      ollamaInstance: this._myOllama,
    }, ollamaOptions);

    const allToolCalls = asToolCalls(response);

    if (allToolCalls.length === 0) {

      // if (askOptions.isUser) {
      //   for (const callback of this._onResponse) {
      //     callback(response);
      //   }
      // } else {
        for (const callback of this._onLogic) {
          callback(response);
        }
      // }

      return {
        type: 'response',
        data: response,
      };
    }
    else {

      const yamlTools = json2yaml.stringify(allToolCalls);
      for (const callback of this._onToolUse) {
        callback(yamlTools);
      }

      return {
        type: 'tool_use',
        data: allToolCalls,
      };
    }

  }

  on(
    inEvent: 'tools_list' | 'prompt' | 'context' | 'logic' /*| 'question'*/ | 'tool_use' /*| 'response'*/ | 'separator',
    inCallback: (tools: string) => void,
  ): void {
    switch (inEvent) {
      case 'tools_list': {
        this._onToolsList.push(inCallback);
        break;
      }
      case 'prompt': {
        this._onPrompt.push(inCallback);
        break;
      }
      case 'context': {
        this._onContext.push(inCallback);
        break;
      }
      case 'logic': {
        this._onLogic.push(inCallback);
        break;
      }
      // case 'question': {
      //   this._onQuestion.push(inCallback);
      //   break;
      // }
      case 'tool_use': {
        this._onToolUse.push(inCallback);
        break;
      }
      // case 'response': {
      //   this._onResponse.push(inCallback);
      //   break;
      // }
      case 'separator': {
        this._onSeparator.push(inCallback);
        break;
      }
    }
  }

  clearListeners(): void {
    this._onToolsList.length = 0;
    this._onPrompt.length = 0;
    this._onContext.length = 0;
    // this._onQuestion.length = 0;
    this._onLogic.length = 0;
    this._onToolUse.length = 0;
    // this._onResponse.length = 0;
    this._onSeparator.length = 0;
  }

};