import { EmphasisBlock, EntranceBlock, ExitBlock, /*ScrollBlock,*/ TElem, TNoElem, TranslationBlock } from "./AnimBlock.js"; // TODO: Clean up TElem/TNoElem import
import { DrawConnectorBlock, EraseConnectorBlock } from "./AnimBlockLine.js";
import { IKeyframesBank } from "./TestUsability/WebFlik.js";

// type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }


const negateNumString = (str: string) => {
  return str[0] === '-' ? str.slice(1) : `-${str}`;
}

export const presetEntrances = {
  [`~appear`]: {
    generateKeyframes() {
      return [[]]
    },
    config: {
      duration: 0,
    }
  },

  // TODO: Rename to just 'fade'
  [`~fade-in`]: {
    generateKeyframes: () => [[
      {opacity: '0'},
      {opacity: '1'},
    ]],
  },

  [`~fly-in`]: {
    generateGenerators(direction: 'from-left' | 'from-top' | 'from-right' | 'from-bottom' = 'from-bottom') {
      return [
        () => {
          const {left, right, top, bottom} = this.domElem.getBoundingClientRect();
          switch(direction) {
            case 'from-left':
              return [ {translate: `${-right}px`}, {translate: `0`} ];
            case 'from-right':
              return [ {translate: `${window.innerWidth - left}px`}, {translate: `0`} ];
            case 'from-top':
              return [ {translate: `0 ${-bottom}px`}, {translate: `0 0`} ];
            case 'from-bottom':
              return [ {translate: `0 ${window.innerHeight - top}px`}, {translate: `0 0`} ];
            default: throw new Error(`Invalid fromDirection ${direction}. Must be 'from-left', 'from-top', 'from-right', or 'from-bottom'.`);
          }
        },
        () => {
          const {left, right, top, height} = this.domElem.getBoundingClientRect();
          switch(direction) {
            case 'from-left':
              return [ {translate: `${-right}px`} ];
            case 'from-right':
              return [ {translate: `${window.innerWidth - left}px`} ];
            case 'from-top':
              return [ {translate: `0 ${-(top + height)}px`} ];
            case 'from-bottom':
              return [ {translate: `0 ${window.innerHeight - top}px`} ];
            // case 'from-left':
            //   return [ {translate: `0`}, {translate: `${-right}px`} ];
            // case 'from-right':
            //   return [ {translate: `0`}, {translate: `${window.innerWidth - left}px`} ];
            //   case 'from-top':
            //   return [ {translate: `0 0`}, {translate: `0 ${-bottom}px`} ];
            //   case 'from-bottom':
            //   return [ {translate: `0 0`}, {translate: `0 ${window.innerHeight - top}px`} ];
          }
        }
      ];
    },
    config: {
      pregeneratesKeyframes: false
    }
  },

  // [`~fade-in`]: {
  //   generateFunctions: () => [() => {console.log('F'); return [{opacity: 0}, {opacity: 1}]}, () => {console.log('B'); return [{opacity: 1}, {opacity: 0}]}],
  //   config: {
  //     pregeneratesKeyframes: false,
  //   }
  // },

  [`~pinwheel`]: {
    generateKeyframes(numSpins: number = 2, direction: 'clockwise' | 'counterclockwise' = 'counterclockwise') {
      // TODO: tweak starting scale and reconsider modifying opaticy
      return [[
        {
          rotate: `z 0deg`,
          scale: 0,
          opacity: 0,
        },
        {
          rotate: `z ${360 * numSpins * (direction === 'clockwise' ? 1 : -1)}deg`,
          scale: 1,
          opacity: 1,
        },
      ]]
    },
  },

  [`~wipe`]: {
    generateKeyframes(direction: 'from-bottom' | 'from-left' | 'from-top' | 'from-right' = 'from-bottom') {
      switch(direction) {
        case 'from-bottom':
          return [[
            {clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
          ]];

        case 'from-left':
          return [[
            {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
          ]];

        case 'from-top':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
          ]];

        case 'from-right':
          return [[
            {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
          ]];

        default:
          throw new Error(`Invalid direction ${direction} used in ~wipe. Must be 'from-top', 'from-right', 'from-bottom', or 'from-left'`);
      }
    }
  },

  // invalidProperty: 5,
} satisfies IKeyframesBank<EntranceBlock>;


export const presetExits = {
  [`~disappear`]: {
    generateKeyframes() {
      return [[]]
    },
    config: {
      duration: 0,
    }
  },

  [`~fade-out`]: {
    generateKeyframes: () => [[
      {opacity: '1'},
      {opacity: '0'},
    ]],
  },

  [`~fly-out`]: {
    generateGenerators(direction: 'to-left' | 'to-top' | 'to-right' | 'to-bottom' = 'to-bottom') {
      return [
        () => {
          const {left, right, top, height} = this.domElem.getBoundingClientRect();
          switch(direction) {
            case 'to-left':
              return [ {translate: `${-right}px`} ];
            case 'to-right':
              return [ {translate: `${window.innerWidth - left}px`} ];
            case 'to-top':
              return [ {translate: `0 ${-(top + height)}px`} ];
            case 'to-bottom':
              return [ {translate: `0 ${window.innerHeight - top}px`} ];
            default: throw new Error(`Invalid direction ${direction}. Must be 'to-left', 'to-top', 'to-right', or 'to-bottom'.`);
          }
        },
        () => {
          const {left, right, top, bottom} = this.domElem.getBoundingClientRect();
          switch(direction) {
            case 'to-left':
              return [ {translate: `${-right}px`}, {translate: `0`} ];
            case 'to-right':
              return [ {translate: `${window.innerWidth - left}px`}, {translate: `0`} ];
            case 'to-top':
              return [ {translate: `0 ${-bottom}px`}, {translate: `0 0`} ];
            case 'to-bottom':
              return [ {translate: `0 ${window.innerHeight - top}px`}, {translate: `0 0`} ];
          }
        }
      ];
    },
    config: {
      pregeneratesKeyframes: false
    }
  },

  [`~pinwheel`]: {
    generateKeyframes(numSpins: number = 2, direction: 'clockwise' | 'counterclockwise' = 'clockwise') {
      // TODO: tweak starting scale and reconsider modifying opacity
      return [[
        {
          rotate: `z 0deg`,
          scale: 1,
          opacity: 1,
        },
        {
          rotate: `z ${360 * numSpins * (direction === 'clockwise' ? 1 : -1)}deg`,
          scale: 0,
          opacity: 0,
        },
      ]]
    },
  },
  
  [`~wipe`]: {
    generateKeyframes(direction: 'from-bottom' | 'from-left' | 'from-top' | 'from-right' = 'from-bottom') {
      switch(direction) {
        case 'from-bottom':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'},
          ]];

        case 'from-left':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
          ]];

        case 'from-top':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'},
          ]];

        case 'from-right':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
          ]];

        default:
          throw new Error(`Invalid direction ${direction} used in ~wipe. Must be 'from-top', 'from-right', 'from-bottom', or 'from-left'`);
      }
    }
  },
} satisfies IKeyframesBank<ExitBlock>;


