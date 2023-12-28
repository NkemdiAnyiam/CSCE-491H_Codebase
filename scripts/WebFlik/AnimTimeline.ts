import { AnimSequence } from "./AnimSequence";

type AnimTimelineConfig = {
  debugMode: boolean;
  timelineName: string;
  findsButtons: boolean;
};

type SequenceOperation = (sequence: AnimSequence) => void;

// playback button class constants
const PRESSED = 'playback-button--pressed';
const DISABLED_FROM_STEPPING = 'playback-button--disabledFromStepping';
const DISABLED_POINTER_FROM_STEPPING = 'playback-button--disabledPointerFromStepping'; // disables pointer
const DISABLED_FROM_EDGE = 'playback-button--disabledFromTimelineEdge'; // disables pointer and grays out button
const DISABLED_FROM_PAUSE = 'playback-button--disabledFromPause';

class WbfkPlaybackButton extends HTMLElement {
  action: `step-${'forward' | 'backward'}` | 'pause' | 'fast-forward' | 'toggle-skipping';
  shortcutKey: KeyboardEvent['key'] | null;
  triggerMode: 'press' | 'hold' = 'press';
  allowHolding: boolean = false; // repeat key
  private _mouseHeld: boolean = false;
  private _shortcutHeld: boolean = false;
  private _active: boolean = false;
  public get mouseHeld(): boolean { return this._mouseHeld; }
  /** @internal */
  public set mouseHeld(value: boolean) { this._mouseHeld = value; }
  public get shortcutHeld(): boolean { return this._shortcutHeld; }
  /** @internal */
  public set shortcutHeld(value: boolean) { this._shortcutHeld = value; }
  public get active(): boolean { return this._active; }
  /** @internal */
  public set active(value: boolean) { this._active = value; }

  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    
    this.shortcutKey = this.getAttribute('shortcut') ?? null;
    this.allowHolding = this.hasAttribute('allow-holding');
    const triggerMode = this.getAttribute('trigger') as typeof this.triggerMode ?? 'press';
    switch(triggerMode) {
      case "press": break;
      case "hold": break;
      default: throw new RangeError(`Invalid trigger attribute value ${triggerMode} for WebFlik playback button. Must be 'press' or 'hold'.`)
    }
    this.setAttribute('trigger', triggerMode);
    this.triggerMode = triggerMode;
    
    const action = this.getAttribute('action') as typeof this.action;
    let buttonShapeHtmlStr: string;
    switch(action) {
      case "step-forward":
        buttonShapeHtmlStr = `<polygon points="22.468 81.83 67.404 40.915 22.468 0 22.468 81.83"/>`;
        break;
      case "step-backward":
        buttonShapeHtmlStr = `<polygon points="59.362 81.83 14.426 40.915 59.362 0 59.362 81.83"/>`;
        break;
      case "pause":
        buttonShapeHtmlStr = `<path d="M13.753,0h17.43V81.83H13.753ZM49.974,81.83H67.4V0H49.974Z"/>`;
        break;
      case "fast-forward":
        buttonShapeHtmlStr = `<path d="M0,0,36.936,40.915,0,81.83ZM44.936,81.83,81.872,40.915,44.936,0Z"/>`;
        break;
      case "toggle-skipping":
        buttonShapeHtmlStr = `<path d="M0,0,23.866,17.34,0,34.681ZM28.982,34.681,52.848,17.34,28.982,0Zm28.982,0L81.83,17.34,57.964,0ZM81.83,47.149,57.964,64.489,81.83,81.83Zm-28.982,0L28.982,64.489,52.848,81.83Zm-28.982,0L0,64.489,23.866,81.83Z"/>`;
        break;
      default: throw new RangeError(`Invalid action attribute value ${action} for WebFlik playback button. Must be 'step-forward', 'step-backward', 'pause', 'fast-forward', or 'toggle-skipping'.`);
    }
    this.action = action;

