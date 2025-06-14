
import { ITool, MyOllama } from '../utilities';

import { runWithProgress } from './runWithProgress';

export type AskOptions = {
  ollamaInstance: MyOllama,
  prompt: string,
  question: string,
  context?: string,
  tools?: ITool[],
};
