import { EmphasisBlock, EntranceBlock, ExitBlock, ScrollBlock, TranslationBlock } from "./AnimBlock.js";
import { DrawConnectorBlock, EraseConnectorBlock } from "./AnimBlockLine.js";
import { IKeyframesBank } from "./WebFlik.js";
import { negateNumString } from "./utils/helpers.js";
import { MoveToOptions, TranslateOptions, CssLengthUnit } from "./utils/interfaces.js";
import { useEasing } from "./utils/easing.js";

// type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

type OrthoDirection = 'left' | 'top' | 'right' | 'bottom';
type DiagDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type Direction = OrthoDirection | DiagDirection;


export const presetEntrances = {
  [`~appear`]: {
    generateKeyframes() {
      return [[]];
    },
    config: {
      duration: 0,
    }
  },

  // TODO: Rename to just 'fade'
  [`~fade-in`]: {
    generateKeyframes() {
      return [[
        {opacity: '0'},
        {opacity: '1'},
      ]];
    },
  },

  [`~fly-in`]: {
    generateKeyframeGenerators(direction: `from-${Direction}` = 'from-bottom') {
      const computeOrthoDist = (dir: `from-${OrthoDirection}`) => {
        const {left, right, top, bottom} = this.domElem.getBoundingClientRect();
        switch(dir) {
          case "from-left": return -right;
          case "from-right": return window.innerWidth - left;
          case "from-top": return -bottom;
          case "from-bottom": return window.innerHeight - top;
        }
      };

      const computeTranslationStr = () => {
        switch(direction) {
          case 'from-left': return `${computeOrthoDist('from-left')}px 0`;
          case 'from-right': return `${computeOrthoDist('from-right')}px 0`;
          case 'from-top': return `0 ${computeOrthoDist('from-top')}px`;
          case 'from-bottom': return `0 ${computeOrthoDist('from-bottom')}px`;
          case 'from-top-left': return `${computeOrthoDist('from-left')}px ${computeOrthoDist('from-top')}px`;
          case 'from-top-right': return `${computeOrthoDist('from-right')}px ${computeOrthoDist('from-top')}px`;
          case 'from-bottom-left': return `${computeOrthoDist('from-left')}px ${computeOrthoDist('from-bottom')}px`;
          case 'from-bottom-right': return `${computeOrthoDist('from-right')}px ${computeOrthoDist('from-bottom')}px`;
          default: throw new Error(`Invalid fromDirection ${direction}. Must be 'from-left', 'from-right', 'from-top', 'from-bottom', 'from-top-left', 'from-top-right', 'from-bottom-left', or 'from-bottom-right'.`);
        }
      };

      return [
        () => [ {translate: computeTranslationStr()}, {translate: `0 0`} ],
        // () => [ {translate: computeTranslationStr()} ]
      ];
    },
    config: {
      pregeneratesKeyframes: false,
      composite: 'accumulate',
    }
  },

  [`~pinwheel`]: {
    generateKeyframes(numSpins: number = 2, direction: 'clockwise' | 'counterclockwise' = 'counterclockwise') {
      // TODO: tweak starting scale and reconsider modifying opacity
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

  [`~rise-up`]: {
    generateKeyframeGenerators() {
        const {top} = this.domElem.getBoundingClientRect();
        return [
          () => [
            {translate: `0 ${window.innerHeight - top}px`, opacity: 0, easing: useEasing('power2-out')},
            {translate: `0 -25px`, offset: 0.83333},
            {translate: `0 -25px`, offset: 0.86, easing: useEasing('power1-in')},
            {translate: `0 0`, opacity: 1},
          ],
        ];
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
      return [[]];
    },
    config: {
      duration: 0,
    }
  },

  [`~fade-out`]: {
    generateKeyframes() {
      return [[
        {opacity: '1'},
        {opacity: '0'},
      ]]
    },
  },

  [`~fly-out`]: {
    generateKeyframeGenerators(direction: `to-${OrthoDirection | DiagDirection}` = 'to-bottom') {
      const computeOrthoDist = (dir: `to-${OrthoDirection}`) => {
        const {left, right, top, bottom} = this.domElem.getBoundingClientRect();
        switch(dir) {
          case "to-left": return -right;
          case "to-right": return window.innerWidth - left;
          case "to-top": return -bottom;
          case "to-bottom": return window.innerHeight - top;
        }
      };

      const computeTranslationStr = () => {
        switch(direction) {
          case 'to-left': return `${computeOrthoDist('to-left')}px 0`;
          case 'to-right': return `${computeOrthoDist('to-right')}px 0`;
          case 'to-top': return `0 ${computeOrthoDist('to-top')}px`;
          case 'to-bottom': return `0 ${computeOrthoDist('to-bottom')}px`;
          case 'to-top-left': return `${computeOrthoDist('to-left')}px ${computeOrthoDist('to-top')}px`;
          case 'to-top-right': return `${computeOrthoDist('to-right')}px ${computeOrthoDist('to-top')}px`;
          case 'to-bottom-left': return `${computeOrthoDist('to-left')}px ${computeOrthoDist('to-bottom')}px`;
          case 'to-bottom-right': return `${computeOrthoDist('to-right')}px ${computeOrthoDist('to-bottom')}px`;
          default: throw new Error(`Invalid fromDirection ${direction}. Must be 'to-left', 'to-right', 'to-top', 'to-bottom', 'to-top-left', 'to-top-right', 'to-bottom-left', or 'to-bottom-right'.`);
        }
      };

      return [
        () => [ {translate: computeTranslationStr()} ],
        // () => [ {translate: computeTranslationStr()}, {translate: `0 0`} ]
      ];
    },
    config: {
      pregeneratesKeyframes: false,
      composite: 'accumulate',
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

  [`~sink-down`]: {
    generateKeyframeGenerators() {
        const {top} = this.domElem.getBoundingClientRect();
        return [
          () => [
            {translate: `0 0`, opacity: 1, easing: useEasing('power1-out')},
            {translate: `0 -25px`, offset: 0.14 },
            {translate: `0 -25px`, easing: useEasing('power2-in'), offset: 0.16666666},
            {translate: `0 ${window.innerHeight - top}px`, opacity: 0},
          ],
        ];
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
    generateKeyframes() {
      return [[
        {backgroundPositionX: '100%'},
        {backgroundPositionX: '0%'},
      ]];
    },
    config: {
      classesToAddOnStart: [`highlightable`],
      // invalidProp: 4,
    },
  },

  [`~un-highlight`]: {
    generateKeyframes() {
      return [[
        {backgroundPositionX: '0%'},
        {backgroundPositionX: '100%'},
      ]];
    },
    config: {
      classesToRemoveOnFinish: [`highlightable`],
    },
  },
} satisfies IKeyframesBank<EmphasisBlock>;


export const presetTranslations = {
  ['~move-to']: {
    generateKeyframes(targetElem: Element | null, translationOptions: Partial<MoveToOptions> = {}) {
      if (!targetElem) {
        throw new Error(`Target for ~move-to must not be null`); // TODO: Improve error message
      }

      const {
        alignmentX = 'left',
        alignmentY = 'top',
        offsetSelfX = '0px',
        offsetSelfY = '0px',
        offsetTargetX = '0px',
        offsetTargetY = '0px',
        preserveX = false,
        preserveY = false,
      } = translationOptions;
      
      // get the bounding boxes of our DOM element and the target element
      // TODO: Find better spot for visibility override
      this.domElem.classList.value += ` wbfk-override-hidden`;
      targetElem.classList.value += ` wbfk-override-hidden`;
      const rectSelf = this.domElem.getBoundingClientRect();
      const rectTarget = targetElem.getBoundingClientRect();
      this.domElem.classList.value = this.domElem.classList.value.replace(` wbfk-override-hidden`, '');
      targetElem.classList.value = targetElem.classList.value.replace(` wbfk-override-hidden`, '');

      // the displacement will start as the difference between the target element's position and our element's position
      const baseXTrans: number = alignmentX === 'center'
        ? ((rectTarget.left + rectTarget.width/2) - (rectSelf.left + rectSelf.width/2))
        : (preserveX ? 0 : rectTarget[alignmentX] - rectSelf[alignmentX]);
      const baseYTrans: number = alignmentY === 'center'
        ? ((rectTarget.top + rectTarget.height/2) - (rectSelf.top + rectSelf.height/2))
        : (preserveY ? 0 : rectTarget[alignmentY] - rectSelf[alignmentY]);

      // there may also be additional offset with respect to the target element
      let offsetTargetXTrans = offsetTargetX;
      let offsetTargetYTrans = offsetTargetY;
      if (typeof offsetTargetX === 'string') {
        const match = offsetTargetX.match(/(-?\d+(?:\.\d*)?)(\D+)/);
        if (!match) { throw new Error(`Invalid offsetTargetX value ${offsetTargetX}`); }
        const num = Number(match[1]);
        const unit = match[2] as CssLengthUnit;
        if (unit === '%') { offsetTargetXTrans = `${(num/100) * rectTarget.width}px`; }
      }
      if (typeof offsetTargetY === 'string') {
        const match = offsetTargetY.match(/(-?\d+(?:\.\d*)?)(\D+)/);
        if (!match) { throw new Error(`Invalid offsetTargetY value ${offsetTargetY}`); }
        const num = Number(match[1]);
        const unit = match[2] as CssLengthUnit;
        if (unit === '%') { offsetTargetYTrans = `${(num/100) * rectTarget.height}px`; }
      }
      
      return [
        // forward
        // TODO: Support returning singular Keyframe instead of Keyframe[]
        [{translate: `calc(${baseXTrans}px + ${offsetSelfX} + ${offsetTargetXTrans}) calc(${baseYTrans}px + ${offsetSelfY} + ${offsetTargetYTrans})`}],

        // backward
        [{translate: `calc(${-baseXTrans}px + ${negateNumString(offsetSelfX)} + ${negateNumString(offsetTargetXTrans)}) calc(${-baseYTrans}px + ${negateNumString(offsetSelfY)} + ${negateNumString(offsetTargetYTrans)})`}],
      ];
    },
  },

  ['~translate']: {
    generateKeyframes(translationOptions: Partial<TranslateOptions> = {}): [Keyframe[], Keyframe[]] {
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
    generateKeyframes() {
      return [[
        {opacity: '0'},
        {opacity: '1'},
      ]];
    },
  },

  // TODO: Fix new bugs surrounding animating custom variables
  [`~trace`]: {
    generateKeyframes(direction: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
      // using CSS variables to control marker-end or marker-start opacity with easing step-end
      // makes it possible to instantly hide a marker and re-reveal it at the end
      const fromAFrames = [
        {['--b-marker-opacity']: 0, easing: 'step-end'},
        {strokeDashoffset: 1, offset: 0},
        {strokeDashoffset: 0, offset: 1},
        {['--b-marker-opacity']: 1},
      ];

      const fromBFrames = [
        {['--a-marker-opacity']: 0, easing: 'step-end'},
        {strokeDashoffset: -1, offset: 0},
        {strokeDashoffset: 0, offset: 1},
        {['--a-marker-opacity']: 1},
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
    generateKeyframes() {
      return [[
        {opacity: '1'},
        {opacity: '0'},
      ]];
    },
  },

  [`~trace`]: {
    generateKeyframes(direction: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
      const fromStartFrames = [
        {['--a-marker-opacity']: 1, easing: 'step-start'},
        {strokeDashoffset: 0, offset: 0},
        {strokeDashoffset: -1, offset: 1},
        {['--a-marker-opacity']: 0},
      ];

      const fromEndFrames = [
        {['--b-marker-opacity']: 1, easing: 'step-start'},
        {strokeDashoffset: 0, offset: 0},
        {strokeDashoffset: 1, offset: 1},
        {['--b-marker-opacity']: 0},
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



export type ScrollingOptions = {
  scrollableOffset?: [x: number, y: number];
  scrollableOffsetX?: number;
  scrollableOffsetY?: number;
  targetOffset?: [x: number, y: number];
  targetOffsetX?: number;
  targetOffsetY?: number;
  preserveX?: boolean;
  preserveY?: boolean;
};

function setScrollies(scrollable: Element, target: Element, scrollOptions: ScrollingOptions): {fromXY: [number, number], toXY: [number, number]} {
  // determines the intersection point of the target
  const offsetPercX: number = scrollOptions.targetOffsetX ?? scrollOptions.targetOffset?.[0] ?? 0;
  const offsetPercY: number = scrollOptions.targetOffsetY ?? scrollOptions.targetOffset?.[1] ?? 0;
  // determines the intersection point of the scrolling container
  const placementOffsetPercX: number = scrollOptions.scrollableOffsetX ?? scrollOptions.scrollableOffset?.[0] ?? 0;
  const placementOffsetPercY: number = scrollOptions.scrollableOffsetY ?? scrollOptions.scrollableOffset?.[1] ?? 0;

  const selfRect = scrollable.getBoundingClientRect();
  const targetRect = target!.getBoundingClientRect();
  const targetInnerLeft = targetRect.left - selfRect.left + (scrollable === document.documentElement ? 0 : scrollable.scrollLeft);
  const targetInnerTop = targetRect.top - selfRect.top + (scrollable === document.documentElement ? 0 : scrollable.scrollTop);
  // The maximum view height should be the height of the scrolling container,
  // but it can only be as large as the viewport height since all scrolling should be
  // with respect to what the user can see.
  // The same logic applies for max width
  const maxSelfViewWidth = Math.min(selfRect.width, window.innerWidth);
  const maxSelfViewHeight = Math.min(selfRect.height, window.innerHeight);

  // initial position of the intersection point of the target relative to the top of the scrolling container
  const oldTargetIntersectionPointPos = [
    targetInnerLeft + (targetRect.width * offsetPercX),
    targetInnerTop + (targetRect.height * offsetPercY)
  ];
  // new position of the intersection point of the target relative to the top of the scrolling container
  const newTargetIntersectionPointPos = [
    oldTargetIntersectionPointPos[0] - (maxSelfViewWidth * placementOffsetPercX),
    oldTargetIntersectionPointPos[1] - (maxSelfViewHeight * placementOffsetPercY),
  ];
  // set to just start scrolling from current scroll position
  const fromXY: [number, number] = [scrollable.scrollLeft, scrollable.scrollTop];
  // If new target intersection is larger (lower) than initial,
  // we'd need to scroll the screen up to move the target intersection down to it.
  // Same logic but opposite for needing to scroll down.
  // Same logic applies to horizontal scrolling with left and right instead of up and down.
  const [scrollDirectionX, scrollDirectionY] = [
    newTargetIntersectionPointPos[0] > oldTargetIntersectionPointPos[1] ? 'left' : 'right',
    newTargetIntersectionPointPos[1] > oldTargetIntersectionPointPos[0] ? 'up' : 'down',
  ];

  const toXY: [number, number] = [0, 0];

  switch(scrollDirectionX) {
    case "left":
      // Capped at 0 because that's the minimum scrollLeft value
      toXY[0] = Math.max(newTargetIntersectionPointPos[0], 0);
    case "right":
      // Capped at the highest scrollWidth value, which equals the scroll width minus the
      // minimum between the width of the scrolling container and the viewport width)
      toXY[0] = Math.min(newTargetIntersectionPointPos[0], scrollable.scrollWidth - maxSelfViewWidth);
  }
  switch(scrollDirectionY) {
    case "up":
      // Capped at 0 because that's the minimum scrollTop value
      toXY[1] = Math.max(newTargetIntersectionPointPos[1], 0);
    case "down":
      // Capped at the highest scrollTop value, which equals the scroll height minus the
      // minimum between the height of the scrolling container and the viewport height)
      toXY[1] = Math.min(newTargetIntersectionPointPos[1], scrollable.scrollHeight - maxSelfViewHeight);
  }

  return {fromXY, toXY};
}

export const presetScrolls = {
  [`~scroll-self`]: {
    generateRafMutators(target: Element | null, scrollOptions: Partial<ScrollingOptions> = {}) {
      if (!target) { throw new Error(); }
      const {
        preserveX = false,
        preserveY = false,
      } = scrollOptions;

      const {
        fromXY: [x_from, y_from],
        toXY: [x_to, y_to]
      } = setScrollies(this.scrollableElem, target, scrollOptions);

      const forwardMutator = () => {
        this.scrollableElem.scrollTo({
          behavior: "instant",
          ...(!preserveX ? {left: this.computeTween(x_from, x_to)} : {}),
          ...(!preserveY ? {top: this.computeTween(y_from, y_to)} : {}),
        });
      };

      const backwardMutator = () => {
        this.scrollableElem.scrollTo({
          behavior: "instant",
          ...(!preserveX ? {left: this.computeTween(x_to, x_from)} : {}),
          ...(!preserveY ? {top: this.computeTween(y_to, y_from)} : {}),
        });
      };

      return [forwardMutator, backwardMutator];
    },
    config: {
      pregeneratesKeyframes: false,
    }
  },
} satisfies IKeyframesBank<ScrollBlock>
