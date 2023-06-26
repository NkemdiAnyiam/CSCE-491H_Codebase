import { AnimBlock, AnimBlockOptions, AnimTimelineAnimation, EntranceBlock } from "./AnimBlock.js";
import { AnimBlockLineUpdater } from "./AnimBlockLineUpdater.js";
import { AnimationNameIn, IKeyframesBank, KeyframeBehaviorGroup } from "./TestUsability/WebFlik.js";

type LineOptions = {
  trackEndpoints: boolean;
};

// TODO: Handle static incrementation of id in base class
// export class AnimBlockLine extends AnimBlock {
//   // the defaults of both updateEndpointsOnEntry and trackEndpoints can be replaced in applyOptions()
//   // updateEndpointsOnEntry = true; // determines whether or not to call updateEndpoints() upon using an entering animation
//   trackEndpoints = false; // determines whether or not to continuously periodically called updateEndpoints() while visible
//   domSVGElem: SVGSVGElement;
//   lineElement: SVGLineElement;
//   startElem: HTMLElement;
//   endElem: HTMLElement;
//   leftStart: number;
//   topStart: number;
//   leftEnd: number;
//   topEnd: number;

//   constructor(
//     domSVGElem: SVGSVGElement,
//     animName: string,
//     startElem: HTMLElement, [leftStart, topStart]: [leftStart: number, topStart: number],
//     endElem: HTMLElement, [leftEnd, topEnd]: [leftEnd: number, topEnd: number],
//     options: Partial<AnimBlockOptions>,
//   ) {
//     const lineElement = domSVGElem.querySelector('line.free-line__line') as SVGLineElement;
//     if (!lineElement) { throw new Error('ERROR: SVG Element must contain line element'); } // TODO: Make more specific
//     super(lineElement, animName, options);

//     this.lineElement = lineElement;
//     this.domSVGElem = domSVGElem;
//     // enables any AnimBlockLines using the same DOM element as us to effectively toggle the continuous updates
//     AnimBlockLineUpdater.registerDomElem(this.domSVGElem);

//     // set the reference points for the start and end of the line (our <svg> element's nested <line>).
//     // Defaults to the sibling DOM element above our DOM element
//     this.startElem = startElem ? startElem : this.domSVGElem.previousElementSibling as HTMLElement;
//     this.endElem = endElem ? endElem : this.domSVGElem.previousElementSibling as HTMLElement;

//     // set the values used for the endpoint offsets relative to the top-left of each reference element
//     this.leftStart = leftStart; // 0 -> starting endpoint on left edge of startElem. 0.5 -> horizontal center of startElem
//     this.topStart = topStart; // 0 -> starting endpoint on top edge of startElem. 0.5 -> vertical center of startElem
//     this.leftEnd = leftEnd;
//     this.topEnd = topEnd;

//     this.mergeOptions(options);
//   }

//   stepForward(): Promise<void> {
//     return new Promise((resolve) => {
//       if (this.animName === 'updateEndpoints') {
//         this.updateEndpoints();
//         resolve();
//         return;
//       }
//       this.handleUpdateSettings(this.animName);

//       super.stepForward()
//       .then(() => resolve());
//     });
//   }

//   stepBackward(): Promise<void> {
//     return new Promise((resolve) => {
//       if (this.animName === 'updateEndpoints') {
//         this.updateEndpoints();
//         resolve();
//         return;
//       }
//       this.handleUpdateSettings(this.undoAnimName);

//       super.stepBackward()
//       .then(() => resolve());
//     });
//   }

//   handleUpdateSettings(animName) {
//     if (AnimBlock.isEntering(animName)) {
//       // if (this.updateEndpointsOnEntry) { this.updateEndpoints(); }
//       this.updateEndpoints();

//       // if we are exiting, turn off the interval for updateEndPoints()
//       if (AnimBlock.isExiting(animName)) { AnimBlockLineUpdater.clearInterval(this.domSVGElem); }

//       // if continuous tracking is enabled, tell AnimBlockLineUpdater to set an interval for updateEndpoints()
//       if (this.trackEndpoints) { AnimBlockLineUpdater.setInterval(this.domSVGElem, this.updateEndpoints); }
//     }
//   }

//   updateEndpoints = () => {
//     // to properly place the endpoints, we need the positions of their bounding boxes
//     // get the bounding rectangles for starting reference element, ending reference element, and parent element
//     const svgParentElement = this.domSVGElem.parentElement!;
    
