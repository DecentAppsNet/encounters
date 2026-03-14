import LLMConnectionState from "./LLMConnectionState";
import LLMConnectionType from "./LLMConnectionType";

import * as webllm from "@mlc-ai/web-llm";
import { LlmInference } from "@mediapipe/tasks-genai";

type LLMConnection = {
  state: LLMConnectionState,
  modelId: string,
  webLLMEngine: webllm.MLCEngineInterface | null,
  mediapipeEngine: LlmInference | null,
  serverUrl: string | null,
  connectionType: LLMConnectionType
}

export default LLMConnection;