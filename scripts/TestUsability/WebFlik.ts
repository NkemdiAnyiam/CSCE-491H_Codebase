import { AnimBlock, EntranceBlock, ExitBlock, EmphasisBlock, AnimBlockOptions, TranslateBlock, TargetedTranslateBlock } from "../AnimBlock.js";
import { presetEntrances, presetExits, presetEmphases } from "../Presets.js";

export type KeyframeBehaviorGroup = Readonly<{
  keyframes: Keyframe[];
  options?: Partial<AnimBlockOptions>
}>
export type IKeyframesBank = Readonly<Record<string, KeyframeBehaviorGroup>>;

// CHANGE NOTE: AnimNameIn now handles keyof and Extract
// TODO: Handle undo-- prefixes
export type AnimationNameIn<TBank extends IKeyframesBank> = Extract<keyof {
  [key in keyof TBank as TBank[key] extends KeyframeBehaviorGroup ? key : never]: TBank[key];
}, string>;

type ReadonlyAnimBlock<T extends AnimBlock> = Readonly<Omit<T, 'setID'>>;
type ConstructorFunction = abstract new (...args: any[]) => any;
type AnimBlockCreator<T extends ConstructorFunction> = (...args: ConstructorParameters<T>)
  => ReadonlyAnimBlock<InstanceType<T>>;

class _WebFlik {
  createBanks
  <
   // default = {} ensures intellisense for a given bank still works
   // without specifying the field in the arguments for some reason
    UserEntranceBank extends IKeyframesBank = {},
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
    includePresets: IncludePresets | void
  ) /* TODO: Add coherent return type */ {
    type TogglePresets<TUserBank, TPresetBank> = TUserBank & (IncludePresets extends true ? TPresetBank : {});
    type CombinedEntranceBank = TogglePresets<UserEntranceBank, typeof presetEntrances>;
    type CombinedExitBank = TogglePresets<UserExitBank, typeof presetExits>;
    type CombinedEmphasisBank = TogglePresets<UserEmphasisBank, typeof presetEmphases>;

    const combineBanks = <T, U>(presets: T, userDefined: U) => ({...(includePresets ? presets : {}), ...(userDefined ?? {})});
    
    // Add the keyframes groups to the static banks of the block classes
    EntranceBlock.setBank(combineBanks(presetEntrances, Entrances));
    ExitBlock.setBank(combineBanks(presetExits, Exits));
    EmphasisBlock.setBank(combineBanks(presetEmphases, Emphases));

    // return functions that can be used to instantiate AnimBlocks with intellisense for the combined banks
    return {
      Entrance: function(...args) { return new EntranceBlock<CombinedEntranceBank>(...args); },
      Exit: function(...args) { return new ExitBlock<CombinedExitBank>(...args); },
      Emphasis: function(...args) { return new EmphasisBlock<CombinedEmphasisBank>(...args); },
      Translate: function(...args) { return new TranslateBlock(...args); },
      TargetedTranslate: function(...args) { return new TargetedTranslateBlock(...args); },
    } satisfies {
      Entrance: AnimBlockCreator<typeof EntranceBlock<CombinedEntranceBank>>;
      Exit: AnimBlockCreator<typeof ExitBlock<CombinedExitBank>>;
      Emphasis: AnimBlockCreator<typeof EmphasisBlock<CombinedEmphasisBank>>;
      Translate: AnimBlockCreator<typeof TranslateBlock>;
      TargetedTranslate: AnimBlockCreator<typeof TargetedTranslateBlock>;
    };
  }
}
}

export const WebFlik = new _WebFlik();
