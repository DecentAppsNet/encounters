import Code from "@/spielCode/types/Code"
import Action from "./Action"

type Memory = {
  enabledCriteria:Code|null,
  matchPhrases:string[],
  actions:Action[]
}

export default Memory;