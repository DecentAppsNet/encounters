import LLMConnection from "./types/LLMConnection";
import LLMConnectionType from "./types/LLMConnectionType";
import LLMMessages from "./types/LLMMessages";
import StatusUpdateCallback from "./types/StatusUpdateCallback";
import { createChatHistory } from "./messageUtil";

import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";

/*
  Public APIs
*/

export async function mediapipeConnect(modelId: string, connection: LLMConnection, onStatusUpdate: StatusUpdateCallback): Promise<boolean> {
    try {
        connection.connectionType = LLMConnectionType.MEDIAPIPE;
        onStatusUpdate("Loading Mediapipe WASM...", 0.1);

        const genaiWasm = await FilesetResolver.forGenAiTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@0.10.26/wasm" // usually people serve this locally, but we'll use jsdelivr for now, or maybe the node_modules path? But standard in web is jsdelivr unless we copy assets. Let's use standard jsdlivr if it's available or local node_modules via import mapping. We will use standard unpkg URL here.
        );

        // We assume the modelId resolves to a valid URL for a bin file or we just use modelId directly.
        // The instructions say "MediaPipe needs a `.bin` file in `modelAssetPath`, so we might need to adjust the model IDs in metadata to ensure it maps to valid URL paths later, but we can verify the API is called correctly with existing IDs for now"
        onStatusUpdate("Initializing LlmInference...", 0.3);
        connection.mediapipeEngine = await LlmInference.createFromOptions(genaiWasm, {
            baseOptions: {
                // Just use modelId as path for now
                modelAssetPath: modelId
            },
            // some default settings
            maxTokens: 512,
            topK: 40,
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
