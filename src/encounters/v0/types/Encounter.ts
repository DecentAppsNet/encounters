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
  memories:Memory[],
  sourceText:string|null // For authoring use cases, source text is needed to preserve comments and formatting. For playback-only use cases, this can be null.
}

export default EncounterV0;