    const htmlString = `
      <style>
        :host {
          width: 8rem;
          height: 8rem;
          display: inline-block;
          background-color: var(--wbfk-playback-button-background-color);
          padding: 0.5rem !important;
        
          box-shadow: -1rem 1rem 1rem rgba(0, 0, 0, 0.4);
          transform: scale(1);
          transition: all 0.02s;
        
          cursor: pointer;
        }
        
        :host(.playback-button--disabledPointerFromPause),
        :host(.playback-button--disabledPointerFromStepping) {
          cursor: not-allowed;
        }
        
        :host(.playback-button--disabledFromTimelineEdge),
        :host(.playback-button--disabledFromPause),
        :host(.playback-button--disabledFromStepping) {
          background-color: var(--wbfk-playback-button-disabled-color);
          cursor: not-allowed;
        }
        
        :host(.playback-button--pressed) {
          transform: scale(0.90);
          box-shadow: -0.2rem 0.2rem 0.2rem rgba(0, 0, 0, 0.8);
        }
        
        :host(.playback-button--pressed[trigger="press"]) {
          background-color: var(--wbfk-playback-button-press-color);
        }
        
        :host(.playback-button--pressed[trigger="hold"]) {
          background-color: var(--wbfk-playback-button-hold-color);
        }
        
        .playback-button__symbol {
          width: 100%;
          height: auto;
          fill: var(--wbfk-playback-button-symbol-color);
        }
      </style>

      <svg class="playback-button__symbol" xmlns="http://www.w3.org/2000/svg" width="81.83" height="81.83" viewBox="0 0 81.83 81.83">
        <rect width="81.83" height="81.83" transform="translate(81.83 81.83) rotate(-180)" fill="none"/>
        ${buttonShapeHtmlStr}
      </svg>
    `;

    const template = document.createElement('template');
    template.innerHTML = htmlString;
    const element = template.content.cloneNode(true);
    shadow.append(element);

    this.setUpListeners();
  }

  setUpListeners(): void {
    // handle button activation with keyboard shortcut
    if (this.shortcutKey) {
      window.addEventListener('keydown', this.handleShortcutPress);
      window.addEventListener('keyup', this.handleShortcutRelease);
      const actionTitleCase = this.action.split('-').map(stringFrag => stringFrag[0].toUpperCase()+stringFrag.slice(1)).join(' ');
      this.title = `${actionTitleCase} (${this.triggerMode === 'hold' ? 'Hold ' : ''}${this.shortcutKey})`;
    }
    
    // handle button activation with mouse click
    this.addEventListener('mousedown', this.handleMousePress);
    window.addEventListener('mouseup', this.handleMouseRelease);

  }

  activate: () => void = (): void => {};
  deactivate?: () => void = (): void => {};
  styleActivation: () => void = (): void => {};
  styleDeactivation: () => void = (): void => {};

  private handleMousePress = (e: MouseEvent): void => {
    if (e.button !== 0) { return; } // only allow left mouse click
    this.mouseHeld = true;
    if (this.shortcutHeld) { return; }
    if (this.triggerMode === 'press' && this.active === true && this.deactivate) {
      return this.deactivate();
    }
    this.activate();
  }

  private handleMouseRelease = (e: MouseEvent): void => {
    if (e.button !== 0) { return; } // only allow left mouse click
    if (!this.mouseHeld) { return; }
    this.mouseHeld = false;
    if (this.shortcutHeld) { return; }
    if (this.triggerMode !== 'hold') { return; }
    this.deactivate?.();
  }

  private handleShortcutPress = (e: KeyboardEvent): void => {
    if (e.key.toLowerCase() !== this.shortcutKey?.toLowerCase() && e.code !== this.shortcutKey) { return; }
    // if the key is held down and holding is not allowed, return
    if (e.repeat && !this.allowHolding) { return; }

    e.preventDefault();
    this.shortcutHeld = true;
    if (this.mouseHeld) { return; }
    if (this.triggerMode === 'press' && this.active === true && this.deactivate) {
      return this.deactivate();
    }
    this.activate();
  }

  private handleShortcutRelease = (e: KeyboardEvent): void => {
    if (e.key.toLowerCase() !== this.shortcutKey?.toLowerCase() && e.code !== this.shortcutKey) { return; }
    if (!this.shortcutHeld) { return; }
    this.shortcutHeld = false;
    if (this.mouseHeld) { return; }
    if (this.triggerMode !== 'hold') { return; }
    this.deactivate?.();
  }
}
customElements.define('wbfk-playback-button', WbfkPlaybackButton);









