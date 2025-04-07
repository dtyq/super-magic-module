/**
 * 节点类型映射表
 * 用于DSL和Flow JSON格式转换
 */

interface NodeTypeMapping {
  flow_type: string;
  yaml_type: string;
}

// 节点类型映射表
const nodeMapping: Record<string, NodeTypeMapping> = {
  "start": {
    "flow_type": "1",
    "yaml_type": "start",
  },
  "end": {
    "flow_type": "2", 
    "yaml_type": "end",
  },
  "if": {
    "flow_type": "5",
    "yaml_type": "if-else",
  },
  "loop": {
    "flow_type": "6",
    "yaml_type": "loop",
  },
  "loop_body": {
    "flow_type": "7",
    "yaml_type": "loop-body",
  },
  "loop_end": {
    "flow_type": "8",
    "yaml_type": "loop-end",
  },
  "sub": {
    "flow_type": "9",
    "yaml_type": "sub",
  },
  "llm": {
    "flow_type": "11",
    "yaml_type": "llm",
  },
  "llm_call": {
    "flow_type": "12",
    "yaml_type": "llm-call",
  },
  "text_to_image": {
    "flow_type": "13",
    "yaml_type": "text-to-image",
  },
  "agent": {
    "flow_type": "14",
    "yaml_type": "agent",
  },
  "loader": {
    "flow_type": "15",
    "yaml_type": "loader",
  },
  "cache_setter": {
    "flow_type": "20",
    "yaml_type": "cache-setter",
  },
  "cache_getter": {
    "flow_type": "21",
    "yaml_type": "cache-getter",
  },
  "variable_save": {
    "flow_type": "16",
    "yaml_type": "variable-save",
  },
  "text_split": {
    "flow_type": "29",
    "yaml_type": "text-split",
  },
  "vector_storage": {
    "flow_type": "18",
    "yaml_type": "vector-storage",
  },
  "vector_search": {
    "flow_type": "19",
    "yaml_type": "vector-search",
  },
  "vector_delete": {
    "flow_type": "28",
    "yaml_type": "vector-delete",
  },
  "vector_database_match": {
    "flow_type": "22",
    "yaml_type": "vector-database-match",
  },
  "knowledge_search": {
    "flow_type": "17",
    "yaml_type": "knowledge-search",
  },
  "http": {
    "flow_type": "10",
    "yaml_type": "http-request",
  },
  "code": {
    "flow_type": "25",
    "yaml_type": "code",
  },
  "reply_message": {
    "flow_type": "3",
    "yaml_type": "reply-message",
  },
  "message_search": {
    "flow_type": "4",
    "yaml_type": "message-search",
  },
  "message_memory": {
    "flow_type": "24",
    "yaml_type": "message-memory",
  },
  "intention_recognition": {
    "flow_type": "27",
    "yaml_type": "intention-recognition",
  },
  "search_users": {
    "flow_type": "30",
    "yaml_type": "search-users",
  },
  "wait_for_reply": {
    "flow_type": "31",
    "yaml_type": "wait-for-reply",
  },
  "add_record": {
    "flow_type": "32",
    "yaml_type": "add-record",
  },
  "update_record": {
    "flow_type": "33",
    "yaml_type": "update-record",
  },
  "find_record": {
    "flow_type": "34",
    "yaml_type": "find-record",
  },
  "delete_record": {
    "flow_type": "35",
    "yaml_type": "delete-record",
  },
  "document_resolve": {
    "flow_type": "40",
    "yaml_type": "document-resolve",
  },
  "excel": {
    "flow_type": "41",
    "yaml_type": "excel",
  },
  "tools": {
    "flow_type": "26",
    "yaml_type": "tool",
  },
  "group_chat": {
    "flow_type": "42",
    "yaml_type": "group-chat",
  },
  "template_transform": {
    "flow_type": "50",
    "yaml_type": "template-transform",
  },
  "variable_assigner": {
    "flow_type": "51",
    "yaml_type": "variable-assigner",
  },
  "question_classifier": {
    "flow_type": "52",
    "yaml_type": "question-classifier",
  }
}

export default nodeMapping; 