//     // the class is appended without classList.add() so that multiple applications
//     // of the class do not interfere with each other upon removal
//     this.startElem.classList.value += ` wbfk-override-hidden`;
//     this.endElem.classList.value += ` wbfk-override-hidden`;
//     const {left: startLeft, right: startRight, top: startTop, bottom: startBottom} = this.startElem.getBoundingClientRect();
//     const {left: endLeft, right: endRight, top: endTop, bottom: endBottom} = this.endElem.getBoundingClientRect();
//     const {left: parentLeft, top: parentTop} = svgParentElement.getBoundingClientRect();
//     this.startElem.classList.value = this.startElem.classList.value.replace(` wbfk-override-hidden`, '');
//     this.endElem.classList.value = this.endElem.classList.value.replace(` wbfk-override-hidden`, '');

//     // The x and y coordinates of the line need to be with respect to the top left of document
//     // Thus, we must subtract the parent element's current top and left from the offset
//     // But because elements start in their parent's Content box (which excludes the border) instead of the Fill area,...
//     // ...(which includes the border), our element's top and left are offset by the parent element's border width with...
//     // ...respect to the actual bounding box of the parent. Therefore, we must subtract the parent's border thicknesses as well.
//     const SVGLeftOffset = -parentLeft - Number.parseFloat(getComputedStyle(svgParentElement).borderLeftWidth);
//     const SVGTopOffset = -parentTop - Number.parseFloat(getComputedStyle(svgParentElement).borderTopWidth);

//     // change x and y coords of our <svg>'s nested <line> based on the bounding boxes of the start and end reference elements
//     // the offset with respect to the reference elements' tops and lefts is calculated using linear interpolation
//     const line = this.domSVGElem.querySelector('line.free-line__line') as SVGLineElement;
//     line.x1.baseVal.value = (1 - this.leftStart) * startLeft + (this.leftStart) * startRight + SVGLeftOffset;
//     line.y1.baseVal.value = (1 - this.topStart) * startTop + (this.topStart) * startBottom+ SVGTopOffset;
//     line.x2.baseVal.value = (1 - this.leftEnd) * endLeft + (this.leftEnd) * endRight + SVGLeftOffset;
//     line.y2.baseVal.value = (1 - this.topEnd) * endTop + (this.topEnd) * endBottom + SVGTopOffset;
//   }

//   mergeOptions(options) {
//     if (!options) { return; }

//     super.mergeOptions(options);

//     const {lineOptions} = options;
//     if (lineOptions) { this.applyLineOptions(lineOptions); }
//   }

//   applyLineOptions(lineOptions) {
//     const {
//       // updateEndpointsOnEntry,
//       trackEndpoints,
//     } = lineOptions;
//     // this.updateEndpointsOnEntry = updateEndpointsOnEntry ?? this.updateEndpointsOnEntry;
//     this.trackEndpoints = trackEndpoints ?? this.trackEndpoints;
//   }
// }



export class FreeLine extends HTMLElement {
  static staticId: number = 0;

  private lineId: number = 0;
  useEndMarker: boolean;
  visibleLine: SVGLineElement;
  maskLine: SVGLineElement;
  gBody: SVGGElement;

  set x1(val: number) {
    this.visibleLine.x1.baseVal.value = val;
    this.maskLine.x1.baseVal.value = val;
  }
  set x2(val: number) {
    this.visibleLine.x2.baseVal.value = val;
    this.maskLine.x2.baseVal.value = val;
  }
  set y1(val: number) {
    this.visibleLine.y1.baseVal.value = val;
    this.maskLine.y1.baseVal.value = val;
  }
  set y2(val: number) {
    this.visibleLine.y2.baseVal.value = val;
    this.maskLine.y2.baseVal.value = val;
  }

  getBoundingClientRect() {
    return this.gBody.getBoundingClientRect();
  }

  // TODO: Add lifecycle callbacks
  
