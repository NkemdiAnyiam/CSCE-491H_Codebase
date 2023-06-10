import { AnimBlock, EntranceBlock, ExitBlock } from "../AnimBlock";
import { presetEntrances, presetExits } from "../Presets";

// type AnimNameIn<TBank> = {
//   [AnimName in keyof TBank as TBank[AnimName] extends Keyframe[] ? AnimName : never]: TBank[AnimName];
// }

// const presetEntrances = {[`preset-anim-name`]: [{backgroundColor: 'red'}]}
// type PresetEntranceBank = typeof presetEntrances;

// class Bank<T> {
//   constructor(public obj: T) {}
//   animate(animName: keyof AnimNameIn<T>) {
//     this.obj[animName];
//   }
// }

export type IKeyframesBank<T extends unknown | void = void> = Record<T extends void ? string : keyof T, Keyframe[]>;

// CHANGE NOTE: AnimNameIn now handles keyof and Extract
export type AnimationNameIn<TBank extends IKeyframesBank> = Extract<keyof {
  [key in keyof TBank as TBank[key] extends Keyframe[] ? key : never]: TBank[key];
}, string>

// type Options<K extends AnimationBank> = {
//   userDefined?: K;
//   excludePresets?: boolean;
// }

// type BankOptionsWithPresets<K extends AnimationBank = {}> = Options<K> & { excludePresets?: false; }
// type BankOptionsNoPresets<K extends AnimationBank = {}> = Options<K> & { excludePresets: true; }

class _WebFlik {
  static Entrances = {};

  // createBanks<UserBank extends AnimationBank>({userDefined, excludePresets}: BankOptionsWithPresets<UserBank>): Bank<UserBank & PresetBank>;
  // createBanks<UserBank extends AnimationBank>({userDefined, excludePresets}: BankOptionsNoPresets<UserBank>): Bank<UserBank>;
  // createBanks<UserBank extends AnimationBank>({userDefined = {} as UserBank, excludePresets = false}: Options<UserBank>) {
  //   if (!excludePresets) {
  //     return new Bank ({
  //       ...preDefined,
  //       ...userDefined
  //     });
  //   }
  //   else {
  //     return new Bank ({
  //       ...userDefined
  //     });
  //   }
  // }

  createBanks
  <
    UserEntranceBank extends IKeyframesBank = {},
    UserExitBank extends IKeyframesBank = {},
    // UserEmphasisBank extends AnimationBank = {},
    IncludePresets extends boolean = true
  >
  (
    {
      Entrances = {} as UserEntranceBank,
      Exits = {} as UserExitBank,
    }:
    {
      Entrances?: UserEntranceBank;
      Exits?: UserExitBank;
    },
    includePresets: IncludePresets | void
  ) /* TODO: Add coherent return type */ {
    type TogglePresets<TUserBank, TPresetBank> = TUserBank & (IncludePresets extends true ? TPresetBank : {});
    type CombinedEntranceBank = TogglePresets<UserEntranceBank, typeof presetEntrances>;
    type CombinedExitBank = TogglePresets<UserExitBank, typeof presetExits>;
    // type CombinedEmphasisBank = TogglePresets<UserEmphasisBank, typeof presetEmphases>;

    const togglePresets = <T, U>(presets: T, userDefined: U) => ({...(includePresets ? presets : {}), ...userDefined});
    
    // Add the keyframes groups to the static banks of the block classes
    EntranceBlock.setBank(togglePresets(presetEntrances, Entrances));
    ExitBlock.setBank(togglePresets(presetExits, Exits));

    // return functions that can be used to instantiate AnimBlocks with intellisense for the combined banks
    type ReadonlyAnimBlock<T extends AnimBlock> = Readonly<Omit<T, 'setID'>>;
    type ConstructorFunction = abstract new (...args: any[]) => any;
    type AnimBlockCreator<T extends ConstructorFunction> = (...args: ConstructorParameters<T>)
      => ReadonlyAnimBlock<InstanceType<T>>;
    return {
      Entrance: function(...args) { return new EntranceBlock<CombinedEntranceBank>(...args); },
      Exit: function(...args) { return new ExitBlock<CombinedExitBank>(...args); },
      // Emphasis: function(...args) { return new EmphasisBlock<CombinedEmphasisBank>(...args); },
    } satisfies {
      Entrance: AnimBlockCreator<typeof EntranceBlock<CombinedEntranceBank>>
      Exit: AnimBlockCreator<typeof ExitBlock<CombinedExitBank>>
      // Emphasis: AnimBlockCreator<typeof EmphasisBlock<CombinedEmphasisBank>>
    }
  }
}

export const WebFlik = new _WebFlik();
