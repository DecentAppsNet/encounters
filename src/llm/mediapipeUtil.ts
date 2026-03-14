import LLMConnection from "./types/LLMConnection";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { createChatHistory } from "./messageUtil";

import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";

/**
 * LiteRT-LM models are for embedded runtimes but only the -Web models are available for browsers
 * These are just tuned versions of the foundation models
 * 
 * The foundation models can be run on mobile devices
 * 
 * LiteRT-LM overview:
 * https://github.com/google-ai-edge/LiteRT-LM/blob/main/README.md
 * 
 * Inference guide for web:
 * https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js
 */
const MEDIAPIPE_MODEL_URLS: Record<string, string> = {
    'Gemma 3n E2B':
        '/litert-models/gemma-3n-E2B-it-int4-Web.litertlm', // 2.9GB
    'Gemma 3n E4B':
        '/litert-models/gemma-3n-E4B-it-int4-Web.litertlm' // 4.2GB
};

function _resolveModelUrl(modelId: string): string {
    return MEDIAPIPE_MODEL_URLS[modelId] ?? modelId; // fall back to treating modelId as a direct URL
}

/*
  Public APIs
*/

export async function mediapipeConnect(modelId: string, connection: LLMConnection, onStatusUpdate: StatusUpdateCallback): Promise<boolean> {
    try {
        connection.connectionType = LLMConnectionType.MEDIAPIPE;
        onStatusUpdate("Loading Mediapipe WASM...", 0.1);

        const genaiWasm = await FilesetResolver.forGenAiTasks(
            "/mediapipe-wasm" // Served locally from public/mediapipe-wasm/
        );

        const modelUrl = _resolveModelUrl(modelId);
        onStatusUpdate("Initializing LiteRT-LM...", 0.3);
        connection.mediapipeEngine = await LlmInference.createFromOptions(genaiWasm, {
            baseOptions: {
                modelAssetPath: modelUrl
            },
            // some default settings
            // https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference/web_js#configuration-options
            maxTokens: 8192,
            topK: 128,
            temperature: 0.2,
            randomSeed: 0
        });

        return true;
    } catch (e) {
        console.error('Error while connecting to Mediapipe.', e);
        return false;
    }
}

export async function mediapipeGenerate(connection: LLMConnection, llmMessages: LLMMessages, onStatusUpdate: StatusUpdateCallback): Promise<string> {
    const engine = connection.mediapipeEngine;
    if (!engine) throw Error('Unexpected: Engine is null');

    // Convert messages to string layout that Mediapipe understands. Usually Mediapipe takes a single prompt string, not a chat structure.
    // We'll map the messages into a continuous string since it's typically instruction-tuned models expecting raw text input formats.
    let promptText = llmMessages.systemMessage ? `<|system|>\n${llmMessages.systemMessage}\n` : '';
    const chatHistory = createChatHistory(llmMessages);

    for (const msg of chatHistory) {
        promptText += `<|${msg.role}|>\n${msg.content}\n`;
    }
    promptText += `<|assistant|>\n`;

    let fullMessage = '';
    // According to plan we'll try to simulate streaming. generateResponse can take a listener.
    try {
        await engine.generateResponse(promptText, (partialResult: string, done: boolean) => {
            fullMessage += partialResult;
            onStatusUpdate(fullMessage, done ? 1 : 0);
        });
    } catch (e) {
        console.error("Error generating response", e);
        throw e;
    }

    return fullMessage;
}