  constructor() {
    super();
    this.lineId = FreeLine.staticId++;
    const shadow = this.attachShadow({mode: 'open'});

    const markerId = `markerArrow--${this.lineId}`;
    const maskId = `mask--${this.lineId}`;
    this.useEndMarker = this.hasAttribute('end-marker');

    // const mainLineString = `<line class="a" pathLength="1" mask="url(#mask--${this.lineId})" />`;
    // const elemString = `
    //   <svg class="free-line free-line--arrow free-line--M-access-to-M-block M-related">
    //     <defs>
    //       <marker id="${markerId}" markerWidth="6" markerHeight="8" refX="5" refY="4" orient="auto">
    //         <path d="M0,0 L0,8 L6,4 L0,0" />
    //       </marker>
    //     </defs>
    //     <line style="marker-end: url("#${markerId}");" class="free-line__line wpfk-hidden" />
    //   </svg>
    // `

    const htmlString = `
      <svg>
        <g class="free-line__body">
          <mask id="${maskId}">
            <g class="mask-group">
              <marker id="${markerId}-end-mask" markerWidth="6" markerHeight="8" refX="5" refY="4" orient="auto">
                <path d="M0,0 L0,8 L6,4 L0,0" />
              </marker>

              <line marker-end="url(#${markerId}-end-mask)" class="free-line__line free-line__line--mask" stroke="white" />
            </g>
          </mask>

          <g mask="url(#${maskId})">
            <marker id="${markerId}-end-visible" markerWidth="6" markerHeight="8" refX="5" refY="4" orient="auto">
              <path d="M0,0 L0,8 L6,4 L0,0" />
            </marker>

            <line marker-end="url(#${markerId}-end-visible)" class="free-line__line free-line__line--visible" pathLength="1" />
          </g>
        </g>
      </svg>
    `;


    const template = document.createElement('template');
    template.insertAdjacentHTML('afterbegin', htmlString);
    const element = template.content.firstElementChild as SVGSVGElement;
    shadow.appendChild(element); // TODO: Fix Node error
    
    this.gBody = element.querySelector('.free-line__body') as SVGGElement;
    this.visibleLine = this.gBody.querySelector('.free-line__line--visible') as SVGLineElement;
    this.maskLine = this.gBody.querySelector('.free-line__line--mask') as SVGLineElement;
  }
}

customElements.define('wbfk-line', FreeLine);

export class DrawLine<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> extends AnimBlock<TBehavior> {
  // visibleLine: SVGLineElement;
  freeLineBody: SVGGElement;
  lineOptions: LineOptions;
  startLeftOffset: number;
  startTopOffset: number;
  endLeftOffset: number;
  endTopOffset: number;

  animation: AnimTimelineAnimation = new AnimTimelineAnimation(null, null);
  protected get defaultOptions(): Partial<AnimBlockOptions> {
    return {};
  }

  // constructor(domElem: Element, animName: string, behaviorGroup: TBehavior) {
  //   if (!behaviorGroup) { throw new Error(`Invalid entrance animation name ${animName}`); }
  //   super(domElem, animName, behaviorGroup);
  // }

  constructor(
    public freeLineElem: FreeLine,
    public animName: string,
    behaviorGroup: TBehavior,
    public startElem: Element,
    startOffset: [leftStart: number, topStart: number],
    public endElem: Element,
    endOffset: [leftEnd: number, topEnd: number],
    options: Partial<AnimBlockOptions>,
    lineOptions: Partial<LineOptions>,
  ) {
    const freeLineBody = freeLineElem.gBody;
    
  //   if (!behaviorGroup) { throw new Error(`Invalid entrance animation name ${animName}`); }
    super(freeLineElem, animName, behaviorGroup);
    super(freeLineBody, animName, options);

    this.freeLineBody = freeLineBody;
    this.lineOptions = this.applyLineOptions(lineOptions);

    // enables any AnimBlockLines using the same DOM element as us to effectively toggle the continuous updates
    AnimBlockLineUpdater.registerDomElem(this.freeLineElem);

    // set the values used for the endpoint offsets relative to the top-left of each reference element
    this.startLeftOffset = startOffset[0]; // 0 -> starting endpoint on left edge of startElem. 0.5 -> horizontal center of startElem
    this.startTopOffset = startOffset[1]; // 0 -> starting endpoint on top edge of startElem. 0.5 -> vertical center of startElem
    this.endLeftOffset = endOffset[0];
    this.endTopOffset = endOffset[1];
  }

  // constructor(
  //   public freeLineElem: FreeLine,
  //   public animName: AnimationNameIn<TBank>,
  //   public startElem: Element,
  //   startOffset: [leftStart: number, topStart: number],
  //   public endElem: Element,
  //   endOffset: [leftEnd: number, topEnd: number],
  //   options: Partial<AnimBlockOptions>,
  //   lineOptions: Partial<LineOptions>,
  // ) {
  //   const freeLineBody = freeLineElem.svgBody;
  //   super(freeLineBody, animName, options);

