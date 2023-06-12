import { IKeyframesBank, KeyframeBehaviorGroup } from "./TestUsability/WebFlik";

// class PresetEntrances implements IKeyframesBank<PresetEntrances>
//#region
// class PresetEntrances implements IKeyframesBank<PresetEntrances> {
//   private constructor() {}

//   static createInstance(): PresetEntrances {
//     return new PresetEntrances();
//   }

//   [`~fade-in`] = {
//     keyframes: [
//       {opacity: '0'},
//       {opacity: '1'},
//     ]
//   };
    
//   [`~wipe-from-right`] = {
//     keyframes: [
//       {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ]
//   };
    
//   [`~wipe-from-left`] = {
//     keyframes: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ]
//   };
    
//   [`~wipe-from-top`] = {
//     keyframes: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ]
//   };
  
//   [`~wipe-from-bottom`] = {
//     keyframes: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ]
//   };

//   // invalidProperty = 5;
// }
//#endregion

// class PresetExits implements IKeyframesBank<PresetExits>
//#region
// class PresetExits implements IKeyframesBank<PresetExits> {
//   private constructor() {}

//   static createInstance(): PresetExits {
//     return new PresetExits();
//   }

//   [`~fade-out`] = {
//     keyframes: [
//       {opacity: '1'},
//       {opacity: '0'},
//     ],
//   };
        
//   ['~wipe-to-right'] = {
//     keyframes: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
//     ],
//   };

//   [`~wipe-to-left`] = {
//     keyframes: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ],
//   };

//   [`~wipe-to-top`] = {
//     keyframes: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
//     ],
//   };

//   [`~wipe-to-bottom`] = {
//     keyframes: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ],
//   };
// }
//#endregion

// class PresetEmphases implements IKeyframesBank<PresetEmphases>
//#region
// export class PresetEmphases implements IKeyframesBank<PresetEmphases> {
//   private constructor() {}

//   static createInstance(): PresetEmphases {
//     return new PresetEmphases();
//   }

//   [`~highlight`] = {
//     keyframes: [
//       {backgroundPositionX: '100%'},
//       {backgroundPositionX: '0%'},
//     ],
//     options: {
//       classesOnStartForward: [`highlightable`],
//       dog: 4,
//     },
//   }
// }
//#endregion

// class Presets
//#region
// class Presets {
//   private constructor() {

//   }

//   static createInstance(): Presets {
//     return new Presets();
//   }

//   Emphasis: Thang = {
//     [`highlight`]: [
//       {backgroundPositionX: '100%'},
//       {backgroundPositionX: '0%'},
//     ],
//   }

//   Entrance: Thang = {
//     [`fade-in`]: [
//       {opacity: '0'},
//       {opacity: '1'},
//     ],
      
//     [`enter-wipe-from-right`]: [
//       {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ],
      
//     [`enter-wipe-from-left`]: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ],
      
//     [`enter-wipe-from-top`]: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ],
    
//     [`enter-wipe-from-bottom`]: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ],    
//   };

//   Exit: Thang = {
//     [`fade-out`]: [
//       {opacity: '1'},
//       {opacity: '0'},
//     ],
          
//     ['exit-wipe-to-right']: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
//     ],

//     [`exit-wipe-to-left`]: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ],

//     [`exit-wipe-to-top`]: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
//     ],

//     [`exit-wipe-to-bottom`]: [
//       {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//       {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     ],
//   };

//   //****************************************************** ANIMATION PRESETS

//   //******************************************** Highlight
//   [`highlight`] = [
//     {backgroundPositionX: '100%'},
//     {backgroundPositionX: '0%'},
//   ];

//   //******************************************** Fade */
//   [`fade-in`] = [
//     {opacity: '0'},
//     {opacity: '1'},
//   ];

  
//   [`fade-out`]= [
//     {opacity: '1'},
//     {opacity: '0'},
//   ];

//   //******************************************** Wipe
//   // To/From Right
//   [`enter-wipe-from-right`] = [
//     {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   ];

//   ['exit-wipe-to-right'] = [
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
//   ];

//   // To/From Left
//   [`enter-wipe-from-left`] = [
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   ];

//   [`exit-wipe-to-left`] = [
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   ];

//   // To/From Top
//   [`enter-wipe-from-top`] = [
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   ];

//   [`exit-wipe-to-top`] = [
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
//   ];

//   // To/From Bottom
//   [`enter-wipe-from-bottom`] = [
//     {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   ];

//   [`exit-wipe-to-bottom`] = [
//     {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//     {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
//   ];
// }
//#endregion


export const presetEntrances = {
  [`~fade-in`]: {
    keyframes: [
      {opacity: '0'},
      {opacity: '1'},
    ],
  },
    
  [`~wipe-from-right`]: {
    keyframes: [
      {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
    ],
  },
    
  [`~wipe-from-left`]: {
    keyframes: [
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
    ],
  },
    
  [`~wipe-from-top`]: {
    keyframes: [
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
    ],
  },
  
  [`~wipe-from-bottom`]: {
    keyframes: [
      {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
    ],
  },

  // invalidProperty: 5,
} satisfies IKeyframesBank;


export const presetExits = {
  [`~fade-out`]: {
    keyframes: [
      {opacity: '1'},
      {opacity: '0'},
    ],
  },
        
  ['~wipe-to-right']: {
    keyframes: [
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
      {clipPath: 'polygon(calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem))'},
    ],
  },

  [`~wipe-to-left`]: {
    keyframes: [
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
    ],
  },

  [`~wipe-to-top`]: {
    keyframes: [
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(0px - 2rem) calc(0px - 2rem))'},
    ],
  },

  [`~wipe-to-bottom`]: {
    keyframes: [
      {clipPath: 'polygon(calc(0px - 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(0px - 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
      {clipPath: 'polygon(calc(0px - 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(100% + 2rem) calc(100% + 2rem), calc(0px - 2rem) calc(100% + 2rem))'},
    ],
  },
} satisfies IKeyframesBank;


export const presetEmphases = {
  [`~highlight`]: {
    keyframes: [
      {backgroundPositionX: '100%'},
      {backgroundPositionX: '0%'},
    ],
    options: {
      classesOnStartForward: [`highlightable`],
      // invalidProp: 4,
    },
  }
} satisfies IKeyframesBank;
