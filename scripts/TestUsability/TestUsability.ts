import { IKeyframesBank, WebFlik } from "./WebFlik";

// WebFlik.createBanks()

// const bonk = WebFlik.createBanks({
//   excludePresets: true,
//   userDefined: {
//     [`super-jump`]: [{opacity: '1'}],
//     [`preset-anim-name`]: [{fontSize: '4px'}],
//   }
// })

// // const str: keyof AnimNames<typeof bank> = ''
// bonk.animate()










const {
  Entrance,
  Exit,
  Emphasis,
} = WebFlik.createBanks({
  Entrances: {
    [`super-jump`]: {
      keyframes: [{opacity: '1'}],
    },
    // [`preset-anim-name`]: [{fontSize: '4px'}],
  },

  Exits: {
    [`super-jump-prime`]: {
      keyframes: [{opacity: '1'}],
    },
    // 4: [{opacity: '1'}]
  },
} satisfies {[key: string]: IKeyframesBank});

// Entrance(null,).animName
// Entrance(null, '')
// Exit(new HTMLElement(), '',
// Emphasis(null, '')
