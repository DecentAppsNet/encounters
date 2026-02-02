import Code from "@/spielCode/types/Code";
import ActionType from "./ActionType";

export type DisplayMessageAction = {
  actionType:ActionType.DISPLAY_MESSAGE;
  message:string;
  criteria:Code|null;
}

export type InstructionMessageAction = {
  actionType:ActionType.INSTRUCTION_MESSAGE;
  message:string;
  criteria:Code|null;
}

export type MessageAction = DisplayMessageAction | InstructionMessageAction;

export type CodeAction = {
  actionType:ActionType.CODE;
  code:Code;
}

type Action = MessageAction | CodeAction;

export default Action;