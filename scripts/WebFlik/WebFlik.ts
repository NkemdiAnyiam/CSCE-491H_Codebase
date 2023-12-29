import { AnimBlock, EntranceBlock, ExitBlock, EmphasisBlock, AnimBlockConfig, MotionBlock, ScrollerBlock, TransitionBlock, ExitBlockConfig } from "./AnimBlock";
import { ConnectorEntranceBlock, ConnectorExitBlock, WbfkConnector, ConnectorSetterBlock, WbfkConnectorConfig } from "./AnimBlockLine";
import { presetEntrances, presetExits, presetEmphases, presetMotions, presetConnectorEntrances, presetConnectorExits, presetScrolls, presetTransitions } from "./Presets";
import { useEasing } from "./utils/easing";
import { createStyles } from "./utils/helpers";

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

export type KeyframesBankEntry<TBlockThis extends unknown = unknown, TConfig extends unknown = unknown> = Readonly<
  { config?: Partial<TConfig>; }
  & (KeyframesGenerator<TBlockThis> | KeyframesFunctionsGenerator<TBlockThis> | RafMutatorsGenerator<TBlockThis>)
>;

// represents an object where every string key is paired with a KeyframesBankEntry value
export type IKeyframesBank<TBlock extends AnimBlock = AnimBlock, TBlockConfig extends unknown = AnimBlockConfig> = Readonly<
  Record<string, KeyframesBankEntry<
    Readonly<Pick<TBlock, 'animName' | 'domElem'>>,
    TBlockConfig
  >>
>;

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


