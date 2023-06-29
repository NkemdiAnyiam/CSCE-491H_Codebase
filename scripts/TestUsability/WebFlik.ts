import { AnimBlock, EntranceBlock, ExitBlock, EmphasisBlock, AnimBlockOptions, TranslationBlock } from "../AnimBlock.js";
import { DrawLineBlock, EraseLineBlock, FreeLine, SetLineBlock } from "../AnimBlockLine.js";
import { presetEntrances, presetExits, presetEmphases, presetTranslations, presetFreeLineEntrances, presetFreeLineExits, /*presetFreeLineEntrances*/ } from "../Presets.js";

export type KeyframeBehaviorGroup = Readonly<{
  generateKeyframes(...args: any[]): [forward: Keyframe[], backward?: Keyframe[]];
  options?: Partial<AnimBlockOptions>;
}>
export type IKeyframesBank<T extends AnimBlock | void = void> = Readonly<Record<string, KeyframeBehaviorGroup>> & (T extends void ? {} : ThisType<T>);

// export interface Obj {
//   Entrances?: IKeyframesBank<EntranceBlock>
// }

// type ShiftTuple<T extends any[]> =
//   T extends [T[0], ...infer R] ? R : never;

// CHANGE NOTE: AnimNameIn now handles keyof and Extract
// TODO: Handle undo-- prefixes
export type AnimationNameIn<TBank extends IKeyframesBank> = Extract<keyof {
  [key in keyof TBank as TBank[key] extends KeyframeBehaviorGroup ? key : never]: TBank[key];
}, string>;

type BlockInitParams<
TBlock extends AnimBlock<TBank[AnimName]>,
  TBank extends IKeyframesBank = IKeyframesBank<TBlock>,
  AnimName extends AnimationNameIn<TBank> = AnimationNameIn<TBank>,
> = Parameters<TBlock['initialize']>

// type ReadonlyAnimBlock<T extends AnimBlock> = Readonly<Omit<T, 'setID'>>;
// type ConstructorFunction = abstract new (...args: any[]) => any;
// type AnimBlockCreator<T extends ConstructorFunction> = (...args: ConstructorParameters<T>)
//   => ReadonlyAnimBlock<InstanceType<T>>;
// type InitType<T extends AnimBlock> = Parameters<T[string]>
// type AnimBlockCreator<
//   TBank extends IKeyframesBank,
//   AnimName extends AnimationNameIn<TBank>,
//   T extends AnimBlock<TBank[AnimName]>,
// > = (domElem: Element, animName: AnimName, ...params: Parameters< T['initialize'] >) => T

