import { baseUrl } from "@/common/urlUtil";
import { initAppMetaData } from "decent-portal";

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
}