class _WebFlik {
  createBanks
  <
   // default = {} ensures intellisense for a given bank still works
   // without specifying the field (why? not sure)
    UserEntranceBank extends IKeyframesBank = {},
    UserExitBank extends IKeyframesBank<ExitBlock, ExitBlockConfig> = {},
    UserEmphasisBank extends IKeyframesBank = {},
    UserMotionBank extends IKeyframesBank = {},
    _EmptyTransitionBank extends IKeyframesBank = {},
    _EmptyConnectorEntranceBank extends IKeyframesBank = {},
    _EmptyConnectorExitBank extends IKeyframesBank = {},
    _EmptyScrollerBank extends IKeyframesBank = {},
    IncludePresets extends boolean = true
  >
  (
    customBankAddons: {
      entrances?: UserEntranceBank & IKeyframesBank<EntranceBlock>;
      exits?: UserExitBank & IKeyframesBank<ExitBlock, ExitBlockConfig>;
      emphases?: UserEmphasisBank & IKeyframesBank<EmphasisBlock>;
      motions?: UserMotionBank & IKeyframesBank<MotionBlock>;
    } = {},
    includePresets: IncludePresets | void = true as IncludePresets
  ) {
    const {entrances, exits, emphases, motions} = customBankAddons;
    _WebFlik.checkBanksFormatting(entrances, exits, emphases, motions);

    type TogglePresets<TPresetBank, TUserBank> = Readonly<(IncludePresets extends true ? TPresetBank : {}) & TUserBank>;

    const combineBanks = <P, U>(presets: P, userDefined: U) => ({...(includePresets ? presets : {}), ...(userDefined ?? {})}) as TogglePresets<P, U>;
    
    // Add the keyframes groups to the static banks of the block classes
    const combinedEntranceBank = combineBanks(presetEntrances, entrances as UserEntranceBank);
    const combinedExitBank = combineBanks(presetExits, exits as UserExitBank);
    const combinedEmphasisBank = combineBanks(presetEmphases, emphases as UserEmphasisBank);
    const combinedMotionBank = combineBanks(presetMotions, motions as UserMotionBank);
    const combinedTransitionBank = combineBanks(presetTransitions, {} as _EmptyTransitionBank);
    const combinedConnectorEntranceBank = combineBanks(presetConnectorEntrances, {} as _EmptyConnectorEntranceBank);
    const combinedConnectorExitBank = combineBanks(presetConnectorExits, {} as _EmptyConnectorExitBank);
    const combinedScrollerBank = combineBanks(presetScrolls, {} as _EmptyScrollerBank);

    // return functions that can be used to instantiate AnimBlocks with intellisense for the combined banks
    return {
      Entrance: function<
        BankType extends typeof combinedEntranceBank, AnimName extends AnimationNameIn<BankType>, EntryType extends BankType[AnimName]
      >(domElem: Element | null, animName: AnimName, ...params: Parameters<EntranceBlock<EntryType>['initialize']>) {
        return new EntranceBlock<EntryType>(domElem, animName, combinedEntranceBank, 'Entrance').initialize(...params);
      },

      Exit: function<
        BankType extends typeof combinedExitBank, AnimName extends AnimationNameIn<BankType>, EntryType extends BankType[AnimName]
      >(domElem: Element | null, animName: AnimName, ...params: Parameters<ExitBlock<EntryType>['initialize']>) {
        return new ExitBlock<EntryType>(domElem, animName, combinedExitBank, 'Exit').initialize(...params);
      },

      Emphasis: function<
        BankType extends typeof combinedEmphasisBank, AnimName extends AnimationNameIn<BankType>, EntryType extends BankType[AnimName]
      >(domElem: Element | null, animName: AnimName, ...params: Parameters<EmphasisBlock<EntryType>['initialize']>) {
        return new EmphasisBlock<EntryType>(domElem, animName, combinedEmphasisBank, 'Emphasis').initialize(...params);
      },

      Motion: function<
        BankType extends typeof combinedMotionBank, AnimName extends AnimationNameIn<BankType>, EntryType extends BankType[AnimName]
      >(domElem: Element | null, animName: AnimName, ...params: Parameters<MotionBlock<EntryType>['initialize']>) {
        return new MotionBlock<EntryType>(domElem, animName, combinedMotionBank, 'Motion').initialize(...params);
      },

      Transition: function<
        BankType extends typeof combinedTransitionBank, AnimName extends AnimationNameIn<BankType>, EntryType extends BankType[AnimName]
      >(domElem: Element | null, animName: AnimName, ...params: Parameters<TransitionBlock<EntryType>['initialize']>) {
        return new TransitionBlock<EntryType>(domElem, animName, combinedTransitionBank, 'Transition').initialize(...params);
      },

      ConnectorSetter: function(
        connectorElem: WbfkConnector,
        pointA: [elemA: Element | null, leftOffset: number, topOffset: number],
        pointB: [elemB: Element | null, leftOffset: number, topOffset: number],
        connectorConfig: WbfkConnectorConfig = {} as WbfkConnectorConfig
      ) {
        return new ConnectorSetterBlock(connectorElem, pointA, pointB, `~set-line-points`, {}, 'Connector Setter', connectorConfig).initialize([]);
      },

      ConnectorEntrance: function<
        BankType extends typeof combinedConnectorEntranceBank, AnimName extends AnimationNameIn<BankType>, EntryType extends BankType[AnimName]
      >(connectorElem: WbfkConnector | null, animName: AnimName, ...params: Parameters<ConnectorEntranceBlock<EntryType>['initialize']>) {
        return new ConnectorEntranceBlock<EntryType>(connectorElem, animName, combinedConnectorEntranceBank, 'Connector Entrance').initialize(...params);
      },

      ConnectorExit: function<BankType extends typeof combinedConnectorExitBank, AnimName extends AnimationNameIn<BankType>, EntryType extends BankType[AnimName]>
      (connectorElem: WbfkConnector | null, animName: AnimName, ...params: Parameters<ConnectorExitBlock<EntryType>['initialize']>)
      { return new ConnectorExitBlock<EntryType>(connectorElem, animName, combinedConnectorExitBank, 'Connector Exit').initialize(...params); },
      
      Scroller: function
      <BankType extends typeof combinedScrollerBank, AnimName extends AnimationNameIn<BankType>, EntryType extends BankType[AnimName]>
      (domElem: Element | null, animName: AnimName, ...params: Parameters<ScrollerBlock<EntryType>['initialize']>) {
        return new ScrollerBlock<EntryType>(domElem, animName, combinedScrollerBank, 'Scroller').initialize(...params);
      },
    };
  }

  get utils() {
    return {
      useEasing,
    };
  }

  private static checkBanksFormatting(...banks: (IKeyframesBank | undefined)[]) {
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

createStyles(`
/* Using :where makes it possible to easily for developer to override the default color */
:where(:root) {
  --wbfk-highlight-color: #F9F278;
  --wbfk-playback-button-press-color: #db0000;
  --wbfk-playback-button-hold-color: #62B720;
  --wbfk-playback-button-disabled-color: gray;
  --wbfk-playback-button-background-color: #444;
  --wbfk-playback-button-symbol-color: white;
}

.wbfk-hidden:not(.wbfk-override-hidden) {
  display: none !important;
}

.wbfk-invisible:not(.wbfk-override-hidden) {
  visibility: hidden !important;
}

.wbfk-highlightable {
  background-image: linear-gradient(to right, var(--wbfk-highlight-color) 50%, transparent 50%);
  background-size: 202%;
  background-position-x: 100%;
}`);
