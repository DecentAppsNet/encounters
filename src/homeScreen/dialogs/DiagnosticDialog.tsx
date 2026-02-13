import ModalDialog from "@/components/modalDialogs/ModalDialog";
import DialogButton from "@/components/modalDialogs/DialogButton";
import DialogFooter from "@/components/modalDialogs/DialogFooter";
import { getSystemMessage, getVariables } from "../interactions/chat";
import styles from './DiagnosticDialog.module.css';

type Props = { 
  isOpen:boolean,
  onClose:() => void
}

function _renderVariables(variables:{[name:string]:string}) {
  const variableEntries = Object.entries(variables).filter(([_, value]) => value !== undefined);
  if (!variableEntries.length) return <p>No variables set.</p>;

  return (
    <ul>
        {variableEntries.map(([name, value]) => (<li key={name}>{name}={'' + value}</li>))}
    </ul>
  );
}

function DiagnosticDialog({isOpen, onClose}:Props) {
  if (!isOpen) return null;

  const systemMessage = getSystemMessage() || 'No system message set.';
  const variables = getVariables();
  const variablesContent = _renderVariables(variables);

  return (
    <ModalDialog isOpen={isOpen} title='Diagnostics' onCancel={onClose}>
      
      <div className={styles.variableList}>
        <h1>Current Variables</h1>
        {variablesContent}
      </div>
      
      <div className={styles.systemMessage}>
        <h1>System Message for Last Prompt</h1>
        <p>{systemMessage}</p>
      </div>
      
      <DialogFooter>
        <DialogButton text='Close' onClick={onClose} isPrimary/>
      </DialogFooter>
    </ModalDialog>
  );
}

export default DiagnosticDialog;