type PlaybackButtons = {
  [key in `${'forward' | 'backward' | 'pause' | 'toggleSkipping' | 'fastForward'}Button`]: WbfkPlaybackButton | null;
};

export class AnimTimeline {
  private static id = 0;

  id; // used to uniquely identify this specific timeline
  animSequences: AnimSequence[] = []; // array of every AnimSequence in this timeline
  nextSeqIndex = 0; // index into animSequences
  isStepping = false;
  isSkipping = false; // used to determine whether or not all animations should be instantaneous
  isPaused = false;
  currDirection: 'forward' | 'backward' = 'forward'; // set to 'forward' after stepForward() or 'backward' after stepBackward()
  isAnimating = false; // true if currently in the middle of executing animations; false otherwise
  usingSkipTo = false; // true if currently using skipTo()
  playbackRate = 1;
  config: AnimTimelineConfig;
  // CHANGE NOTE: AnimTimeline now stores references to in-progress sequences and also does not act directly on individual animations
  inProgressSequences: Map<number, AnimSequence> = new Map();

  playbackButtons: PlaybackButtons = {
    backwardButton: null,
    fastForwardButton: null,
    forwardButton: null,
    pauseButton: null,
    toggleSkippingButton: null
  };

  get numSequences(): number { return this.animSequences.length; }
  get atBeginning(): boolean { return this.nextSeqIndex === 0; }
  get atEnd(): boolean { return this.nextSeqIndex === this.numSequences; }

  constructor(config: Partial<AnimTimelineConfig & {animSequences: AnimSequence[]}> = {}) {
    this.id = AnimTimeline.id++;

    if (config.animSequences) {
      this.addSequences(...config.animSequences);
    }

    this.config = {
      debugMode: false,
      timelineName: '',
      findsButtons: true,
      ...config,
    };

    if (this.config.findsButtons) {
      this.playbackButtons = this.setupPlaybackControls();
    }
  }

