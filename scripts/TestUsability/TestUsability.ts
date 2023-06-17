import { IKeyframesBank, WebFlik } from "./WebFlik";

const {
  Entrance,
  // Exit,
  // Emphasis,
  // DrawLine,
} = WebFlik.createBanks({
  Entrances: {
    [`super-jump`]: {
      generateKeyframes: (penut: string) => [[{opacity: '1'}], []],
    },
    [`pinwheel`]: {
      generateKeyframes(numSpins: number, direction: 'clockwise' | 'counter-clockwise') {
        // this
        return [[], []]
      },
    }
    // [`preset-anim-name`]: [{fontSize: '4px'}],
  },

  // Exits: {
  //   [`super-jump-prime`]: {
  //     keyframes: [{opacity: '1'}],
  //   },
  //   // 4: [{opacity: '1'}]
  // },
  
});

// Entrance(null,).animName
const someHtmlElement = new HTMLElement()
Entrance(someHtmlElement, 'pinwheel', [4, 'clockwise'], {duration: 500, blocksPrev: false});
Entrance(someHtmlElement, '~wipe-from-left', []);
// Exit(new HTMLElement(), '',
// Emphasis(null, '')
// DrawLine(null, '~draw-from-start', null, [], a, [], {}, {})
