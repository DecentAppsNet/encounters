import { baseUrl } from "@/common/urlUtil";
import EncounterSession from "@/encounters/EncounterSession";

function _goUrl(urlPath:string, session:EncounterSession):void {
  session.startFromUrl(baseUrl(urlPath));
}

export function bindEncounterFunctions(session:EncounterSession) {
  session.bindFunction((urlPath:string) => _goUrl(urlPath, session), 'goUrl');
}