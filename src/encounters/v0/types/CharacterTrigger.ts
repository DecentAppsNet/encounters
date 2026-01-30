import Action from "./Action"

type CharacterTrigger = {
  criteria:string,
  triggerCode:string,
  actions:Action[]
}

export default CharacterTrigger;