  setupPlaybackControls(): typeof this.playbackButtons {
    const forwardButton: WbfkPlaybackButton | null = document.querySelector(`wbfk-playback-button[action="step-forward"][timeline-name="${this.config.timelineName}"]`);
    const backwardButton: WbfkPlaybackButton | null = document.querySelector(`wbfk-playback-button[action="step-backward"][timeline-name="${this.config.timelineName}"]`);
    const pauseButton: WbfkPlaybackButton | null = document.querySelector(`wbfk-playback-button[action="pause"][timeline-name="${this.config.timelineName}"]`);
    const fastForwardButton: WbfkPlaybackButton | null = document.querySelector(`wbfk-playback-button[action="fast-forward"][timeline-name="${this.config.timelineName}"]`);
    const toggleSkippingButton: WbfkPlaybackButton | null = document.querySelector(`wbfk-playback-button[action="toggle-skipping"][timeline-name="${this.config.timelineName}"]`);

    if (forwardButton) {
      forwardButton.activate = () => {
        if (this.getIsStepping() || this.getIsPaused() || this.atEnd) { return; }
        
        forwardButton.styleActivation();
        this.step('forward', {viaButton: true}).then(() => { forwardButton.styleDeactivation(); });
      }
      forwardButton.styleActivation = () => {
        forwardButton.classList.add(PRESSED);
        backwardButton?.classList.remove(DISABLED_FROM_EDGE); // if stepping forward, we of course won't be at the left edge of timeline
        backwardButton?.classList.add(DISABLED_FROM_STEPPING);
        forwardButton.classList.add(DISABLED_POINTER_FROM_STEPPING);
      };
      forwardButton.styleDeactivation = () => {
        forwardButton.classList.remove(PRESSED);
        forwardButton.classList.remove(DISABLED_POINTER_FROM_STEPPING);
        backwardButton?.classList.remove(DISABLED_FROM_STEPPING);
        if (this.atEnd) { forwardButton.classList.add(DISABLED_FROM_EDGE); }
      };
    }

    if (backwardButton) {
      backwardButton.activate = () => {
        if (this.getIsStepping() || this.getIsPaused() || this.atBeginning) { return; }

        backwardButton.styleActivation();
        this.step('backward', {viaButton: true}).then(() => { backwardButton.styleDeactivation(); });
      };

      backwardButton.styleActivation = () => {
        backwardButton.classList.add(PRESSED);
        forwardButton?.classList.remove(DISABLED_FROM_EDGE);
        forwardButton?.classList.add(DISABLED_FROM_STEPPING);
        backwardButton.classList.add(DISABLED_POINTER_FROM_STEPPING);
      };
      backwardButton.styleDeactivation = () => {
        backwardButton.classList.remove(PRESSED);
        forwardButton?.classList.remove(DISABLED_FROM_STEPPING);
        backwardButton.classList.remove(DISABLED_POINTER_FROM_STEPPING);
        if (this.atBeginning) { backwardButton.classList.add(DISABLED_FROM_EDGE); }
      };

      backwardButton.classList.add(DISABLED_FROM_EDGE);
    }

    if (pauseButton) {
      pauseButton.activate = () => {
        pauseButton.styleActivation();
        this.togglePause(true, {viaButton: true});
      };
      pauseButton.deactivate = () => {
        pauseButton.styleDeactivation();
        this.togglePause(false, {viaButton: true});
      };

      pauseButton.styleActivation = () => {
        pauseButton.active = true;
        pauseButton.classList.add(PRESSED);
        forwardButton?.classList.add(DISABLED_FROM_PAUSE);
        backwardButton?.classList.add(DISABLED_FROM_PAUSE);
      };
      pauseButton.styleDeactivation = () => {
        pauseButton.active = false;
        pauseButton.classList.remove(PRESSED);
        forwardButton?.classList.remove(DISABLED_FROM_PAUSE);
        backwardButton?.classList.remove(DISABLED_FROM_PAUSE);
      };
    }

    if (fastForwardButton) {
      fastForwardButton.activate = () => {
        fastForwardButton.styleActivation();
        this.setPlaybackRate(7);
      };
      fastForwardButton.deactivate = () => {
        fastForwardButton.styleDeactivation();
        this.setPlaybackRate(1);
      };

      fastForwardButton.styleActivation = () => {
        fastForwardButton.active = true;
        fastForwardButton.classList.add(PRESSED);
      };
      fastForwardButton.styleDeactivation = () => {
        fastForwardButton.active = false;
        fastForwardButton.classList.remove(PRESSED);
      };
    }

    if (toggleSkippingButton) {
      toggleSkippingButton.activate = () => {
        toggleSkippingButton.styleActivation();
        this.toggleSkipping(true, {viaButton: true});
      }
      toggleSkippingButton.deactivate = () => {
        toggleSkippingButton.styleDeactivation();
        this.toggleSkipping(false, {viaButton: true});
      };
      toggleSkippingButton.styleActivation = () => {
        toggleSkippingButton.classList.add(PRESSED);
        toggleSkippingButton.active = true;
      };
      toggleSkippingButton.styleDeactivation = () => {
        toggleSkippingButton.classList.remove(PRESSED);
        toggleSkippingButton.active = false;
      };
    }

    let wasWarned = false;

    const warnButton = (button: WbfkPlaybackButton | null, purpose: string) => {
      if (!button) {
        console.warn(`${purpose} button for timeline named "${this.config.timelineName}" not found.`);
        wasWarned = true;
      }
    }

    warnButton(forwardButton, 'Step Forward');
    warnButton(pauseButton, 'Pause');
    warnButton(backwardButton, 'Step Backward');
    warnButton(fastForwardButton, 'Fast Forward');
    warnButton(toggleSkippingButton, 'Toggle Skipping');
    if (wasWarned) {
      console.warn(
        `For <wbfk-playback-button> tags to be detected, their timeline-name attributes must match this timeline's timelineName config option.`
        + ` If this timeline does not need to detect any buttons, you may set its findsButtons config option to false.`
      );
    }

    return {
      forwardButton, backwardButton, pauseButton, fastForwardButton, toggleSkippingButton,
    };
  }

