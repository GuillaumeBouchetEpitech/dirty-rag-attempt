
import { ITool, MyOllama } from '../tools';

import { runWithProgress } from './runWithProgress';

export type AskOptions = {
  ollamaInstance: MyOllama,
  prompt: string,
  question: string,
  context?: string,
  tools?: ITool[],
};
