import Action from "./Action"
import CharacterTrigger from "./CharacterTrigger"
import Memory from "./Memory";

type EncounterV0 = {
  version:string,
  title:string,
  model:string,
  startActions:Action[],
  instructionActions:Action[],
  characterTriggers:CharacterTrigger[],
  memories:Memory[]
}

export default EncounterV0;