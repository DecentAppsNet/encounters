import { useState } from "react";

import ModalDialog from "@/components/modalDialogs/ModalDialog";
import DialogButton from "@/components/modalDialogs/DialogButton";
import DialogFooter from "@/components/modalDialogs/DialogFooter";
import Encounter from "@/encounters/types/Encounter";
import styles from './EncounterConfigDialog.module.css';
import { assert } from "decent-portal";

type Props = {
  encounter:Encounter,
  isOpen:boolean,
  onCancel:() => void,
  onSave:(encounter:Encounter) => void
}

function _nextOutcomes(currentOutcomes:Record<string, string>, outcomeNumber:number, value:string):Record<string, string> {
  assert(outcomeNumber > 0 && outcomeNumber <= 9);
  const nextOutcomes = { ...currentOutcomes };
  nextOutcomes[`${outcomeNumber}`] = value;
  return nextOutcomes;
}

function _findOutcomeFieldCount(outcomes:Record<string,string>):number {
  let i = 9;
  for(; i > 0; --i) {
    const value = outcomes[`${i}`];
    if (value && value.trim() !== '') break;
  }
  return (i === 9) ? 9 : i + 1;
}

function EncounterConfigDialog(props:Props) {
  const {encounter, onCancel, onSave, isOpen} = props;
  const [title, setTitle] = useState<string>(encounter.title);
  const [preamble, setPreamble] = useState<string>(encounter.preamble);
  const [systemMessage, setSystemMessage] = useState<string>(encounter.systemMessage);
  const [outcomes, setOutcomes] = useState<Record<string, string>>(() => { return { ...encounter.outcomes }; });

  const outcomeFieldCount = _findOutcomeFieldCount(outcomes);
  const outcomeFields = [];
  for (let outcomeI = 0; outcomeI < outcomeFieldCount; ++outcomeI) {
    const outcomeNumber = outcomeI + 1;
    outcomeFields.push(
      <div key={outcomeNumber}>
        <label htmlFor={`outcome${outcomeNumber}`} className={styles.formLabel}>Outcome {outcomeNumber}:</label>
        <input type="text" id={`outcome${outcomeNumber}`} className={styles.formInput} value={outcomes[`${outcomeNumber}`] || ''} 
          onChange={e => setOutcomes(_nextOutcomes(outcomes, outcomeNumber, e.target.value))}
          placeholder={`displayed text for outcome ${outcomeNumber}`} />
      </div>
    );
  }

  return (
    <ModalDialog isOpen={isOpen} title='Configure Encounter'>
      <label htmlFor="title" className={styles.formLabel}>Title:</label>
      <input type="text" id="title" className={styles.formInput} value={title} onChange={e => setTitle(e.target.value)}
         placeholder='a title describing the encounter' />
      <label htmlFor="preamble" className={styles.formLabel}>Preamble:</label>
      <textarea id="preamble" className={styles.formInput} value={preamble} onChange={e => setPreamble(e.target.value)}
         rows={4} placeholder='this text displays to user at beginning of session, but is not sent to LLM' />
      <label htmlFor="systemMessage" className={styles.formLabel}>Instructions:</label>
      <textarea id="systemMessage" className={styles.formInput} value={systemMessage} onChange={e => setSystemMessage(e.target.value)}
         rows={4} placeholder='this text is sent to LLM with each prompt, but not displayed to user' />
      {outcomeFields}
      
      <DialogFooter>
        <DialogButton text='Cancel' onClick={onCancel} />
        <DialogButton text='Save' onClick={() => onSave({title, preamble, systemMessage, outcomes})} isPrimary />
      </DialogFooter>
    </ModalDialog>
  );
}

export default EncounterConfigDialog;