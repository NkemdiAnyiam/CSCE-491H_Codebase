import { webchalk } from "webchalk-animate";
import * as WebChalkTypes from "webchalk-animate/types-and-interfaces";

const {
  Entrance,
  Exit,
  Emphasis,
  Motion,
  ConnectorSetter,
  ConnectorEntrance,
} = webchalk.createAnimationClipFactories({
  customEntranceEffects: {
    [`super-jump`]: {
      composeEffect: (penut: string) => { return {forwardKeyframesGenerator: () => [{opacity: '1'}], backwardKeyframesGenerator: () => []} },
    },
    [`pinwheel`]: {
      composeEffect(numSpins: number, direction: 'clockwise' | 'counter-clockwise') {
        const thing = this.getEffectDetails('effectName');
        return {forwardKeyframesGenerator: () => [], backwardKeyframesGenerator: () => []};
      },
    }
    // [`preset-anim-name`]: [{fontSize: '4px'}],
  },

  customExitEffects: {
    [`super-jump-prime`]: {
      composeEffect: (name: string) => { return {forwardKeyframesGenerator: () => [{opacity: '1'}]} },
    },
    [`mega-exit`]: {
      composeEffect(age: number) {
        return {forwardKeyframesGenerator: () => [{opacity: '1'}]}
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
const thing: WebChalkTypes.WebChalkConnectorElement = {} as WebChalkTypes.WebChalkConnectorElement;
ConnectorSetter(thing, [new HTMLElement(), 0.3, 1], [new HTMLElement, 0.1, 1]);
ConnectorEntrance(thing, '~trace', ['from-A'])
// Exit(someHtmlElement, '', ['kyle']);
// Emphasis(someHtmlElement, '')
// Translation(someHtmlElement, '~translate', [{}])
// Emphasis(null, '')
// DrawLine(null, '~draw-from-start', null, [], a, [], {}, {})
