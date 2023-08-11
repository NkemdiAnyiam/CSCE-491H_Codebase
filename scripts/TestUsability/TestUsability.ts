import { Connector } from "../AnimBlockLine";
import { WebFlik } from "./WebFlik";

const {
  Entrance,
  Exit,
  Emphasis,
  Translation,
  SetConnector,
  DrawConnector,
} = WebFlik.createBanks({
  Entrances: {
    [`super-jump`]: {
      generateKeyframes: (penut: string) => [[{opacity: '1'}], []],
    },
    [`pinwheel`]: {
      generateKeyframes(numSpins: number, direction: 'clockwise' | 'counter-clockwise') {
        const thing = this.animName;
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
Entrance(someHtmlElement, 'pinwheel', [4, 'counter-clockwise'], {duration: 500});
Entrance(someHtmlElement, '~wipe', ['from-left']);
SetConnector(new Connector(), [new HTMLElement(), 0.3, 1], [new HTMLElement, 0.1, 1]);
DrawConnector(new Connector(), '~trace', ['from-A'])
// Exit(someHtmlElement, '', ['kyle']);
// Emphasis(someHtmlElement, '')
// Translation(someHtmlElement, '~translate', [{}])
// Emphasis(null, '')
// DrawLine(null, '~draw-from-start', null, [], a, [], {}, {})
