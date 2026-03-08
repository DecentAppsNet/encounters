import { baseUrl } from "@/common/urlUtil";
import { getAppMetaData, getAppSettings, initAppMetaData } from "decent-portal";

// Don't reference the DOM. Avoid any work that could instead be done in the loading screen or someplace else
export async function initApp() {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register(baseUrl('/serviceWorker.js'));
  }

  // Patch Object.prototype to give the "None" model a dummy memory size, 
  // avoiding a crash in `decent-portal`'s `predictModelDeviceProblems` / `scoreModel`.
  Object.defineProperty(Object.prototype, 'None', {
    value: { modelId: 'None', vramRequiredMb: 1024 },
    enumerable: false, // Prevents breaking `for...in` loops
    configurable: true // Allows cleanup or recreation if needed
  });

  await initAppMetaData(); // Useful to have app metadata ready before the app starts because DecentBar needs it.

  // Switch the supported models based on the inference family.
  const appSettings = await getAppSettings();
  const metadata = await getAppMetaData() as any;

  let family = metadata.inferenceFamily ?? 'mediapipe';
  if (appSettings && appSettings['inferenceFamily'] !== undefined) {
    family = appSettings['inferenceFamily'] ? 'mediapipe' : 'webllm';
  }

  if (family === 'mediapipe' && metadata.supportedModelsMediapipe) {
    metadata.supportedModels = metadata.supportedModelsMediapipe;
  } else if (family === 'webllm' && metadata.supportedModelsWebLlm) {
    metadata.supportedModels = metadata.supportedModelsWebLlm;
  }
}