export const presetEmphases = {
  [`~highlight`]: {
    generateKeyframes: () =>  [[
      {backgroundPositionX: '100%'},
      {backgroundPositionX: '0%'},
    ]],
    config: {
      classesToAddOnStart: [`highlightable`],
      // invalidProp: 4,
    },
  },

  [`~un-highlight`]: {
    generateKeyframes: () =>  [[
      {backgroundPositionX: '0'},
      {backgroundPositionX: '100%'},
    ]],
    config: {
      classesToRemoveOnFinish: [`highlightable`],
    },
  },
} satisfies IKeyframesBank<EmphasisBlock>;


// TODO: Implement composite: accumulates somewhewre
export const presetTranslations = {
  ['~move-to']: {
    generateKeyframes(targetElem: Element | null, translationOptions: Partial<TElem> = {}) {
      if (!targetElem) {
        throw new Error(`Target for ~move-to must not be null`); // TODO: Improve error message
      }

      const {
        alignmentX = 'left',
        alignmentY = 'top',
        offsetSelfX = '0px',
        offsetSelfY = '0px',
        offsetTargetX = 0,
        offsetTargetY = 0,
        preserveX = false,
        preserveY = false,
      } = translationOptions;
      
      // get the bounding boxes of our DOM element and the target element
      // TODO: Find better spot for visibility override
      this.domElem.classList.value += ` wbfk-override-hidden`;
      targetElem.classList.value += ` wbfk-override-hidden`;
      const rectThis = this.domElem.getBoundingClientRect();
      const rectTarget = targetElem.getBoundingClientRect();
      this.domElem.classList.value = this.domElem.classList.value.replace(` wbfk-override-hidden`, '');
      targetElem.classList.value = targetElem.classList.value.replace(` wbfk-override-hidden`, '');

      // the displacement will start as the difference between the target element's position and our element's position...
      // ...plus any offset with respect to the target
      const translateX: number = (preserveX ? 0 : rectTarget[alignmentX] - rectThis[alignmentX])
        + offsetTargetX * rectTarget.width;
      const translateY: number = (preserveY ? 0 : rectTarget[alignmentY] - rectThis[alignmentY])
        + offsetTargetY * rectTarget.height;
      
      return [
        // forward
        // TODO: Support returning singular Keyframe instead of Keyframe[]
        [{translate: `calc(${translateX}px + ${offsetSelfX}) calc(${translateY}px + ${offsetSelfY})`}],

        // backward
        [{translate: `calc(${-translateX}px + ${negateNumString(offsetSelfX)}) calc(${-translateY}px + ${negateNumString(offsetSelfY)})`}],
      ];
    },
  },

  ['~translate']: {
    generateKeyframes: (translationOptions: Partial<TNoElem> = {}): [Keyframe[], Keyframe[]] => {
      const {
        translateX = '0px',
        translateY = '0px',
        offsetSelfX = '0px',
        offsetSelfY = '0px',
      } = translationOptions;
      
      return [
        // forward
        [{translate: `calc(${translateX} + ${offsetSelfX}) calc(${translateY} + ${offsetSelfY})`}],
  
        // backward
        [{translate: `calc(${negateNumString(translateX)} + ${negateNumString(offsetSelfX)}) calc(${negateNumString(translateY)} + ${negateNumString(offsetSelfY)})`}],
      ];
    },
  },
} satisfies IKeyframesBank<TranslationBlock>; 

