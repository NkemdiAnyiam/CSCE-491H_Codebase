import { WebFlik } from "./WebFlik";

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
  Exit
} = WebFlik.createBanks({
  Entrances: {
    [`super-jump`]: [{opacity: '1'}],
    // [`preset-anim-name`]: [{fontSize: '4px'}],
  },
  Exits: {
    [`super-jump`]: [{opacity: '1'}],
    4: [{opacity: '1'}]
  }
});

// Entrance(null,).animName
// Entrance(null, '')
// Exit(new HTMLElement(), 'super-jump',