class _WebFlik {
  createBanks
  <
   // default = {} ensures intellisense for a given bank still works
   // without specifying the field (why? not sure)
    UserEntranceBank extends IKeyframesBank = {},
    UserExitBank extends IKeyframesBank = {},
    UserEmphasisBank extends IKeyframesBank = {},
    UserTranslationBank extends IKeyframesBank = {},
    IncludePresets extends boolean = true
  >
  (
    { Entrances, Exits, Emphases, Translations }:
    {
      Entrances?: UserEntranceBank & IKeyframesBank<EntranceBlock>;
      Exits?: UserExitBank & IKeyframesBank<ExitBlock>;
      Emphases?: UserEmphasisBank & IKeyframesBank<EmphasisBlock>;
      Translations?: UserTranslationBank & IKeyframesBank<TranslationBlock>;
    }, // TODO: Add = {} default so user doesn't have to pass in empty object if using only presets
    includePresets: IncludePresets | void = true as IncludePresets
  ) /* TODO: Add coherent return type */ {
    type TogglePresets<TUserBank, TPresetBank> = Readonly<TUserBank & (IncludePresets extends true ? TPresetBank : {})>;

    type CombinedEntranceBank = TogglePresets<UserEntranceBank, typeof presetEntrances>;
    type CombinedExitBank = TogglePresets<UserExitBank, typeof presetExits>;
    type CombinedEmphasisBank = TogglePresets<UserEmphasisBank, typeof presetEmphases>;
    type CombinedTranslationBank = TogglePresets<UserTranslationBank, typeof presetTranslations>;
    type CombinedDrawLineBank = typeof presetFreeLineEntrances;
    type CombinedEraseLineBank = typeof presetFreeLineExits;

    const combineBanks = <T, U>(presets: T, userDefined: U) => ({...(includePresets ? presets : {}), ...(userDefined ?? {})});
    
    // Add the keyframes groups to the static banks of the block classes
    const combinedEntranceBank = combineBanks(presetEntrances, Entrances) as CombinedEntranceBank;
    const combinedExitBank = combineBanks(presetExits, Exits) as CombinedExitBank;
    const combinedEmphasisBank = combineBanks(presetEmphases, Emphases) as CombinedEmphasisBank;
    const combinedTranslationBank = combineBanks(presetTranslations, Translations) as CombinedTranslationBank;
    const combinedDrawLineBank = combineBanks(presetFreeLineEntrances, {}) as CombinedDrawLineBank;
    const combinedEraseLineBank = combineBanks(presetFreeLineExits, {}) as CombinedEraseLineBank;

    // return functions that can be used to instantiate AnimBlocks with intellisense for the combined banks
    return {
      Entrance: function(domElem, animName, ...params) {
        return new EntranceBlock(domElem, animName, combinedEntranceBank[animName]).initialize(...params);
      },
      Exit: function(domElem, animName, ...params) {
        return new ExitBlock(domElem, animName, combinedExitBank[animName]).initialize(...params);
      },
      Emphasis: function(domElem, animName, ...params) {
        return new EmphasisBlock(domElem, animName, combinedEmphasisBank[animName]).initialize(...params);
      },
      Translation: function(domElem, animName, ...params) {
        return new TranslationBlock(domElem, animName, combinedTranslationBank[animName]).initialize(...params);
      },// TODO: Add option lineOptions
      SetLine: function(freeLineElem: FreeLine, startPoint, endPoint) {
        return new SetLineBlock(freeLineElem, startPoint, endPoint).initialize([]);
      },
      DrawLine: function(freeLineElem, animName, ...params) {
        return new DrawLineBlock(freeLineElem, animName, combinedDrawLineBank[animName]).initialize(...params);
      },
      EraseLine: function(freeLineElem, animName, ...params) {
        return new EraseLineBlock(freeLineElem, animName, combinedEraseLineBank[animName]).initialize(...params);
      },
    } satisfies {
      Entrance: <AnimName extends AnimationNameIn<CombinedEntranceBank>>(
        domElem: Element,
        animName: AnimName,
        ...params: BlockInitParams<EntranceBlock<CombinedEntranceBank[AnimName]>>
      ) => EntranceBlock<CombinedEntranceBank[AnimName]>;

      Exit: <AnimName extends AnimationNameIn<CombinedExitBank>>(
        domElem: Element,
        animName: AnimName,
        ...params: BlockInitParams<ExitBlock<CombinedExitBank[AnimName]>>
      ) => ExitBlock<CombinedExitBank[AnimName]>;

      Emphasis: <AnimName extends AnimationNameIn<CombinedEmphasisBank>>(
        domElem: Element,
        animName: AnimName,
        ...params: BlockInitParams<EmphasisBlock<CombinedEmphasisBank[AnimName]>>
      ) => EmphasisBlock<CombinedEmphasisBank[AnimName]>;

      Translation: <AnimName extends AnimationNameIn<CombinedTranslationBank>>(
        domElem: Element,
        animName: AnimName,
        ...params: BlockInitParams<TranslationBlock<CombinedTranslationBank[AnimName]>>
      ) => TranslationBlock<CombinedTranslationBank[AnimName]>;

      SetLine: (
        FreeLineElem: FreeLine,
        startPoint: [startElem: Element, leftOffset: number, topOffset: number],
        endPoint: [endElem: Element, leftOffset: number, topOffset: number]
      ) => SetLineBlock;

      DrawLine: <AnimName extends AnimationNameIn<CombinedDrawLineBank>>(
        freeLineElem: FreeLine,
        animName: AnimName,
        ...params: BlockInitParams<DrawLineBlock<CombinedDrawLineBank[AnimName]>>
      ) => DrawLineBlock<CombinedDrawLineBank[AnimName]>;

      EraseLine: <AnimName extends AnimationNameIn<CombinedEraseLineBank>>(
        freeLineElem: FreeLine,
        animName: AnimName,
        ...params: BlockInitParams<EraseLineBlock<CombinedEraseLineBank[AnimName]>>
      ) => EraseLineBlock<CombinedEraseLineBank[AnimName]>;
    }
    // satisfies {
    //   // Entrance: AnimBlockCreator<typeof EntranceBlock<CombinedEntranceBank>>;
    //   Exit: AnimBlockCreator<typeof ExitBlock<CombinedExitBank>>;
    //   Emphasis: AnimBlockCreator<typeof EmphasisBlock<CombinedEmphasisBank>>;
    //   Translate: AnimBlockCreator<typeof TranslateBlock>;
    //   TargetedTranslate: AnimBlockCreator<typeof TargetedTranslateBlock>;
    // //   DrawLine: AnimBlockCreator<typeof DrawLine<CombinedDrawLineBank>>
    // };
  }
}


export const WebFlik = new _WebFlik();
