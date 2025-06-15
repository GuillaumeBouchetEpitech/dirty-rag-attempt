import { MyVectorStore } from "../../utilities";
import { OllamaQueryHandler } from "../OllamaQueryHandler";
import { ToolImplType } from "./ToolImplType";

export interface ToolContext {
  myQueryHandler: OllamaQueryHandler,
  toolsMap: Map<string, ToolImplType>,
  chatHistoryVectorStore: MyVectorStore,
  liveChatMemory: string[],
}

