import { getConnectionModelId, isLlmConnected } from "@/llm/llmUtil";
import { initChat } from "./chat";
import { loadEncounter, loadEncounterList } from "@/encounters/encounterUtil";
import WrongModelDialog from "../dialogs/WrongModelDialog";
import { getLastEncounterUrl, setLastEncounterUrl } from "@/persistence/lastEncounter";
import Encounter from "@/encounters/types/Encounter";

const DEFAULT_ENCOUNTER_URL = 'encounters/troll.md';

async function _loadEncounter():Promise<{encounter:Encounter, encounterUrl:string}> {
  let encounterUrl = await getLastEncounterUrl() ?? DEFAULT_ENCOUNTER_URL;
  let encounter:Encounter; 
  try {
    encounter = await loadEncounter(encounterUrl);
  } catch (err) {
    console.warn(`Could not load ${encounterUrl} due to "${'' + err}" error. Trying default encounter instead.`);
    encounterUrl = DEFAULT_ENCOUNTER_URL;
    encounter = await loadEncounter(encounterUrl);
    setLastEncounterUrl(encounterUrl);
  }
  return {encounter, encounterUrl};
}

export async function init(setEncounter:Function, setEncounterList:Function, setLines:Function, setModalDialogName:Function):Promise<boolean> {
  if (!isLlmConnected()) return false; // This initialization requires LLM connection.

  // It's going to double-load in dev environment, and that's harmless. If you decide to add a flag check, you also
  // need to do something like have 3 potential return states, e.g., failed-try-again-after-llm-load, failed-dont-try-again, success.
  const {encounter, encounterUrl} = await _loadEncounter();
  const encounterList = await loadEncounterList(encounterUrl);
  setEncounterList(encounterList);
  initChat(encounter, setLines);
  setEncounter(encounter);
  if (encounter.model !== getConnectionModelId()) setModalDialogName(WrongModelDialog.name);
  return true;
}