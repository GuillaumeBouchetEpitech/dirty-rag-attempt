

import { MyOllama, extractJsonStructures } from '../tools';
import { askSomething } from './askSomething';

export const askDecomposedQuestions = async (
  myOllama: MyOllama,
  question: string,
  callback: (question: string) => Promise<string>,
): Promise<string> => {


  // decompose
  const responseA = await askSomething({
    ollamaInstance: myOllama,
    prompt: `decompose the user's question into mutliple tasks in a json array of string`,
    question,
  });

  const allStrings = extractJsonStructures(responseA).flat();

  console.log('allStrings', allStrings);

  const finalResults: { question: string;  answers: string }[] = [];

  for (const subQuestion of allStrings) {

    const answers = await callback(subQuestion);

    finalResults.push({ question, answers });
  }

  for (const {question, answers} of finalResults) {
    console.log('-> question')
    console.log(' ---> ', question)
    console.log('answers')
    console.log(answers)
  }

  const finalQuestion = finalResults
    .map(({answers}) => `\n${answers}\n`)
    .join('\n');

  // recompose
  return await askSomething({
    ollamaInstance: myOllama,
    prompt: `merge the answers into one big answer`,
    question: finalQuestion,
  });
};