  //   this.freeLineBody = freeLineBody;
  //   this.lineOptions = this.applyLineOptions(lineOptions);

  //   // enables any AnimBlockLines using the same DOM element as us to effectively toggle the continuous updates
  //   AnimBlockLineUpdater.registerDomElem(this.freeLineElem);

  //   // set the values used for the endpoint offsets relative to the top-left of each reference element
  //   this.leftStart = startOffset[0]; // 0 -> starting endpoint on left edge of startElem. 0.5 -> horizontal center of startElem
  //   this.topStart = startOffset[1]; // 0 -> starting endpoint on top edge of startElem. 0.5 -> vertical center of startElem
  //   this.leftEnd = endOffset[0];
  //   this.topEnd = endOffset[1];
  // }
  
  applyLineOptions(lineOptions: Partial<LineOptions>): LineOptions {
    return {
      trackEndpoints: true,
      ...lineOptions,
    };
  }

  handleUpdateSettings(animName) {
    if (AnimBlock.isEntering(animName)) {
      // if (this.updateEndpointsOnEntry) { this.updateEndpoints(); }
      this.updateEndpoints();

      // if we are exiting, turn off the interval for updateEndPoints()
      if (AnimBlock.isExiting(animName)) { AnimBlockLineUpdater.clearInterval(this.freeLineElem); }

      // if continuous tracking is enabled, tell AnimBlockLineUpdater to set an interval for updateEndpoints()
      if (this.trackEndpoints) { AnimBlockLineUpdater.setInterval(this.freeLineElem, this.updateEndpoints); }
    }
  }

  updateEndpoints = () => {
    // to properly place the endpoints, we need the positions of their bounding boxes
    // get the bounding rectangles for starting reference element, ending reference element, and parent element
    // TODO: Use offsetParent to account for direct parent beieng statically positioned
    const svgParentElement = this.freeLineElem.parentElement!;
    
    // the class is appended without classList.add() so that multiple applications
    // of the class do not interfere with each other upon removal

    // CHANGE NOTE: elements are unhidden using override to allow access to bounding box
    this.startElem.classList.value += ` wbfk-override-hidden`;
    this.endElem.classList.value += ` wbfk-override-hidden`;
    const {left: startLeft, right: startRight, top: startTop, bottom: startBottom} = this.startElem.getBoundingClientRect();
    const {left: endLeft, right: endRight, top: endTop, bottom: endBottom} = this.endElem.getBoundingClientRect();
    const {left: parentLeft, top: parentTop} = svgParentElement.getBoundingClientRect();
    this.startElem.classList.value = this.startElem.classList.value.replace(` wbfk-override-hidden`, '');
    this.endElem.classList.value = this.endElem.classList.value.replace(` wbfk-override-hidden`, '');

    // The x and y coordinates of the line need to be with respect to the top left of document
    // Thus, we must subtract the parent element's current top and left from the offset
    // But because elements start in their parent's Content box (which excludes the border) instead of the Fill area,...
    // ...(which includes the border), our element's top and left are offset by the parent element's border width with...
    // ...respect to the actual bounding box of the parent. Therefore, we must subtract the parent's border thicknesses as well.
    const freeLineLeftOffset = -parentLeft - Number.parseFloat(getComputedStyle(svgParentElement).borderLeftWidth);
    const freeLineTopOffset = -parentTop - Number.parseFloat(getComputedStyle(svgParentElement).borderTopWidth);

    // change x and y coords of our <svg>'s nested <line> based on the bounding boxes of the start and end reference elements
    // the offset with respect to the reference elements' tops and lefts is calculated using linear interpolation
    this.freeLineElem.x1 = (1 - this.startLeftOffset) * startLeft + (this.startLeftOffset) * startRight + freeLineLeftOffset;
    this.freeLineElem.y1 = (1 - this.startTopOffset) * startTop + (this.startTopOffset) * startBottom + freeLineTopOffset;
    this.freeLineElem.x2 = (1 - this.endLeftOffset) * endLeft + (this.endLeftOffset) * endRight + freeLineLeftOffset;
    this.freeLineElem.y2 = (1 - this.endTopOffset) * endTop + (this.endTopOffset) * endBottom + freeLineTopOffset;
  }
}
