import { useState, useEffect } from 'react';

import Selector from "@/components/selector/Selector";
import EncounterList from "@/encounters/types/EncounterList"
import { assertNonNullable } from 'decent-portal';

type Props = {
  encounterList:EncounterList|null,
  onSelect:(encounterUrl:string) => void
}

function EncounterSelector({encounterList, onSelect}:Props) {
  const [selectedOptionNo, setSelectedOptionNo] = useState<number>(0);

  if (!encounterList) return null;

  useEffect(() => {
    if (!encounterList) return;
    setSelectedOptionNo(encounterList.lastEncounterI ?? 0);
  }, [encounterList]);

  function _select(optionNo:number) {
    assertNonNullable(encounterList);
    setSelectedOptionNo(optionNo);
    onSelect(encounterList.entries[optionNo].url);
  }

  const optionNames = encounterList.entries.map(e => e.title);
  return <Selector optionNames={optionNames} selectedOptionNo={selectedOptionNo} onClick={_select}/>;
}

export default EncounterSelector;