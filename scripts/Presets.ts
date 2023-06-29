import { EmphasisBlock, EntranceBlock, ExitBlock, TElem, TNoElem, TranslationBlock } from "./AnimBlock.js"; // TODO: Clean up TElem/TNoElem import
import { DrawLineBlock, EraseLineBlock } from "./AnimBlockLine.js";
import { IKeyframesBank, KeyframeBehaviorGroup } from "./TestUsability/WebFlik.js";

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
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
          ]];

        case 'right':
          return [[
            {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
          ]];

        case 'bottom':
          return [[
            {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
          ]];

        case 'left':
          return [[
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
          ]];

        default:
          throw new Error(`Invalid direction ${fromDirection} used in ~wipe. Must be 'top', 'right', 'bottom', or 'left'`);
      }
    }
  },

  // TODO: Remove dummy animation
  ['~to-spec']: {
    generateKeyframes(larg: number, bool?: boolean) {
      console.log(larg);
      return [[], []]
    },
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
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
          ]];

        case 'right':
          return [[
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
            {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
          ]];

        case 'bottom':
          return [[
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
            {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
          ]];

        case 'left':
          return [[
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
            {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
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
    options: {
      addedClassesOnStartForward: [`highlightable`],
      // invalidProp: 4,
    },
  },

  [`~un-highlight`]: {
    generateKeyframes: () =>  [[
      {backgroundPositionX: '0'},
      {backgroundPositionX: '100%'},
    ]],
    options: {
      removedClassesOnFinishForward: [`highlightable`],
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
        [{transform: `translate(calc(${translateX}${unitsX} + ${offsetX}${offsetUnitsX}),
                              calc(${translateY}${unitsY} + ${offsetY}${offsetUnitsY})`
        }],
  
        // backward
        [{transform: `translate(calc(${-translateX}${unitsX} + ${-offsetX}${offsetUnitsX}),
                              calc(${-translateY}${unitsY} + ${-offsetY}${offsetUnitsY})`
        }],
      ];
    },
  },

  ['~move-to']: {
    generateKeyframes(targetElem: Element, translationOptions: Partial<TElem> = {}) {
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
        [{transform: `translate(calc(${translateX}px + ${offsetX}${offsetUnitsX}),
                              calc(${translateY}px + ${offsetY}${offsetUnitsY})`
        }],

        // backward
        [{transform: `translate(calc(${-translateX}px + ${-offsetX}${offsetUnitsX}),
                              calc(${-translateY}px + ${-offsetY}${offsetUnitsY})`
        }],
      ];
    },
    options: {
      regenerateKeyframes: true,
    },
  },
} satisfies IKeyframesBank<TranslationBlock>; 

export const presetFreeLineEntrances = {
  // TODO: Utilize appropriate classes to handle marker
  [`~trace`]: {
    generateKeyframes(fromPoint: 'from-start' | 'from-end' = 'from-start') {
      switch(fromPoint) {
        case 'from-start':
          return [[
            {strokeDashoffset: 1},
            {strokeDashoffset: 0},
          ]];

        case 'from-end':
          return [[
            {strokeDashoffset: -1},
            {strokeDashoffset: 0},
          ]];

        default:
          throw new Error(`Invalid direction ${fromPoint} used in ~trace. Must be 'from-start' or 'from-end'`);
      }
    },
    options: {
      removedClassesOnFinishForward: ['markers-hidden'],
    }
  },

  [`~fade-in`]: {
    generateKeyframes: () => [[
      {opacity: '0'},
      {opacity: '1'},
    ]],
  },
} satisfies IKeyframesBank<DrawLineBlock>;

export const presetFreeLineExits = {
  // TODO: Utilize appropriate classes to handle marker
  [`~trace`]: {
    generateKeyframes(fromPoint: 'from-start' | 'from-end' = 'from-start') {
      switch(fromPoint) {
        case 'from-start':
          return [[
            {strokeDashoffset: 0},
            {strokeDashoffset: 1},
          ]];

        case 'from-end':
          return [[
            {strokeDashoffset: 0},
            {strokeDashoffset: -1},
          ]];

        default:
          throw new Error(`Invalid direction ${fromPoint} used in ~trace. Must be 'from-start' or 'from-end'`);
      }
    },
    options: {
      addedClassesOnStartForward: ['markers-hidden'],
    }
  },

  [`~fade-out`]: {
    generateKeyframes: () => [[
      {opacity: '1'},
      {opacity: '0'},
    ]],
  },
} satisfies IKeyframesBank<EraseLineBlock>;
