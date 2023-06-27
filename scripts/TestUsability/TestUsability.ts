import { FreeLine } from "../AnimBlockLine";
import { IKeyframesBank, WebFlik } from "./WebFlik";

const {
  Entrance,
  Exit,
  Emphasis,
  Translation,
  SetLine,
  DrawLine,
} = WebFlik.createBanks({
  Entrances: {
    [`super-jump`]: {
      generateKeyframes: (penut: string) => [[{opacity: '1'}], []],
    },
    [`pinwheel`]: {
      generateKeyframes(numSpins: number, direction: 'clockwise' | 'counter-clockwise') {
        const thing = this.AAADummyEntranceProp;
        return [[], []]
      },
    }
    // [`preset-anim-name`]: [{fontSize: '4px'}],
  },

  Exits: {
    [`super-jump-prime`]: {
      generateKeyframes: (name: string) => [[{opacity: '1'}]],
    },
    [`mega-exit`]: {
      generateKeyframes(age: number) {
        return [[{opacity: '1'}]]
      },
    },
    // 4: [{opacity: '1'}]
  },
});

// Entrance(null,).animName
const someHtmlElement = new HTMLElement();
Entrance(someHtmlElement, 'pinwheel', [4, 'counter-clockwise'], {duration: 500, blocksPrev: false});
Entrance(someHtmlElement, '~wipe', ['left']);
SetLine(new FreeLine(), [new HTMLElement(), 0.3, 1], [new HTMLElement, 0.1, 1]);
DrawLine(new FreeLine(), '~trace', ['from-start'])
// Exit(someHtmlElement, '', ['kyle']);
// Emphasis(someHtmlElement, '')
// Translation(someHtmlElement, '~translate', [{}])
// Emphasis(null, '')
// DrawLine(null, '~draw-from-start', null, [], a, [], {}, {})
