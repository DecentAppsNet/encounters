import Encounter, { LATEST_MAJOR_VERSION } from "./types/Encounter";
import { majorVersion, parseEncounterVersion } from "./versionUtil";
import { textToEncounter, textToEncounterList } from "./v0/readerUtil";
import { baseUrl } from "@/common/urlUtil";
import CharacterTrigger from "./v0/types/CharacterTrigger";
import EncounterList from "./types/EncounterList";

export function findCharacterTriggerInText(responseText:string, characterTriggers:CharacterTrigger[]):CharacterTrigger|null {
  if (!characterTriggers.length) return null;
  let pos = 0;
  while(pos < responseText.length) {
    pos = responseText.indexOf('@', pos);  
    if (pos === -1) return null;
    const triggerCode = responseText[pos+1];
    for(let triggerI = 0; triggerI < characterTriggers.length; ++triggerI) {
      const trigger = characterTriggers[triggerI];
      if (!trigger.isEnabled) continue;
      if (triggerCode === trigger.triggerCode) return trigger;
    }
    ++pos;
  }
  return null;
}

export function stripTriggerCodes(responseText:string):string {
  let pos = responseText.indexOf('@');
  if (pos === -1) return responseText; // Trivial case.

  let concat = responseText.substring(0, pos);
  while(pos < responseText.length) {
    const nextPos = responseText.indexOf('@', pos);  
    if (nextPos === -1) break;
    concat += responseText.substring(pos, nextPos);
    pos = nextPos + 2;
  }
  if (pos < responseText.length) concat += responseText.substring(pos);
  return concat;
}

function _textToEncounter(text:string):Encounter {
  const version = parseEncounterVersion(text);
  const majorVersionNo = majorVersion(version); // For now, only v0 is supported.
  if (majorVersionNo !== LATEST_MAJOR_VERSION) throw Error(`Unsupported encounter version: ${version}`);
  return textToEncounter(text);
}

export async function loadEncounter(encounterUrl:string):Promise<Encounter> {
  const url = baseUrl(encounterUrl);
  const response = await fetch(url);
  if (!response.ok) throw Error(`Failed to load encounter from URL: ${encounterUrl}`);
  const text = await response.text();
  return _textToEncounter(text);
}

export async function loadEncounterList(lastLoadedEncounterUrl:string):Promise<EncounterList> {
  const url = baseUrl('encounters/encounterList.md');
  const response = await fetch(url);
  if (!response.ok) throw Error(`Failed to load from /encounter/encounterList.md`);
  const text = await response.text();
  return textToEncounterList(text, lastLoadedEncounterUrl);
}