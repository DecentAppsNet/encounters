// Type for associative array
type Sections = { [sectionName:string]:string };
type NameValues = { [name:string]:string };

// E.g., "hello world" -> "helloWorld".
export function textToCamelCase(text:string):string {
  return text
    .split(' ')
    .filter(word => word.trim() !== '')
    .map((word, i) => (i === 0 ? word[0].toLowerCase() : word[0].toUpperCase()) + word.slice(1))
    .join('');
}

// Parse the heading sections of a markdown text. The header of each section is the section name, and the content of each section is the value for the section.
function _parseSectionArrays(markdownText:string, indentLevel:number = 1, useCamelCase:boolean = false):{sectionNames:string[], sectionContents:string[]} {
  const _addSection = (_sectionName:string, _sectionContent:string) => {
    sectionNames.push(_sectionName);
    sectionContents.push(_sectionContent.trim());
  }

  const lines = markdownText.split('\n').filter(line => line.trim().length > 0);
  const sectionNames:string[] = [], sectionContents:string[] = [];

  const prefix = '#'.repeat(indentLevel) + ' ';
  const prefixLength = prefix.length;
  let sectionName = '';
  let sectionContent = '';
  for (const line of lines) {
    if (line.startsWith(prefix)) {
      if (sectionName) _addSection(sectionName, sectionContent); // Store previous section before beginning a new one.
      sectionName = line.slice(prefixLength).trim();
      if (useCamelCase) sectionName = textToCamelCase(sectionName);
      sectionContent = '';
    } else {
      sectionContent += line + '\n';
    }
  }
  if (sectionName) _addSection(sectionName, sectionContent); // Store the last section.

  return {sectionNames, sectionContents};
}

// Parse the heading sections of a markdown text. The header of each section is the sectionName key, and the content of each section is the value.
export function parseSections(markdownText:string, indentLevel:number = 1, useCamelCase:boolean = false):Sections {
  const sections:Sections = {};
  const {sectionNames, sectionContents} = _parseSectionArrays(markdownText, indentLevel, useCamelCase);
  for (let i = 0; i < sectionNames.length; ++i) {
    sections[sectionNames[i]] = sectionContents[i];
  }
  return sections;
}

// Parse the lines of a markdown text. Remove any extra whitespace or bullet points.
function _parseLines(markdownText:string):string[] {
  const lines = markdownText.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line && line.length > 0);
}

// Parse the value portion of markdown text and replace any supported escaping, e.g. "\n".
function _unescapeValue(text:string):string {
  return text.replace(/\\n/g, '\n'); // Replace "\n" with a newline character.
}

export function parseNameValueLines(markdownText:string):NameValues {
  const nameValues:NameValues = {};
  const lines = _parseLines(markdownText);
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    if (!line.startsWith('* ')) continue;
    const hyphenPos = line.indexOf('=', 2);
    if (hyphenPos === -1) continue;
    const name = line.slice(2, hyphenPos).trim();
    const value = _unescapeValue(line.slice(hyphenPos + 1).trim());
    nameValues[name] = value;
  }
  return nameValues;
}