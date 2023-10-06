import { AnimBlock, EntranceBlock, ExitBlock, EmphasisBlock, AnimBlockConfig, TranslationBlock, ScrollBlock, ScrollOptions } from "./AnimBlock.js";
import { DrawConnectorBlock, EraseConnectorBlock, Connector, SetConnectorBlock, ConnectorConfig } from "./AnimBlockLine.js";
import { presetEntrances, presetExits, presetEmphases, presetTranslations, presetConnectorEntrances, presetConnectorExits } from "./Presets.js";

type KeyframesGenerator = {
  generateKeyframes(...animArgs: any[]): [forward: Keyframe[], backward?: Keyframe[]];
  generateGenerators?: never;
  generateRafLoops?: never;
};
type KeyframesFunctionsGenerator = {
  generateKeyframes?: never;
  generateGenerators(...animArgs: any[]): [forwardGenerator: () => Keyframe[], backwardGenerator: () => Keyframe[]];
  generateRafLoops?: never;
}
type ReqAnimFrameLoopsGenerator = {
  generateKeyframes?: never;
  generateGenerators?: never;
  generateRafLoops(...animArgs: any[]): [forwardLoop: () => void, backwardLoop: () => void];
}

export type KeyframesBankEntry = Readonly<
  { config?: Partial<AnimBlockConfig>; }
  & (KeyframesGenerator | KeyframesFunctionsGenerator | ReqAnimFrameLoopsGenerator)
>;

export type GeneratorParams<TBankEntry extends KeyframesBankEntry> = Parameters<
TBankEntry extends KeyframesGenerator ? TBankEntry['generateKeyframes'] : (
  TBankEntry extends KeyframesFunctionsGenerator ? TBankEntry['generateGenerators'] : (
    TBankEntry extends ReqAnimFrameLoopsGenerator ? TBankEntry['generateRafLoops'] : (
      never
    )
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
  ) /* TODO: Add coherent return type */ {
    type TogglePresets<TPresetBank, TUserBank> = Readonly<(IncludePresets extends true ? TPresetBank : {}) & TUserBank>;

    const combineBanks = <P, U>(presets: P, userDefined: U) => ({...(includePresets ? presets : {}), ...(userDefined ?? {})}) as TogglePresets<P, U>;
    
    // Add the keyframes groups to the static banks of the block classes
    const combinedEntranceBank = combineBanks(presetEntrances, Entrances as UserEntranceBank);
    const combinedExitBank = combineBanks(presetExits, Exits as UserExitBank);
    const combinedEmphasisBank = combineBanks(presetEmphases, Emphases as UserEmphasisBank);
    const combinedTranslationBank = combineBanks(presetTranslations, Translations as UserTranslationBank);
    const combinedDrawConnectorBank = combineBanks({}, presetConnectorEntrances);
    const combinedEraseConnectorBank = combineBanks({}, presetConnectorExits);

    // return functions that can be used to instantiate AnimBlocks with intellisense for the combined banks
    return {
      Entrance: function(domElem, animName, ...params) {
        return new EntranceBlock(domElem, animName, combinedEntranceBank).initialize(...params);
      },
      Exit: function(domElem, animName, ...params) {
        return new ExitBlock(domElem, animName, combinedExitBank).initialize(...params);
      },
      Emphasis: function(domElem, animName, ...params) {
        return new EmphasisBlock(domElem, animName, combinedEmphasisBank).initialize(...params);
      },
      Translation: function(domElem, animName, ...params) {
        return new TranslationBlock(domElem, animName, combinedTranslationBank).initialize(...params);
      },
      SetConnector: function(connectorElem, pointA, pointB, connectorConfig = {} as ConnectorConfig) {
        return new SetConnectorBlock(connectorElem, pointA, pointB, `~set-line-points`, {bankExclusion: true}, connectorConfig).initialize([]);
      },
      DrawConnector: function(connectorElem, animName, ...params) {
        return new DrawConnectorBlock(connectorElem, animName, combinedDrawConnectorBank).initialize(...params);
      },
      EraseConnector: function(connectorElem, animName, ...params) {
        return new EraseConnectorBlock(connectorElem, animName, combinedEraseConnectorBank).initialize(...params);
      },
      Scroll: function(domElem, targetElem, scrollOptions, userConfig = {}) {
        return new ScrollBlock(domElem, targetElem, `~scroll-self`, {bankExclusion: true}, scrollOptions).initialize([], userConfig);
      },
    } satisfies {
      Entrance: BlockCreator<typeof combinedEntranceBank, EntranceBlock>;
      Exit: BlockCreator<typeof combinedExitBank, ExitBlock>;
      Emphasis: BlockCreator<typeof combinedEmphasisBank, EmphasisBlock>;
      Translation: BlockCreator<typeof combinedTranslationBank, TranslationBlock>;
      SetConnector: (
        connectorElem: Connector,
        pointA: [elemA: Element | null, leftOffset: number, topOffset: number],
        pointB: [elemB: Element | null, leftOffset: number, topOffset: number],
        connectorConfig: ConnectorConfig
      ) => SetConnectorBlock;
      DrawConnector: BlockCreator<typeof combinedDrawConnectorBank, DrawConnectorBlock, Connector>;
      EraseConnector: BlockCreator<typeof combinedEraseConnectorBank, EraseConnectorBlock, Connector>;
      Scroll: (
        domElem: Element | null,
        targetElem: Element | null,
        scrollOptions: Partial<ScrollingOptions>,
        userConfig: Partial<AnimBlockConfig>
      ) => ScrollBlock;
    };
  }
}

export const WebFlik = new _WebFlik();
