

import { MyOllama, extractJsonStructures } from '../utilities';
import { askSomething } from './askSomething';

interface IDecomposedQuestionsDef {
  ollamaInstance: MyOllama,
  question: string,
  callback: (question: string) => Promise<string>,
}

export const askDecomposedQuestions = async ({
  ollamaInstance,
  question,
  callback,
}: IDecomposedQuestionsDef): Promise<string> => {

  //
  // decompose
  //

  const prompt = `
    Do not answer the questions.
    Count the total number of questions asked and decompose the questions into an equal number of sub-questions.
    Reply in a simple json array of string and nothing else
  `;

  const response = await askSomething({ ollamaInstance, prompt, question });

  const allSubQuestions = extractJsonStructures(response).flat().flat();

  console.log('allSubQuestions', allSubQuestions);

  const finalResults: { question: string;  answers: string }[] = [];

  for (const subQuestion of allSubQuestions) {

    const answers = await callback(subQuestion);

    finalResults.push({ question: subQuestion, answers });
  }

  for (const {question, answers} of finalResults) {
    console.log('\n\n');
    console.log('-> question');
    console.log(' ---> ', question);
    console.log('answers');
    console.log(answers);
  }

  const finalQuestion = finalResults
    .map(({answers}, index) => {
      return `

        answer to question No ${index}:

        ${answers}

      `;
    })
    .join('\n');

  //
  // recompose
  //

  return await askSomething({
    ollamaInstance,
    prompt: `merge the answers into one big answer`,
    question: finalQuestion,
  });
};

