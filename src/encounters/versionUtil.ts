import { isNumeric } from "@/common/regExUtil";

/* Version parsing rules must stay the same across all versions of encounter format.

   On the first line of the file:
   "<!-- Encounter v" + major version# + "." + minor version# + "-->" + [LINEFEED | EOT]

   Example:
   <!-- Encounter v1.0 -->
*/
const SUFFIX = " -->";
function _parseVersion(text:string, formatType:string):string {
  const endLinePos = text.indexOf('\n');
  const line = endLinePos === -1 ? text.trim() : text.substring(0, endLinePos).trim();
  const prefix = `<!-- ${formatType} v`;
  if (!line.startsWith(prefix)) throw Error('First line did not start with a valid version prefix.');
  if (!line.endsWith(SUFFIX)) throw Error('First line did not end with a valid version suffix.');
  
  const version = line.substring(prefix.length, line.length - SUFFIX.length);
  if (version.length === 0) throw Error('Missing version# on first line.');
  
  let periodCount = 0;
  for(let pos = 0; pos < version.length; ++pos) {
    const char = version[pos];
    if (!isNumeric(char) && char !== '.') throw Error('Invalid character in version# on first line.');
    if (char === '.') ++periodCount;
  }
  if (periodCount !== 1) throw Error('Version# is invalid format.');
  return version;
}

export function parseEncounterVersion(text:string):string {
  return _parseVersion(text, 'Encounter');
}

export function parseEncounterListVersion(text:string):string {
  return _parseVersion(text, 'EncounterList');
}

export function majorVersion(version:string):number {
  const periodPos = version.indexOf('.');
  if (periodPos === -1) throw Error('Invalid version format: missing period delimiter.');
  const majorVersionStr = version.substring(0, periodPos);
  const majorVersion = parseInt(majorVersionStr, 10);
  if (isNaN(majorVersion)) throw Error('Invalid major version number format.');
  return majorVersion;
}