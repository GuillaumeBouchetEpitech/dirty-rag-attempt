import { IToolUse, MyOllama, MyVectorStore } from "../../utilities";
import { AskReturnVal } from "../AskReturnVal";
import { OllamaQueryHandler } from "../OllamaQueryHandler";
import { ToolContext } from "./ToolContext";


export type ToolImplType = (
  toolContext: ToolContext,
  options: IToolUse,
) => Promise<AskReturnVal>;

