import { AnimBlock, EntranceBlock, ExitBlock, EmphasisBlock, AnimBlockConfig, TranslationBlock, ScrollBlock, ScrollOptions } from "./AnimBlock.js";
import { DrawConnectorBlock, EraseConnectorBlock, Connector, SetConnectorBlock, ConnectorConfig } from "./AnimBlockLine.js";
import { presetEntrances, presetExits, presetEmphases, presetTranslations, presetConnectorEntrances, presetConnectorExits } from "./Presets.js";

type KeyframesGenerator = {
  generateKeyframes(...animArgs: any[]): [forward: Keyframe[], backward?: Keyframe[]];
  generateGenerators?: never;
};
type KeyframesFunctionsGenerator = {
  generateKeyframes?: never;
  generateGenerators(...animArgs: any[]): [forwardGenerator: () => Keyframe[], backwardGenerator: () => Keyframe[]];
}

export type KeyframesBankEntry = Readonly<
  { config?: Partial<AnimBlockConfig>; }
  & (KeyframesGenerator | KeyframesFunctionsGenerator)
>;

export type GeneratorParams<TBankEntry extends KeyframesBankEntry> = Parameters<
TBankEntry extends KeyframesGenerator ? TBankEntry['generateKeyframes'] : (
  TBankEntry extends KeyframesFunctionsGenerator ? TBankEntry['generateGenerators'] : (
    never
  )
)
>;

// represents an object where every string key is paired with a KeyframesBankEntry value
export type IKeyframesBank<T extends AnimBlock | void = void> =
  Readonly<Record<string, KeyframesBankEntry>>
  & (T extends void ? {} : ThisType<Readonly<T | {domElem: HTMLElement, connectorElem: Connector, animName: string}>>);

// CHANGE NOTE: AnimNameIn now handles keyof and Extract
// TODO: Handle undo-- prefixes
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
  ) /* TODO: Add coherent return type */ {
    type TogglePresets<TUserBank, TPresetBank> = Readonly<TUserBank & (IncludePresets extends true ? TPresetBank : {})>;

    const combineBanks = <T, U>(presets: T, userDefined: U) => ({...(includePresets ? presets : {}), ...(userDefined ?? {})});

    type CombinedEntranceBank = TogglePresets<UserEntranceBank, typeof presetEntrances>;
    type CombinedExitBank = TogglePresets<UserExitBank, typeof presetExits>;
    type CombinedEmphasisBank = TogglePresets<UserEmphasisBank, typeof presetEmphases>;
    type CombinedTranslationBank = TogglePresets<UserTranslationBank, typeof presetTranslations>;
    type CombinedDrawConnectorBank = typeof presetConnectorEntrances;
    type CombinedEraseConnectorBank = typeof presetConnectorExits;
    
    // Add the keyframes groups to the static banks of the block classes
    const combinedEntranceBank = combineBanks(presetEntrances, Entrances) as CombinedEntranceBank;
    const combinedExitBank = combineBanks(presetExits, Exits) as CombinedExitBank;
    const combinedEmphasisBank = combineBanks(presetEmphases, Emphases) as CombinedEmphasisBank;
    const combinedTranslationBank = combineBanks(presetTranslations, Translations) as CombinedTranslationBank;
    const combinedDrawConnectorBank = combineBanks(presetConnectorEntrances, {}) as CombinedDrawConnectorBank;
    const combinedEraseConnectorBank = combineBanks(presetConnectorExits, {}) as CombinedEraseConnectorBank;

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
      },
      SetConnector: function(connectorElem, pointA, pointB, connectorConfig = {} as ConnectorConfig) {
        return new SetConnectorBlock(connectorElem, pointA, pointB, connectorConfig).initialize([]);
      },
      DrawConnector: function(connectorElem, animName, ...params) {
        return new DrawConnectorBlock(connectorElem, animName, combinedDrawConnectorBank[animName]).initialize(...params);
      },
      EraseConnector: function(connectorElem, animName, ...params) {
        return new EraseConnectorBlock(connectorElem, animName, combinedEraseConnectorBank[animName]).initialize(...params);
      },
      Scroll: function(domElem, targetElem, scrollOptions, userConfig = {}) {
        return new ScrollBlock(domElem, targetElem, scrollOptions).initialize([], userConfig);
      },
    } satisfies {
      Entrance: BlockCreator<CombinedEntranceBank, EntranceBlock>;
      Exit: BlockCreator<CombinedExitBank, ExitBlock>;
      Emphasis: BlockCreator<CombinedEmphasisBank, EmphasisBlock>;
      Translation: BlockCreator<CombinedTranslationBank, TranslationBlock>;
      DrawConnector: BlockCreator<CombinedDrawConnectorBank, DrawConnectorBlock, Connector>;
      EraseConnector: BlockCreator<CombinedEraseConnectorBank, EraseConnectorBlock, Connector>;

      SetConnector: (
        connectorElem: Connector,
        pointA: [elemA: Element | null, leftOffset: number, topOffset: number],
        pointB: [elemB: Element | null, leftOffset: number, topOffset: number],
        connectorConfig: ConnectorConfig
      ) => SetConnectorBlock;

      Scroll: (
        domElem: Element | null,
        targetElem: Element | null,
        scrollOptions: Partial<ScrollOptions>,
        userConfig: Partial<AnimBlockConfig>
      ) => ScrollBlock;
    };
  }
}

export const WebFlik = new _WebFlik();