export const presetConnectorEntrances = {
  [`~fade-in`]: {
    generateKeyframes: () => [[
      {opacity: '0'},
      {opacity: '1'},
    ]],
  },

  [`~trace`]: {
    generateKeyframes(direction: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
      const markerIdPrefix = this.connectorElem.markerIdPrefix;

      // using CSS variables to control marker-end or marker-start with easing step-end
      // makes it possible to instantly hide a marker and re-reveal it at the end
      const fromAFrames = [
        {['--b-marker']: `url(#${markerIdPrefix}-b--layer--hide-by-invalidating)`, easing: 'step-end'},
        {strokeDashoffset: 1, offset: 0},
        {strokeDashoffset: 0, offset: 1},
        {['--b-marker']: `url(#${markerIdPrefix}-b--layer)`},
      ];

      const fromBFrames = [
        {['--a-marker']: `url(#${markerIdPrefix}-a--layer--hide-by-invalidating)`, easing: 'step-end'},
        {strokeDashoffset: -1, offset: 0},
        {strokeDashoffset: 0, offset: 1},
        {['--a-marker']: `url(#${markerIdPrefix}-a--layer)`},
      ];

      switch(direction) {
        case 'from-A':
          return [fromAFrames];

        case 'from-B':
          return [fromBFrames];

        case 'from-top':
          return [this.connectorElem.ay <= this.connectorElem.by ? fromAFrames : fromBFrames];

        case 'from-bottom':
          return [this.connectorElem.ay >= this.connectorElem.by ? fromAFrames : fromBFrames];

        case 'from-left':
          return [this.connectorElem.ax <= this.connectorElem.bx ? fromAFrames : fromBFrames];

        case 'from-right':
          return [this.connectorElem.ax >= this.connectorElem.bx ? fromAFrames : fromBFrames];

        default:
          throw new Error(`Invalid direction ${direction} used in ~trace. Must be 'from-A', 'from-B', 'from-top', 'from-bottom', 'from-left', or 'from-right'`);
      }
    },
  },
} satisfies IKeyframesBank<DrawConnectorBlock>;

export const presetConnectorExits = {
  [`~fade-out`]: {
    generateKeyframes: () => [[
      {opacity: '1'},
      {opacity: '0'},
    ]],
  },

  [`~trace`]: {
    generateKeyframes(direction: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
      const markerIdPrefix = this.connectorElem.markerIdPrefix;

      const fromStartFrames = [
        {['--a-marker']: `url(#${markerIdPrefix}-a--layer)`, easing: 'step-start'},
        {strokeDashoffset: 0, offset: 0},
        {strokeDashoffset: -1, offset: 1},
        {['--a-marker']: `url(#${markerIdPrefix}-a--layer--hide-by-invalidating)`},
      ];

      const fromEndFrames = [
        {['--b-marker']: `url(#${markerIdPrefix}-b--layer)`, easing: 'step-start'},
        {strokeDashoffset: 0, offset: 0},
        {strokeDashoffset: 1, offset: 1},
        {['--b-marker']: `url(#${markerIdPrefix}-b--layer--hide-by-invalidating)`},
      ];

      switch(direction) {
        case 'from-A':
          return [fromStartFrames];

        case 'from-B':
          return [fromEndFrames];

        case 'from-top':
          return [this.connectorElem.ay <= this.connectorElem.by ? fromStartFrames : fromEndFrames];

        case 'from-bottom':
          return [this.connectorElem.ay >= this.connectorElem.by ? fromStartFrames : fromEndFrames];

        case 'from-left':
          return [this.connectorElem.ax <= this.connectorElem.bx ? fromStartFrames : fromEndFrames];

        case 'from-right':
          return [this.connectorElem.ax >= this.connectorElem.bx ? fromStartFrames : fromEndFrames];

        default:
          throw new Error(`Invalid direction ${direction} used in ~trace. Must be 'from-A', 'from-B', 'from-top', 'from-bottom', 'from-left', or 'from-right'`);
      }
    },
  },
} satisfies IKeyframesBank<EraseConnectorBlock>;