  addSequences(...animSequences: AnimSequence[]): AnimTimeline {
    for(const animSequence of animSequences) {
      animSequence.parentTimeline = this;
      animSequence.setID(this.id);
    };
    this.animSequences.push(...animSequences);

    return this;
  }

  findSequenceIndex(animSequence: AnimSequence): number {
    return this.animSequences.findIndex((_animSequence) => _animSequence === animSequence);
  }

  // CHANGE NOTE: sequences, and blocks now have base playback rates that are then compounded by parents
  setPlaybackRate(rate: number): AnimTimeline {
    this.playbackRate = rate;
    // set playback rates of currently running animations so that they don't continue to run at regular speed
    this.doForInProgressSequences(sequence => sequence.useCompoundedPlaybackRate());

    return this;
  }
  getPlaybackRate() { return this.playbackRate; }

  getCurrDirection() { return this.currDirection; }
  getIsStepping() { return this.isStepping; }
  getIsPaused() { return this.isPaused; }

  // steps forward or backward and does error-checking
  async step(direction: 'forward' | 'backward'): Promise<typeof direction>;
  /** @internal */
  async step(direction: 'forward' | 'backward', options: {viaButton: boolean}): Promise<typeof direction>;
  async step(direction: 'forward' | 'backward', options?: {viaButton: boolean}): Promise<typeof direction> {
    if (this.isPaused) { throw new Error('Cannot step while playback is paused'); }
    if (this.isStepping) { throw new Error('Cannot step while already animating'); }
    this.isStepping = true;

    let continueOn;
    switch(direction) {
      case 'forward':
        if (!options?.viaButton) { this.playbackButtons.forwardButton?.styleActivation(); }
        // reject promise if trying to step forward at the end of the timeline
        if (this.atEnd) { return new Promise((_, reject) => {this.isStepping = false; reject('Cannot stepForward() at end of timeline')}); }
        do {continueOn = await this.stepForward();} while(continueOn);
        if (!options?.viaButton) { this.playbackButtons.forwardButton?.styleDeactivation(); }
        break;

      case 'backward':
        if (!options?.viaButton) { this.playbackButtons.backwardButton?.styleActivation(); }
        // reject promise if trying to step backward at the beginning of the timeline
        if (this.atBeginning) { return new Promise((_, reject) => {this.isStepping = false; reject('Cannot stepBackward() at beginning of timeline')}); }
        do {continueOn = await this.stepBackward();} while(continueOn);
        if (!options?.viaButton) { this.playbackButtons.backwardButton?.styleDeactivation(); }
        break;

      default:
        throw new Error(`Error: Invalid step direction '${direction}'. Must be 'forward' or 'backward'`);
    }

    // TODO: Potentially rewrite async/await syntax
    return new Promise(resolve => {
      this.isStepping = false;
      resolve(direction);
    });
  }

