import EncounterSession from "@/encounters/EncounterSession";
import StatusUpdateCallback from "@/llm/types/StatusUpdateCallback";
import type Recognizer from "sl-web-speech/dist/speech/Recognizer";

let theRecognizer:Recognizer|null = null;
let theEncounterSession:EncounterSession|null = null;
let theIsSpeechEnabled = false;
let theInitSpeechPromise:Promise<boolean>|null = null;

export type StringCallback = (s:string) => void;

function _onFinal(message:string) {
  if (theEncounterSession) theEncounterSession.prompt(message);
}

export async function initSpeech(onStatusUpdate:StatusUpdateCallback):Promise<boolean> {
  if (theInitSpeechPromise) return theInitSpeechPromise;
  theInitSpeechPromise = new Promise<boolean>(async (resolve) => {

    onStatusUpdate('Initializing speech recognition...', 0);

    const { Recognizer, setModelsBaseUrl } = await import("sl-web-speech");

    function _onReady() {
      if (!theRecognizer) throw Error('Unexpected');
      theRecognizer.bindCallbacks(() => {}, () => {}, () => {}, _onFinal);
      onStatusUpdate('Speech recognition initialized.', 100);
      resolve(true);
    }

    setModelsBaseUrl('/speech-models/');
    try {
      theRecognizer = new Recognizer(_onReady);
    } catch(e) {
      console.error('Error while initializing speech recognizer.', e);
      onStatusUpdate('Error while initializing speech recognition.', 100);
      resolve(false);
    }
  });
  return theInitSpeechPromise;
}

export function isSpeechAvailable():boolean {
  return theRecognizer !== null;
}

export function isSpeechEnabled():boolean {
  return theIsSpeechEnabled;
}

export function toggleSpeech() {
  if (!theRecognizer) return;
  if (theIsSpeechEnabled) theRecognizer.mute();
  else theRecognizer.unmute();
  theIsSpeechEnabled = !theIsSpeechEnabled;
}

export function connectSpeechToEncounterSession(encounterSession:EncounterSession|null) {
  theEncounterSession = encounterSession;
}
