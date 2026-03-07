import styles from './ChatInputBox.module.css';

import ContentButton from '../contentButton/ContentButton';
import {useState, useEffect} from "react";

type Props = {
  onSubmit:(text:string) => void,
  disabled?:boolean,
  recentPrompts:string[],
  isSpeechEnabled:boolean,
  onToggleSpeech:() => void
}

function ChatInputBox(props:Props) {
  const { onSubmit, disabled, recentPrompts, isSpeechEnabled, onToggleSpeech } = props;
  const [text, setText] = useState<string>('');
  const [recentPromptI, setRecentPromptI] = useState<number>(recentPrompts.length);

  useEffect(() => {
    setRecentPromptI(recentPrompts.length);
  }, [recentPrompts])
  
  function _onSubmit() {
    if (text === '') return;
    setRecentPromptI(recentPrompts.length);
    onSubmit(text); // Caller is responsible for adding prompt to recent prompts list.
    setText('');
  }

  function _onSelectUp() {
    if (recentPromptI > 0) {
      const nextPromptI = recentPromptI - 1;
      setRecentPromptI(nextPromptI);
      setText(recentPrompts[nextPromptI]);
    }
  }

  function _onSelectDown() {
    if (recentPromptI < recentPrompts.length - 1) {
      const nextPromptI = recentPromptI + 1;
      setRecentPromptI(nextPromptI);
      setText(recentPrompts[nextPromptI]);
    } else {
      setRecentPromptI(recentPrompts.length);
      setText('');
    }
  }
  
  function _onKeyDown(e:React.KeyboardEvent<HTMLInputElement>) {
    if(e.key === 'Enter' && text !== '') _onSubmit();
    else if (e.key === 'ArrowUp') _onSelectUp();
    else if (e.key === 'ArrowDown') _onSelectDown();
  }
  
  const speechButtonText = isSpeechEnabled ? 'Disable Speech' : 'Enable Speech';
  return (
    <div className={styles.container}>
      <input className={styles.textInput} type="text" placeholder={'Say something...'} value={text} 
        onChange={(e) => setText(e.target.value)} onKeyDown={_onKeyDown} disabled={disabled}/>
      <ContentButton onClick={_onSubmit} text="Submit" disabled={disabled}/>
      <ContentButton onClick={onToggleSpeech} text={speechButtonText} disabled={disabled}/>
    </div>
  );
}

export default ChatInputBox;