  // plays current AnimSequence and increments nextSeqIndex
  private async stepForward(): Promise<boolean> {
    this.currDirection = 'forward';
    const sequences = this.animSequences;

    if (this.config.debugMode) { console.log(`-->> ${this.nextSeqIndex}: ${sequences[this.nextSeqIndex].getDescription()}`); }

    const toPlay = sequences[this.nextSeqIndex];
    this.inProgressSequences.set(toPlay.id, toPlay);
    await sequences[this.nextSeqIndex].play(); // wait for the current AnimSequence to finish all of its animations
    this.inProgressSequences.delete(toPlay.id);

    ++this.nextSeqIndex;
    const autoplayNext = !this.atEnd && (
      sequences[this.nextSeqIndex - 1].autoplaysNextSequence || // sequence that was just played
      sequences[this.nextSeqIndex].autoplays // new next sequence
    );

    return autoplayNext;
  }

  // decrements nextSeqIndex and rewinds the AnimSequence
  private async stepBackward(): Promise<boolean> {
    this.currDirection = 'backward';
    const prevSeqIndex = --this.nextSeqIndex;
    const sequences = this.animSequences;

    if (this.config.debugMode) { console.log(`<<-- ${prevSeqIndex}: ${sequences[prevSeqIndex].getDescription()}`); }

    const toRewind = sequences[prevSeqIndex];
    this.inProgressSequences.set(toRewind.id, toRewind);
    await sequences[prevSeqIndex].rewind();
    this.inProgressSequences.delete(toRewind.id);
    
    const autorewindPrevious = !this.atBeginning && (
      sequences[prevSeqIndex - 1].autoplaysNextSequence || // new prev sequence
      sequences[prevSeqIndex].autoplays // sequence that was just rewound
    );

    return autorewindPrevious;
  }

  // immediately skips to first AnimSequence in animSequences with either matching tag field or position
  async skipTo(options: Partial<{tag: string, position: never, offset: number}>): Promise<void>;
  async skipTo(options: Partial<{tag: never, position: 'beginning' | 'end', offset: number}>): Promise<void>;
  async skipTo(options: Partial<{tag: string, position: 'beginning' | 'end', offset: number}> = {}): Promise<void> {
    if (this.isStepping) { throw new Error('Cannot use skipTo() while currently animating'); }
    // Calls to skipTo() must be separated using await or something that similarly prevents simultaneous execution of code
    if (this.usingSkipTo) { throw new Error('Cannot perform simultaneous calls to skipTo() in timeline'); }

    const {
      tag,
      offset = 0,
      position
    } = options;

    // cannot specify both tag and position
    if (tag !== undefined && position !== undefined) {
      throw new TypeError(`Skipping must be done while specifying either the tag or the position, not both. Received tag="${tag}" and position="${position}."`);
    }
    // can only specify one of tag or position, not both
    if (tag === undefined && position === undefined) {
      throw new TypeError(`Skipping must be done while specifying either the tag or the position. Neither were received.`);
    }
    if (!Number.isSafeInteger(offset)) { throw new TypeError(`Invalid offset "${offset}". Value must be an integer.`); }

    let targetIndex: number;

    // find target index based on finding sequence with matching tag
    if (tag) {
      // get nextSeqIndex corresponding to matching AnimSequence
      targetIndex = this.animSequences.findIndex(animSequence => animSequence.getTag() === tag) + offset;
      if (targetIndex - offset === -1) { throw new Error(`Tag name "${tag}" not found`); }
    }
    // find target index based on either the beginning or end of the timeline
    else {
      switch(position!) {
        case "beginning":
          targetIndex = 0 + offset;
          break;
        case "end":
          targetIndex = this.numSequences + offset;
          break;
        default: throw new RangeError(`Invalid skipTo() position "${position}". Must be "beginning" or "end".`);
      }
    }

    // check to see if requested target index is within timeline bounds
    {
      const errorPrefixString = `Skipping to ${tag ? `tag "${tag}"` : `position "${position}"`} with offset "${offset}" goes`;
      const errorPostfixString = `but requested index was ${targetIndex}.`;
      if (targetIndex < 0)
      { throw new RangeError(`${errorPrefixString} before timeline bounds. Minimium index = 0, ${errorPostfixString}`); }
      if (targetIndex > this.numSequences)
        { throw new RangeError(`${errorPrefixString} ahead of timeline bounds. Max index = ${this.numSequences}, ${errorPostfixString}`); }
    }

    this.usingSkipTo = true;
    // if paused, then unpause to perform the skipping; then re-pause
    let wasPaused = this.isPaused;
    if (wasPaused) { this.togglePause(false); }
    // if skipping is not currently enabled, activate skipping button styling
    let wasSkipping = this.isSkipping;
    if (!wasSkipping) { this.playbackButtons.toggleSkippingButton?.styleActivation(); }

    // keep skipping forwards or backwards depending on direction of nextSeqIndex
    if (this.nextSeqIndex <= targetIndex) {
      this.playbackButtons.forwardButton?.styleActivation();
      while (this.nextSeqIndex < targetIndex) { await this.stepForward(); } // could be <= to play the sequence as well
      this.playbackButtons.forwardButton?.styleDeactivation();
    }
    else {
      this.playbackButtons.backwardButton?.styleActivation();
      while (this.nextSeqIndex > targetIndex) { await this.stepBackward(); }
      this.playbackButtons.backwardButton?.styleDeactivation(); // could be tagIndex+1 to prevent the sequence from being undone
    }

    if (!wasSkipping) { this.playbackButtons.toggleSkippingButton?.styleDeactivation(); }
    if (wasPaused) { this.togglePause(true); }

    this.usingSkipTo = false;
  }

