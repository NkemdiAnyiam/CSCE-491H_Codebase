export class AnimBlock {
  animObjects = []; // array of AnimObjects

  constructor(...animObjects) {
    this.addAnimObjects(animObjects);
  }

  addAnimObject(animObject) { this.animObjects.push(animObject); }
  addAnimObjects(animObjects) { animObjects.forEach(animObject => this.addAnimObject(animObject)); }

  // plays each AnimObject contained in this AnimBlock instance in sequential order
  async play() {
    for (let i = 0; i < this.animObjects.length; ++i) {
      // if the current AnimObject blocks the next AnimObject, we need to await the completion (this is intuitive)
      if (this.animObjects[i].blocksNext) {
        await this.animObjects[i].stepForward();
      }
      else {
        this.animObjects[i].stepForward();
      }
    }

    return Promise.resolve();
  }

  // rewinds each AnimObject contained in this AnimBlock instance in reverse order
  async rewind() {
    for (let i = this.animObjects.length - 1; i >= 0; --i) {
      if (this.animObjects[i].blocksPrev) {
        await this.animObjects[i].stepBackward();
      }
      else {
        this.animObjects[i].stepBackward();
      }
    }

    return Promise.resolve();
  }

  // tells every AnimObject here to briefly allow instantaneous animation
  fireSkipSignal() {
    this.animObjects.forEach(animObject => animObject.handleSkipSignal());
  }
}
