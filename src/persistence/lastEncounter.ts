import { getText, setText } from "./pathStore";

const key = '/lastEncounter.txt';

export async function getLastEncounterUrl():Promise<string|null> {
  return await getText(key);
}

export async function setLastEncounterUrl(encounterUrl:string) {
  return await setText(key, encounterUrl);
}