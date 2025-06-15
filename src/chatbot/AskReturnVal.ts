import { IToolUse } from "../utilities";

export type ResponseReturnVal = {
  type: 'response',
  data: string
}
export type ToolUseReturnVal = {
  type: 'tool_use',
  data: IToolUse[]
}

export type AskReturnVal = ResponseReturnVal | ToolUseReturnVal;
