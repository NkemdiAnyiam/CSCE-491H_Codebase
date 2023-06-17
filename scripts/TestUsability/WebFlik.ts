import { AnimBlock, EntranceBlock, ExitBlock, EmphasisBlock, AnimBlockOptions, TranslateBlock, TargetedTranslateBlock } from "../AnimBlock.js";
import { DrawLine } from "../AnimBlockLine.js";
import { presetEntrances, presetExits, presetEmphases, /*presetFreeLineEntrances*/ } from "../Presets.js";

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
   // without specifying the field in the arguments for some reason
    UserEntranceBank extends IKeyframesBank = IKeyframesBank<EntranceBlock>,
    UserExitBank extends IKeyframesBank = {},
    UserEmphasisBank extends IKeyframesBank = {},
    IncludePresets extends boolean = true
  >
  (
    { Entrances, Exits, Emphases }:
    {
      Entrances?: UserEntranceBank;
      Exits?: UserExitBank;
      Emphases?: UserEmphasisBank;
    },
    includePresets: IncludePresets | void = true as IncludePresets
  ) /* TODO: Add coherent return type */ {
    type TogglePresets<TUserBank, TPresetBank> = TUserBank & (IncludePresets extends true ? TPresetBank : {});
    type CombinedEntranceBank = TogglePresets<UserEntranceBank, typeof presetEntrances>;
    type CombinedExitBank = TogglePresets<UserExitBank, typeof presetExits>;
    type CombinedEmphasisBank = TogglePresets<UserEmphasisBank, typeof presetEmphases>;
    // type CombinedDrawLineBank = typeof presetFreeLineEntrances;

    const combineBanks = <T, U>(presets: T, userDefined: U) => ({...(includePresets ? presets : {}), ...(userDefined ?? {})});
    
    // Add the keyframes groups to the static banks of the block classes
    const combinedEntranceBank = combineBanks(presetEntrances, Entrances) as CombinedEntranceBank;
    // EntranceBlock.setBank(combinedEntranceBank)
    ExitBlock.setBank(combineBanks(presetExits, Exits));
    EmphasisBlock.setBank(combineBanks(presetEmphases, Emphases));
    // DrawLine.setBank(presetFreeLineEntrances);

    // return functions that can be used to instantiate AnimBlocks with intellisense for the combined banks
    return {
      Entrance: function(domElem, animName, ...params) {
        return new EntranceBlock(domElem, animName, combinedEntranceBank[animName])
          .initialize(...params);
      },
      // Exit: function(...args) { return new ExitBlock(...args); },
      // Emphasis: function(...args) { return new EmphasisBlock(...args); },
      // Translate: function(...args) { return new TranslateBlock(...args); },
      // TargetedTranslate: function(...args) { return new TargetedTranslateBlock(...args); },
      // // DrawLine: function(...args) { return new DrawLine(...args); },
    }  satisfies {
      Entrance: <AnimName extends AnimationNameIn<CombinedEntranceBank>>(domElem: Element, animName: AnimName, ...params: Parameters<InstanceType<typeof EntranceBlock<CombinedEntranceBank[AnimName]>>['initialize']>) => EntranceBlock<CombinedEntranceBank[AnimName]>
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
