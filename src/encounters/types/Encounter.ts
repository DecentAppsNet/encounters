import EncounterV0 from "../v0/types/Encounter";

/* Versioning strategy - major (first #) increments for breaking changes,
   minor increments for non-breaking changes, which would tend to be additive
   changes to the data structure. If reading a data structure with a 
   smaller version# than the current one, perform a chained upgrade. */
type Encounter = EncounterV0;
export const LATEST_MAJOR_VERSION = 0;

export default Encounter;