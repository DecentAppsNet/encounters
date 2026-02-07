import styles from "./ChatHistory.module.css";
import TextConsole from "../textConsole/TextConsole";
import { TextConsoleLine } from "../textConsole/TextConsoleBuffer";
import WaitingEllipsis from "../waitingEllipsis/WaitingEllipsis";

export const PLAYER_PREFIX = 'PLAYER:';
export const NARRATION_PREFIX = 'NARRATION:';

type Props = {
  lines:TextConsoleLine[]
}

function _onRenderLine(key:number, text:string) {
  let className = '';
  if (text === '...') {
    return <WaitingEllipsis />
  } else if (text.startsWith(PLAYER_PREFIX)) {
    text = text.substring(PLAYER_PREFIX.length);
    className = styles.playerLine;
  } else if (text.startsWith(NARRATION_PREFIX)) {
    text = text.substring(NARRATION_PREFIX.length);
    className = styles.narrativeLine;
  } else {
    className = styles.characterLine;
  }
  if (text.endsWith('...')) {
    text = text.substring(0, text.length - 3);
    return (<p className={className} key={key}>{text}<WaitingEllipsis trailing/></p>);
  } else {
    return (<p className={className} key={key}>{text}</p>);
  }
}

function ChatHistory(props:Props) {
  const { lines } = props;
  
  return (
    <TextConsole className={styles.container} lines={lines} onRenderLine={_onRenderLine} />
  );
}

export default ChatHistory;