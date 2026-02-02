import Action from "./Action"
import CharacterTrigger from "./CharacterTrigger"

type EncounterV0 = {
  version:string,
  title:string,
  model:string,
  startActions:Action[],
  instructionActions:Action[],
  characterTriggers:CharacterTrigger[],
  sourceText:string|null // For authoring use cases, source text is needed to preserve comments and formatting. For playback-only use cases, this can be null.
}

export default EncounterV0;