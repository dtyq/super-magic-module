import type { ControlEventMessageType } from ".";
import type { SeqMessageBase } from "./base";
import type { ConversationMessageStatus } from "./conversation_message";


export interface StartConversationInputMessage extends SeqMessageBase {
  type: ControlEventMessageType.StartConversationInput;
  unread_count: number;
  send_time: number;
  status: ConversationMessageStatus;
}

export interface EndConversationInputMessage extends SeqMessageBase {
  type: ControlEventMessageType.EndConversationInput;
  unread_count: number;
  send_time: number;
  status: ConversationMessageStatus;
}
