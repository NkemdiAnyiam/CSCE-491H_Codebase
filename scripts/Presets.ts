import { EmphasisBlock, EntranceBlock, ExitBlock, TElem, TNoElem, TranslationBlock } from "./AnimBlock.js"; // TODO: Clean up TElem/TNoElem import
import { DrawConnectorBlock, EraseConnectorBlock } from "./AnimBlockLine.js";
import { IKeyframesBank } from "./TestUsability/WebFlik.js";

// type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export const presetEntrances = {
  [`~fade-in`]: {
    generateKeyframes: () => [[
      {opacity: '0'},
      {opacity: '1'},
    ]],
  },

  [`~wipe`]: {
    generateKeyframes(fromDirection: 'top' | 'right' | 'bottom' | 'left' = 'bottom') {
      switch(fromDirection) {
        case 'top':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
          ]];

        case 'right':
          return [[
            {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
          ]];

        case 'bottom':
          return [[
            {clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
          ]];

        case 'left':
          return [[
            {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
          ]];

        default:
          throw new Error(`Invalid direction ${fromDirection} used in ~wipe. Must be 'top', 'right', 'bottom', or 'left'`);
      }
    }
  },

  // invalidProperty: 5,
} satisfies IKeyframesBank<EntranceBlock>;


export const presetExits = {
  [`~fade-out`]: {
    generateKeyframes: () => [[
      {opacity: '1'},
      {opacity: '0'},
    ]],
  },
  
  [`~wipe`]: {
    generateKeyframes(toDirection: 'top' | 'right' | 'bottom' | 'left' = 'top') {
      switch(toDirection) {
        case 'top':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'},
          ]];

        case 'right':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'},
          ]];

        case 'bottom':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)'},
          ]];

        case 'left':
          return [[
            {clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'},
            {clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)'},
          ]];

        default:
          throw new Error(`Invalid direction ${toDirection} used in ~wipe. Must be 'top', 'right', 'bottom', or 'left'`);
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
  ['~translate']: {
    generateKeyframes: (translationOptions: Partial<TNoElem>): [Keyframe[], Keyframe[]] => {
      let {
        translateX, translateY, translateXY,
        unitsX, unitsY, unitsXY,
        offsetX, offsetY, offsetXY,
        offsetUnitsX, offsetUnitsY, offsetUnitsXY,
      } = translationOptions;
  
      translateX = translateXY ?? translateX ?? 0;
      translateY = translateXY ?? translateY ?? 0;
      unitsX = unitsXY ?? unitsX ?? 'px';
      unitsY = unitsXY ?? unitsY ?? 'px';
      offsetX = offsetXY ?? offsetX ?? 0;
      offsetY = offsetXY ?? offsetY ?? 0;
      offsetUnitsX = offsetUnitsXY ?? offsetUnitsX ?? 'px';
      offsetUnitsY = offsetUnitsXY ?? offsetUnitsY ?? 'px';
      
      return [
        // forward
        [{translate: `calc(${translateX}${unitsX} + ${offsetX}${offsetUnitsX}) calc(${translateY}${unitsY} + ${offsetY}${offsetUnitsY})`}],
  
        // backward
        [{translate: `calc(${-translateX}${unitsX} + ${-offsetX}${offsetUnitsX}) calc(${-translateY}${unitsY} + ${-offsetY}${offsetUnitsY})`}],
      ];
    },
  },

  ['~move-to']: {
    generateKeyframes(targetElem: Element | null, translationOptions: Partial<TElem> = {}) {
      if (!targetElem) {
        throw new Error(`Target for ~move-to must not be null`); // TODO: Improve error message
      }

      let {
        alignmentX = 'left', alignmentY = 'top',
        offsetX, offsetY, offsetXY,
        offsetTargetX, offsetTargetY, offsetTargetXY,
        offsetUnitsX, offsetUnitsY, offsetUnitsXY,
        preserveX = false, preserveY = false,
      } = translationOptions;

      let translateX: number;
      let translateY: number;
      
      // get the bounding boxes of our DOM element and the target element
      // TODO: Find better spot for visibility override
      this.domElem.classList.value += ` wbfk-override-hidden`;
      targetElem.classList.value += ` wbfk-override-hidden`;
      const rectThis = this.domElem.getBoundingClientRect();
      const rectTarget = targetElem.getBoundingClientRect();
      this.domElem.classList.value = this.domElem.classList.value.replace(` wbfk-override-hidden`, '');
      targetElem.classList.value = targetElem.classList.value.replace(` wbfk-override-hidden`, '');

      // the displacement will start as the difference between the target element's position and our element's position...
      // ...plus any offset within the target itself
      offsetTargetX = offsetTargetXY ?? offsetTargetX ?? 0;
      offsetTargetY = offsetTargetXY ?? offsetTargetY ?? 0;
      translateX = preserveX ? 0 : rectTarget[alignmentX] - rectThis[alignmentX];
      translateX += offsetTargetX * rectTarget.width;
      translateY = preserveY ? 0 : rectTarget[alignmentY] - rectThis[alignmentY];
      translateY += offsetTargetY * rectTarget.height;
      offsetX = offsetXY ?? offsetX ?? 0;
      offsetY = offsetXY ?? offsetY ?? 0;
      offsetUnitsX = offsetUnitsXY ?? offsetUnitsX ?? 'px';
      offsetUnitsY = offsetUnitsXY ?? offsetUnitsY ?? 'px';
      
      return [
        // forward
        // TODO: Support returning singular Keyframe instead of Keyframe[]
        [{translate: `calc(${translateX}px + ${offsetX}${offsetUnitsX}) calc(${translateY}px + ${offsetY}${offsetUnitsY})`}],

        // backward
        [{translate: `calc(${-translateX}px + ${-offsetX}${offsetUnitsX}) calc(${-translateY}px + ${-offsetY}${offsetUnitsY})`}],
      ];
    },
  },
} satisfies IKeyframesBank<TranslationBlock>; 

export const presetConnectorEntrances = {
  [`~trace`]: {
    generateKeyframes(fromPoint: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
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

      switch(fromPoint) {
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
          throw new Error(`Invalid direction ${fromPoint} used in ~trace. Must be 'from-A', 'from-B', 'from-top', 'from-bottom', 'from-left', or 'from-right'`);
      }
    },
  },

  [`~fade-in`]: {
    generateKeyframes: () => [[
      {opacity: '0'},
      {opacity: '1'},
    ]],
  },
} satisfies IKeyframesBank<DrawConnectorBlock>;

export const presetConnectorExits = {
  [`~trace`]: {
    generateKeyframes(fromPoint: 'from-A' | 'from-B' | 'from-top' | 'from-bottom' | 'from-left' | 'from-right' = 'from-A') {
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

      switch(fromPoint) {
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
          throw new Error(`Invalid direction ${fromPoint} used in ~trace. Must be 'from-A', 'from-B', 'from-top', 'from-bottom', 'from-left', or 'from-right'`);
      }
    },
  },

  [`~fade-out`]: {
    generateKeyframes: () => [[
      {opacity: '1'},
      {opacity: '0'},
    ]],
  },
} satisfies IKeyframesBank<EraseConnectorBlock>;
