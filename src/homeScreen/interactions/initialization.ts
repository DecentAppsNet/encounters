import { getConnectionModelId, isLlmConnected } from "@/llm/llmUtil";
import { initChat } from "./chat";
import { loadEncounter, loadEncounterList } from "@/encounters/encounterUtil";
import WrongModelDialog from "../dialogs/WrongModelDialog";
import { getLastEncounterUrl } from "@/persistence/lastEncounter";

const DEFAULT_ENCOUNTER_URL = 'encounters/troll.md';

export async function init(setEncounter:Function, setEncounterList:Function, setLines:Function, setModalDialogName:Function):Promise<boolean> {
  if (!isLlmConnected()) return false; // This initialization requires LLM connection.

  // It's going to double-load in dev environment, and that's harmless. If you decide to add a flag check, you also
  // need to do something like have 3 potential return states, e.g., failed-try-again-after-llm-load, failed-dont-try-again, success.

  const encounterUrl = await getLastEncounterUrl() ?? DEFAULT_ENCOUNTER_URL;
  const encounter = await loadEncounter(encounterUrl);
  const encounterList = await loadEncounterList(encounterUrl);
  setEncounterList(encounterList);
  initChat(encounter, setLines);
  setEncounter(encounter);
  if (encounter.model !== getConnectionModelId()) setModalDialogName(WrongModelDialog.name);
  return true;
}