export const setupPlaybackControls = (animTimeline) => {
  // playback buttons
  const forwardButton = document.querySelector('.playback-button--forward');
  const backwardButton = document.querySelector('.playback-button--backward');
  const pauseButton = document.querySelector('.playback-button--pause');
  const fastForwardButton = document.querySelector('.playback-button--fast-forward');
  const skipButton = document.querySelector('.playback-button--enable-skipping');

  // playback button class constants
  const PRESSED = 'playback-button--pressed';
  const PRESSED2 = 'playback-button--pressed--alt-color';
  const DISABLED_FROM_STEPPING = 'playback-button--disabledFromStepping';
  const DISABLED_POINTER_FROM_STEPPING = 'playback-button--disabledPointerFromStepping'; // disables pointer
  const DISABLED_FROM_EDGE = 'playback-button--disabledFromTimelineEdge'; // disables pointer and grays out button
  const DISABLED_FROM_PAUSE = 'playback-button--disabledFromPause';

  // detects if a button was left-clicked (event.which === 1) or a mapped key was pressed (event.which === undefined)
  const isLeftClickOrKey = (event) => event.which === 1 || event.which === undefined;

  let holdingFastKey = false;
  let holdingFastButton = false;


  forwardButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      if (animTimeline.getIsStepping() || animTimeline.getIsPaused() || animTimeline.atEnd) { return; }
      
      forwardButton.classList.add(PRESSED);
      backwardButton.classList.remove(DISABLED_FROM_EDGE); // if stepping forward, we of course won't be at the left edge of timeline
      backwardButton.classList.add(DISABLED_FROM_STEPPING);
      forwardButton.classList.add(DISABLED_POINTER_FROM_STEPPING);

      animTimeline.step('forward')
      .then(() => {
        forwardButton.classList.remove(PRESSED);
        forwardButton.classList.remove(DISABLED_POINTER_FROM_STEPPING);
        backwardButton.classList.remove(DISABLED_FROM_STEPPING);
        if (animTimeline.atEnd) { forwardButton.classList.add(DISABLED_FROM_EDGE); }
      });
    }
  });

  backwardButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      if (animTimeline.getIsStepping() || animTimeline.getIsPaused() || animTimeline.atBeginning) { return; }

      backwardButton.classList.add(PRESSED);
      forwardButton.classList.remove(DISABLED_FROM_EDGE);
      forwardButton.classList.add(DISABLED_FROM_STEPPING);
      backwardButton.classList.add(DISABLED_POINTER_FROM_STEPPING);

      animTimeline.step('backward')
      .then(() => {
        backwardButton.classList.remove(PRESSED);
        forwardButton.classList.remove(DISABLED_FROM_STEPPING);
        backwardButton.classList.remove(DISABLED_POINTER_FROM_STEPPING);
        if (animTimeline.atBeginning) { backwardButton.classList.add(DISABLED_FROM_EDGE); }
      });
    }
  });

  pauseButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      if (animTimeline.togglePause()) {
        pauseButton.classList.add(PRESSED);
        forwardButton.classList.add(DISABLED_FROM_PAUSE);
        backwardButton.classList.add(DISABLED_FROM_PAUSE);
      }
      else {
        pauseButton.classList.remove(PRESSED);
        forwardButton.classList.remove(DISABLED_FROM_PAUSE);
        backwardButton.classList.remove(DISABLED_FROM_PAUSE);
      }
    }
  });

  skipButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      if (animTimeline.toggleSkipping())
        { skipButton.classList.add(PRESSED); }
      else
        { skipButton.classList.remove(PRESSED); }
    }
  });

  fastForwardButton.addEventListener('mousedown', e => {
    if (isLeftClickOrKey(e)) {
      if (e.which === 1) { holdingFastButton = true };
      fastForwardButton.classList.add(PRESSED2);
      animTimeline.setPlaybackRate(7);
      document.addEventListener('mouseup', () => {
        holdingFastButton = false;
        if (!(holdingFastButton || holdingFastKey)) {
          fastForwardButton.classList.remove(PRESSED2);
          animTimeline.setPlaybackRate(1);
        }
      }, {once: true});
    }
  })

  // map keys to playback controls
  window.addEventListener('keydown', e => {
    // right arrow key steps forward
    if (e.key === 'ArrowRight') {
      e.preventDefault(); // prevent from moving page right
      forwardButton.dispatchEvent(new Event('mousedown'));
    }

    // left arrow key steps backward
    if (e.key === 'ArrowLeft') {
      e.preventDefault(); // prevent from moving page left
      backwardButton.dispatchEvent(new Event('mousedown'));
    }

    // hold 'f' to increase playback rate (fast-forward)
    if (e.key.toLowerCase() === 'f' && !e.repeat) {
      holdingFastKey = true;
      fastForwardButton.dispatchEvent(new Event('mousedown'));
    }

    // 's' to toggle skipping
    if (e.key.toLowerCase() === 's' && !e.repeat) { skipButton.dispatchEvent(new Event('mousedown')); }

    // ' ' (Space) to pause or unpause
    if (e.key.toLowerCase() === ' ' && !e.repeat) {
      e.preventDefault(); // prevent from moving page down
      pauseButton.dispatchEvent(new Event('mousedown'));
    }
  });

  window.addEventListener('keyup', e => {
    // release 'f' to set playback rate back to 1 (stop fast-forwarding)
    if (e.key.toLowerCase() === 'f') {
      holdingFastKey = false;
      if (!(holdingFastButton || holdingFastKey))
      {
        fastForwardButton.classList.remove(PRESSED2);
        animTimeline.setPlaybackRate(1);
      }
    }
  });

  // animTimeline.skipTo('focus comp 2');
  // animTimeline.skipTo('found max');
  // animTimeline.skipTo('OPT point 1');
  // animTimeline.skipTo('start');
  // animTimeline.skipTo('finish a main card');
  // animTimeline.skipTo('replace formula container contents');
  // animTimeline.skipTo('explain naive');
  // animTimeline.skipTo('introduce memoization');

  // skips to tag and checks to see if DISABLED_FROM_EDGE should be added or removed from forward/backward buttons
  const skipTo = (tag, offset) => {
    animTimeline.skipTo(tag, offset)
    .then(() => {
      if (animTimeline.atBeginning) { backwardButton.classList.add(DISABLED_FROM_EDGE); }
      else { backwardButton.classList.remove(DISABLED_FROM_EDGE); }

      if (animTimeline.atEnd) { forwardButton.classList.add(DISABLED_FROM_EDGE); }
      else { forwardButton.classList.remove(DISABLED_FROM_EDGE); }
    })
  };

  // skipTo('start');
};