  toggleSkipping(isSkipping?: boolean): boolean;
  /** @internal */
  toggleSkipping(isSkipping?: boolean, options?: {viaButton: boolean}): boolean;
  toggleSkipping(isSkipping?: boolean, options?: {viaButton: boolean}): boolean {
    this.isSkipping = isSkipping ?? !this.isSkipping;
    if (!options?.viaButton) {
      const button = this.playbackButtons.toggleSkippingButton;
      this.isSkipping ? button?.styleActivation() : button?.styleDeactivation();
    }
    // if skipping is enabled in the middle of animating, force currently running AnimSequence to finish
    if (this.isSkipping && this.isStepping && !this.isPaused) { this.skipInProgressSequences(); }
    return this.isSkipping;
  }

  skipInProgressSequences(): void { this.doForInProgressSequences(sequence => sequence.skipInProgressAnimations()); }
  // tells the current AnimSequence to instantly finish its animations

  // pauses or unpauses playback
  togglePause(isPaused?: boolean): boolean;
  /** @internal */
  togglePause(isPaused?: boolean, options?: { viaButton: boolean }): boolean;
  togglePause(isPaused?: boolean, options?: { viaButton: boolean }): boolean {
    this.isPaused = isPaused ?? !this.isPaused;
    if (this.isPaused) {
      if (!options?.viaButton) { this.playbackButtons.pauseButton?.styleActivation(); }
      this.doForInProgressSequences(sequence => sequence.pause());
    }
    else {
      if (!options?.viaButton) { this.playbackButtons.pauseButton?.styleDeactivation(); }
      this.doForInProgressSequences(sequence => sequence.unpause());
      if (this.isSkipping) { this.skipInProgressSequences(); }
    }
    return this.isPaused;
  }

  // get all currently running animations that belong to this timeline and perform operation() with them
  private doForInProgressSequences(operation: SequenceOperation): void {
    for (const sequence of this.inProgressSequences.values()) {
      operation(sequence);
    }
  }
}
