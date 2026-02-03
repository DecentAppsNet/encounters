import { useEffect, useState } from "react";

import styles from './HomeScreen.module.css';
import { init } from "./interactions/initialization";
import LoadScreen from '@/loadScreen/LoadScreen';
import TopBar from '@/components/topBar/TopBar';
import Chat from "@/components/chat/Chat";
import { TextConsoleLine } from "@/components/textConsole/TextConsoleBuffer";
import { restartEncounter, submitPrompt, updateEncounter } from "./interactions/chat";
import Encounter from "@/encounters/types/Encounter";
import ContentButton from "@/components/contentButton/ContentButton";
import EncounterConfigDialog from "./dialogs/EncounterConfigDialog";
import { importEncounterFile } from "./interactions/import";
import { downloadEncounter } from "./interactions/export";

function HomeScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lines, setLines] = useState<TextConsoleLine[]>([]);
  const [encounter, setEncounter] = useState<Encounter|null>(null);
  const [modalDialogName, setModalDialogName] = useState<string|null>(null);
  
  useEffect(() => {
    if (isLoading) return;

    init(setEncounter, setLines).then(isLlmConnected => { 
      if (!isLlmConnected) { setIsLoading(true); return; }
    });
  }, [isLoading]);

  if (isLoading) return <LoadScreen onComplete={() => setIsLoading(false)} />;
  if (!encounter) return null;
  
  return (
    <div className={styles.container}>
      <TopBar />
      <div className={styles.content}>
        <h1>{encounter.title}</h1>
        <Chat className={styles.chat} lines={lines} onChatInput={(prompt) => submitPrompt(prompt, setLines)} />
      </div>
      <div className={styles.encounterActions}>
        <h1>Encounter</h1>
        <ContentButton onClick={() => restartEncounter(encounter, setLines)} text="Restart"/>
        <ContentButton onClick={() => setModalDialogName(EncounterConfigDialog.name)} text="Edit" />
        <ContentButton onClick={async () => { 
          const nextEncounter = await importEncounterFile();
          if (nextEncounter) updateEncounter(nextEncounter, setEncounter, setModalDialogName, setLines);
        }} text="Import" />
        <ContentButton onClick={() => downloadEncounter(encounter)} text="Download" />
      </div>
      <EncounterConfigDialog
        isOpen={modalDialogName === EncounterConfigDialog.name}
        encounter={encounter}
        onCancel={() => setModalDialogName(null)}
        onSave={(nextEncounter:Encounter) => { updateEncounter(nextEncounter, setEncounter, setModalDialogName, setLines); }}
      />
    </div>
  );
}

export default HomeScreen;