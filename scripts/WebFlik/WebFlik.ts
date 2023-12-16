import { AnimBlock, EntranceBlock, ExitBlock, EmphasisBlock, AnimBlockConfig, TranslationBlock, ScrollerBlock } from "./AnimBlock.js";
import { ConnectorEntranceBlock, ConnectorExitBlock, WbfkConnector, ConnectorSetterBlock, WbfkConnectorConfig } from "./AnimBlockLine.js";
import { presetEntrances, presetExits, presetEmphases, presetTranslations, presetConnectorEntrances, presetConnectorExits, presetScrolls } from "./Presets.js";
import { useEasing } from "./utils/easing.js";

type KeyframesGenerator<T extends unknown> = {
  generateKeyframes(this: T, ...animArgs: unknown[]): [forward: Keyframe[], backward?: Keyframe[]];
  generateKeyframeGenerators?: never;
  generateRafMutators?: never;
};
type KeyframesFunctionsGenerator<T extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators(this: T, ...animArgs: unknown[]): [forwardGenerator: () => Keyframe[], backwardGenerator?: () => Keyframe[]];
  generateRafMutators?: never;
};
type RafMutatorsGenerator<T extends unknown> = {
  generateKeyframes?: never;
  generateKeyframeGenerators?: never;
  generateRafMutators(this: T & Readonly<(Pick<AnimBlock, 'computeTween'>)>, ...animArgs: unknown[]): [forwardMutator: () => void, backwardMutator: () => void];
};

export type KeyframesBankEntry<T extends unknown = unknown> = Readonly<
  { config?: Partial<AnimBlockConfig>; }
  & (KeyframesGenerator<T> | KeyframesFunctionsGenerator<T> | RafMutatorsGenerator<T>)
>;

// represents an object where every string key is paired with a KeyframesBankEntry value
export type IKeyframesBank<T extends AnimBlock = AnimBlock> = Readonly<Record<string, KeyframesBankEntry<
  Readonly<
    Pick<T, 'animName'>
    & (T extends (ConnectorEntranceBlock | ConnectorSetterBlock | ConnectorExitBlock) ? Pick<T, 'connectorElem'> : (
      T extends ScrollerBlock ? Pick<T, 'scrollableElem'> : (
        Pick<T, 'domElem'>
      )
  ))>
>>>;

export type GeneratorParams<TBankEntry extends KeyframesBankEntry> = Parameters<
TBankEntry extends KeyframesGenerator<unknown> ? TBankEntry['generateKeyframes'] : (
  TBankEntry extends KeyframesFunctionsGenerator<unknown> ? TBankEntry['generateKeyframeGenerators'] : (
    TBankEntry extends RafMutatorsGenerator<unknown> ? TBankEntry['generateRafMutators'] : (
      never
    )
  )
)
>;

// CHANGE NOTE: AnimNameIn now handles keyof and Extract
// extracts only those strings in an object whose paired value is a KeyframesBankEntry
export type AnimationNameIn<TBank extends IKeyframesBank> = Extract<keyof {
  [key in keyof TBank as TBank[key] extends KeyframesBankEntry ? key : never]: TBank[key];
}, string>;

type BlockInitParams<
  TBlock extends AnimBlock<TBank[AnimName]>,
  TBank extends IKeyframesBank = IKeyframesBank<TBlock>,
  AnimName extends AnimationNameIn<TBank> = AnimationNameIn<TBank>,
> = Parameters<TBlock['initialize']>;

type BlockCreator<
  TBank extends IKeyframesBank,
  TBlock extends AnimBlock = AnimBlock<TBank[AnimationNameIn<TBank>]>,
  TElemType extends Element = Element,
> = <AnimName extends AnimationNameIn<TBank> = AnimationNameIn<TBank>>(
  domElem: TElemType | null,
  animName: AnimName,
  ...params: BlockInitParams<AnimBlock<TBank[AnimName]>, TBank, AnimName>
) => TBlock;

