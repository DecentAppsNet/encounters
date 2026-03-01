import EncounterListV0 from "../v0/types/EncounterList";

/* Versioning strategy - major (first #) increments for breaking changes,
   minor increments for non-breaking changes, which would tend to be additive
   changes to the data structure. If reading a data structure with a 
   smaller version# than the current one, perform a chained upgrade. 
   
   Synchronize versions with Encounter. Both versions update if either data structure needs a version bump. */
type EncounterList = EncounterListV0;

export default EncounterList;