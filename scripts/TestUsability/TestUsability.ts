import { webimator } from "webimator";
import * as WbmtrTypes from "webimator/types-and-interfaces";

const {
  Entrance,
  Exit,
  Emphasis,
  Motion,
  ConnectorSetter,
  ConnectorEntrance,
} = webimator.createAnimationClipFactories({
  customEntranceEffects: {
    [`super-jump`]: {
      generateKeyframes: (penut: string) => { return {forwardFrames: [{opacity: '1'}], backwardFrames: []} },
    },
    [`pinwheel`]: {
      generateKeyframes(numSpins: number, direction: 'clockwise' | 'counter-clockwise') {
        const thing = this.getEffectDetails('effectName');
        return {forwardFrames: [], backwardFrames: []};
      },
    }
    // [`preset-anim-name`]: [{fontSize: '4px'}],
  },

  customExitEffects: {
    [`super-jump-prime`]: {
      generateKeyframes: (name: string) => { return {forwardFrames: [{opacity: '1'}]} },
    },
    [`mega-exit`]: {
      generateKeyframes(age: number) {
        return {forwardFrames: [{opacity: '1'}]}
      },
      defaultConfig: {
        exitType: 'visibility-hidden'
      }
    },
    // 4: [{opacity: '1'}]
  },
});

// Entrance(null,).animName
const someHtmlElement = new HTMLElement();
Entrance(someHtmlElement, 'pinwheel', [4, 'counter-clockwise'], {duration: 500});
Entrance(someHtmlElement, '~wipe', ['from-left']);
const thing: WbmtrTypes.WbmtrConnector = {} as WbmtrTypes.WbmtrConnector;
ConnectorSetter(thing, [new HTMLElement(), 0.3, 1], [new HTMLElement, 0.1, 1]);
ConnectorEntrance(thing, '~trace', ['from-A'])
// Exit(someHtmlElement, '', ['kyle']);
// Emphasis(someHtmlElement, '')
// Translation(someHtmlElement, '~translate', [{}])
// Emphasis(null, '')
// DrawLine(null, '~draw-from-start', null, [], a, [], {}, {})
