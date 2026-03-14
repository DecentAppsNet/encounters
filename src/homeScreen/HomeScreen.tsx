import { useEffect, useState } from "react";

import styles from './HomeScreen.module.css';
import { init } from "./interactions/initialization";
import LoadScreen from '@/loadScreen/LoadScreen';
import TopBar from '@/components/topBar/TopBar';
import Chat from "@/components/chat/Chat";
import { TextConsoleLine } from "@/components/textConsole/TextConsoleBuffer";
import { startFromUrl, submitPrompt } from "./interactions/chat";
import Encounter from "@/encounters/types/Encounter";
import ContentButton from "@/components/contentButton/ContentButton";
import DiagnosticDialog from "./dialogs/DiagnosticDialog";
import AboutDialog from "./dialogs/AboutDialog";
import WrongModelDialog from "./dialogs/WrongModelDialog";
import { getRecentPrompts } from "@/persistence/recentPrompts";
import EncounterList from "@/encounters/types/EncounterList";
import EncounterSelector from "./EncounterSelector";
import { isSpeechAvailable, isSpeechEnabled as getIsSpeechEnabled, initSpeech, toggleSpeech } from "@/speech/speechUtil";
import MicrophonePermissionDialog from "@/loadScreen/MicrophonePermissionDialog";

function HomeScreen() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lines, setLines] = useState<TextConsoleLine[]>([]);
  const [encounter, setEncounter] = useState<Encounter|null>(null);
  const [encounterList, setEncounterList] = useState<EncounterList|null>(null);
  const [modalDialogName, setModalDialogName] = useState<string|null>(null);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState<boolean>(getIsSpeechEnabled());
  
  useEffect(() => {
    if (isLoading) return;

    init(setEncounter, setEncounterList, setLines, setModalDialogName).then(isLlmConnected => { 
      if (!isLlmConnected) { setIsLoading(true); return; }
    });
  }, [isLoading]);

  useEffect(() => {
    if (!encounter) return;
    getRecentPrompts(encounter.title).then(setRecentPrompts);
  }, [encounter]);

  if (isLoading) return <LoadScreen onComplete={() => setIsLoading(false)} />;
  if (!encounter) return null;

  return (
    <div className={styles.container}>
      <TopBar onAboutClick={() => setModalDialogName(AboutDialog.name)}/>
      <div className={styles.content}>
        <EncounterSelector encounterList={encounterList} onSelect={(url) => startFromUrl(url, setLines, setEncounter)} />
        <h1>{encounter.title}</h1>
        <Chat 
          className={styles.chat} lines={lines} 
          onChatInput={(prompt) => submitPrompt(prompt, setRecentPrompts)} 
          recentPrompts={recentPrompts} 
          isSpeechEnabled={isSpeechEnabled}
          onToggleSpeech={() => {
            if (!isSpeechAvailable()) { setModalDialogName('MicrophonePermissionDialog'); return; }
            toggleSpeech(); setIsSpeechEnabled(getIsSpeechEnabled());
          }}
        />
      </div>
      <div className={styles.encounterActions}>
        <h1>Encounter</h1>
        <ContentButton onClick={() => setModalDialogName(DiagnosticDialog.name)} text="Diagnostics" />
      </div>
      <DiagnosticDialog
        isOpen={modalDialogName === DiagnosticDialog.name}
        onClose={() => setModalDialogName(null)}
      />
      <AboutDialog
        isOpen={modalDialogName === AboutDialog.name}
        onClose={() => setModalDialogName(null)}
      />
      <WrongModelDialog
        expectedModelId={encounter ? encounter.model : 'unknown'}
        isOpen={modalDialogName === WrongModelDialog.name}
        onClose={() => setModalDialogName(null)}
      />
      <MicrophonePermissionDialog
        isOpen={modalDialogName === 'MicrophonePermissionDialog'}
        onApprove={async () => {
          setModalDialogName(null);
          await initSpeech(() => {/* no-op */});
          toggleSpeech();
          setIsSpeechEnabled(getIsSpeechEnabled());
        }}
        onSkip={() => setModalDialogName(null)}
      />
    </div>
  );
}

export default HomeScreen;