import { useState, useEffect } from 'react';

import CharacterSpriteset from '@/sprites/types/CharacterSpriteset';
import Canvas from '../canvas/Canvas';
import styles from './AudienceView.module.css';
import CharacterDrawState from '@/sprites/types/CharacterDrawState';
import { createCharacterDrawState, drawCharacter } from '@/sprites/characterSpriteUtil';

const CROWD_IDLE_UPDATE_INTERVAL = 500; // msecs

type Props = {
  characterSpriteset:CharacterSpriteset|null
}

let lastCrowdUpdate = 0;

function _getRandomInt(min:number, max:number):number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function _updateCrowdForIdleMovement(characterDrawStates:CharacterDrawState[]) {
  for(let i = 0; i < characterDrawStates.length; ++i) {
    const drawState = characterDrawStates[i];
    drawState.bodyFrameNo = _getRandomInt(0, drawState.sprite.bodyRects.length);
    if (drawState.bodyFrameNo === 0) drawState.happiness = Math.random();
  }
}

function _onDraw(characterDrawStates:CharacterDrawState[], context:CanvasRenderingContext2D) {
  const now = performance.now();
  if (!lastCrowdUpdate || (now - lastCrowdUpdate) > CROWD_IDLE_UPDATE_INTERVAL) {
    _updateCrowdForIdleMovement(characterDrawStates);
    lastCrowdUpdate = now;
  }
  context.fillStyle = 'red';
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  for(let i = 0; i < characterDrawStates.length; ++i) {
    drawCharacter(characterDrawStates[i], context);
  }
  
}

function AudienceView({characterSpriteset}:Props) {
  const [characterDrawStates, setCharacterDrawStates] = useState<CharacterDrawState[]>([]);

  useEffect(() => {
    if (!characterSpriteset) return;
    const nextCharacterDrawStates = [
      // Row 1
      createCharacterDrawState(characterSpriteset, 'Jock', {x:0, y:70, w:128*.9, h:256*.9}, 2, 4),
      createCharacterDrawState(characterSpriteset, 'Librarian', {x:110, y:80, w:128*.9, h:256*.9}, 2, 4),
      createCharacterDrawState(characterSpriteset, 'Ice Skater', {x:220, y:70, w:128*.9, h:256*.9}, 2, 4),
      createCharacterDrawState(characterSpriteset, 'Plumber', {x:330, y:80, w:128*.9, h:256*.9}, 2, 4),
      createCharacterDrawState(characterSpriteset, 'Barber', {x:440, y:70, w:128*.9, h:256*.9}, 2, 4),
      
      // Row 2
      createCharacterDrawState(characterSpriteset, 'Clown', {x:60, y:100, w:128, h:256}, 2, 4),
    ];
    setCharacterDrawStates(nextCharacterDrawStates);
  }, [characterSpriteset]);

  return (<div className={styles.container}>
    <Canvas onDraw={(context) => _onDraw(characterDrawStates, context)} isAnimated/>
  </div>);
}

export default AudienceView;