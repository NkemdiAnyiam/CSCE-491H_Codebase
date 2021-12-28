import AnimObject from './AnimObject.js';

// class AnimBlock {
//   animationsArray = [];

//   constructor(...animations) {
//     this.addAnimations(animations);
//   }

//   addAnimation(domElem, animClassName) {
//     this.animationsArray.push([domElem, animClassName]);
//   }

//   addAnimations(animations) {
//     animations.forEach(([domElem, animClassName]) => {
//       this.addAnimation(domElem, animClassName);
//     });
//   }

//   async play() {
//     for (let i = 0; i < this.animationsArray.length; ++i) {
//       await AnimObject.stepForward(...this.animationsArray[i]);
//     }

//     return Promise.resolve();
//   }

//   async rewind() {
//     for (let i = this.animationsArray.length - 1; i >= 0; --i) {
//       await AnimObject.stepBackward(...this.animationsArray[i]);
//     }

//     return Promise.resolve();
//   }
// }

class AnimBlock {
  animObjects = [];

  constructor(...animObjects) {
    this.addAnimObjects(animObjects);
  }

  addAnimObject(animObject) {
    this.animObjects.push(animObject);
  }

  addAnimObjects(animObjects) {
    animObjects.forEach(animObject => {
      this.addAnimObject(animObject);
    });
  }

  async play() {
    for (let i = 0; i < this.animObjects.length; ++i) {
      await this.animObjects[i].stepForward();
    }

    return Promise.resolve();
  }

  async rewind() {
    for (let i = this.animObjects.length - 1; i >= 0; --i) {
      await this.animObjects[i].stepBackward();
    }

    return Promise.resolve();
  }
}

export default AnimBlock;
