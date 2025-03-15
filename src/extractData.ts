
export interface IToolUse {
  name: string,
  arguments: Record<string, string>;
};

export const extractJsonStrings = (str: string): any[] => {

  const allSlices: string[] = [];

  let tmpStr = str.slice(0);

  for (let ii = 0; ii < tmpStr.length; ++ii) {
    if (
      tmpStr[ii] === '[' ||
      tmpStr[ii] === '{'
    ) {

      let squareBracketLevel = 0;
      let curlyBracketLevel = 0;
      let smoothBracketLevel = 0;

      for (let jj = ii + 0; jj < tmpStr.length; ++jj) {
        if (tmpStr[jj] === '[') { squareBracketLevel += 1 };
        if (tmpStr[jj] === ']') { squareBracketLevel -= 1 };
        if (tmpStr[jj] === '{') { curlyBracketLevel += 1 };
        if (tmpStr[jj] === '}') { curlyBracketLevel -= 1 };
        if (tmpStr[jj] === '(') { smoothBracketLevel += 1 };
        if (tmpStr[jj] === ')') { smoothBracketLevel -= 1 };

        if (
          squareBracketLevel == 0 &&
          curlyBracketLevel == 0 &&
          smoothBracketLevel == 0
        ) {
          allSlices.push(tmpStr.slice(ii, jj + 1)); // save
          ii = jj; // advance
          break; // back to the main loop
        }
      }

    }
  }

  // console.log('allSlices', allSlices);

  return allSlices;
};

export const extractJsonStructures = (str: string): any[] => {

  const allJsonStruct: any[] = [];

  const allSlices = extractJsonStrings(str);

  console.log('extractJsonStructures.allSlices', allSlices);

  for (const currSlice of allSlices) {
    try {
      const jsonVal = JSON.parse(currSlice);
      allJsonStruct.push(jsonVal);
    } catch (err) {
      // ignored
    }
  }

  return allJsonStruct;
};

/**
 *
 * this must works (not an array)
 * -> {"name":"tool-name","arguments":{"argName":"argValue"}}
 *
 * this must works (is an array)
 * -> [{"name":"tool-name","arguments":{"argName":"argValue"}}]
 *
 * this must works (is array of 2 elements)
 * -> [{"name":"tool-name","arguments":{"argName":"argValue"}}, {"name":"tool-name","arguments":{"argName":"argValue"}}]
 *
 * this must works (is 2 arrays of 1 element)
 * -> [{"name":"tool-name","arguments":{"argName":"argValue"}}] [{"name":"tool-name","arguments":{"argName":"argValue"}}]
 *
 * this must works (is 2 arrays of 1 element separated by garbage)
 * -> [{"name":"tool-name","arguments":{"argName":"argValue"}}] fnruewlavnlsvfd [{"name":"tool-name","arguments":{"argName":"argValue"}}]
 *
 */

export const asToolCalls = (
  str: string,
): IToolUse[] | undefined => {

  // scan for tool calls

  const allJsonStruct = extractJsonStructures(str);

  // console.log('asToolCalls.allJsonStruct', allJsonStruct)

  const allData = allJsonStruct.map<IToolUse[] | undefined>(currData => {

    // console.log('asToolCalls.currData', currData);

    if (!Array.isArray(currData)) {
      // console.log('asToolCalls.not-an-array');
      currData = [currData]; // ensure array
    }

    for (let ii = 0; ii < currData.length; ++ii) {
      if (
        typeof(currData[ii].name) !== 'string' ||
        typeof(currData[ii].arguments) !== 'object'
      ) {
        // console.log('asToolCalls.not-an-object');
        return; // not a tool call -> skip
      }
    }

    return currData;
  })
  .filter(val => val !== undefined)
  .flat();

  // console.log('allData', allData);

  return allData // as IToolUse[];
};

