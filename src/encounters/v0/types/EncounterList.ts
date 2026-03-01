type EncounterListEntry = {
  title:string,
  url:string
}

type EncounterListV0 = {
  version:string,
  entries:EncounterListEntry[],
  lastEncounterI:number|null
}

export default EncounterListV0;