// type ShiftTuple<T extends any[]> =
//   T extends [T[0], ...infer R] ? R : never;

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
    } = {},
    includePresets: IncludePresets | void = true as IncludePresets
  ) {
    _WebFlik.#checkBanksFormatting(Entrances, Exits, Emphases, Translations);

    type TogglePresets<TPresetBank, TUserBank> = Readonly<(IncludePresets extends true ? TPresetBank : {}) & TUserBank>;

    const combineBanks = <P, U>(presets: P, userDefined: U) => ({...(includePresets ? presets : {}), ...(userDefined ?? {})}) as TogglePresets<P, U>;
    
    // Add the keyframes groups to the static banks of the block classes
    const combinedEntranceBank = combineBanks(presetEntrances, Entrances as UserEntranceBank);
    const combinedExitBank = combineBanks(presetExits, Exits as UserExitBank);
    const combinedEmphasisBank = combineBanks(presetEmphases, Emphases as UserEmphasisBank);
    const combinedTranslationBank = combineBanks(presetTranslations, Translations as UserTranslationBank);
    const combinedDrawConnectorBank = combineBanks({}, presetConnectorEntrances);
    const combinedEraseConnectorBank = combineBanks({}, presetConnectorExits);
    const combinedScrollsBank = combineBanks({}, presetScrolls);

    // return functions that can be used to instantiate AnimBlocks with intellisense for the combined banks
    return {
      Entrance: function(domElem, animName, ...params) {
        return new EntranceBlock(domElem, animName, combinedEntranceBank, 'Entrance').initialize(...params);
      },
      Exit: function(domElem, animName, ...params) {
        return new ExitBlock(domElem, animName, combinedExitBank, 'Exit').initialize(...params);
      },
      Emphasis: function(domElem, animName, ...params) {
        return new EmphasisBlock(domElem, animName, combinedEmphasisBank, 'Emphasis').initialize(...params);
      },
      Translation: function(domElem, animName, ...params) {
        return new TranslationBlock(domElem, animName, combinedTranslationBank, 'Translation').initialize(...params);
      },
      ConnectorSetter: function(connectorElem, pointA, pointB, connectorConfig = {} as WbfkConnectorConfig) {
        return new ConnectorSetterBlock(connectorElem, pointA, pointB, `~set-line-points`, {}, 'Connector Setter', connectorConfig).initialize([]);
      },
      ConnectorEntrance: function(connectorElem, animName, ...params) {
        return new ConnectorEntranceBlock(connectorElem, animName, combinedDrawConnectorBank, 'Connector Entrance').initialize(...params);
      },
      ConnectorExit: function(connectorElem, animName, ...params) {
        return new ConnectorExitBlock(connectorElem, animName, combinedEraseConnectorBank, 'Connector Exit').initialize(...params);
      },
      Scroller: function(domElem, animName, ...params) {
        return new ScrollerBlock(domElem, animName, combinedScrollsBank, 'Scroller').initialize(...params);
      },
    } satisfies {
      Entrance: BlockCreator<typeof combinedEntranceBank, EntranceBlock>;
      Exit: BlockCreator<typeof combinedExitBank, ExitBlock>;
      Emphasis: BlockCreator<typeof combinedEmphasisBank, EmphasisBlock>;
      Translation: BlockCreator<typeof combinedTranslationBank, TranslationBlock>;
      ConnectorSetter: (
        connectorElem: WbfkConnector,
        pointA: [elemA: Element | null, leftOffset: number, topOffset: number],
        pointB: [elemB: Element | null, leftOffset: number, topOffset: number],
        connectorConfig: WbfkConnectorConfig
      ) => ConnectorSetterBlock;
      ConnectorEntrance: BlockCreator<typeof combinedDrawConnectorBank, ConnectorEntranceBlock, WbfkConnector>;
      ConnectorExit: BlockCreator<typeof combinedEraseConnectorBank, ConnectorExitBlock, WbfkConnector>;
      Scroller: BlockCreator<typeof combinedScrollsBank, ScrollerBlock>;
    };
  }

  get utils() {
    return {
      useEasing,
    };
  }

  static #checkBanksFormatting(...banks: (IKeyframesBank | undefined)[]) {
    const errors: string[] = [];
    
    const checkForArrowFunctions = (bank?: IKeyframesBank) => {
      if (!bank) { return; }
      for (const animName in bank) {
        const entry = bank[animName];
        const generator = entry.generateKeyframes ?? entry.generateKeyframeGenerators ?? entry.generateRafMutators;
        if (generator.toString().match(/^\(.*\) => .*/)) {
          errors.push(`"${animName}"`);
        }
      }
    };

    for (const bank of banks) { checkForArrowFunctions(bank); }

    if (errors.length > 0) {
      throw new SyntaxError(
        `Arrow functions are not allowed to be used as generators. Detected in the following animation definitions:${errors.map(msg => `\n${msg}`)}`
      );
    }
  }
}

export const WebFlik = new _WebFlik();
