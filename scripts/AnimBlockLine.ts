import { AnimBlock, AnimBlockOptions, AnimTimelineAnimation, EntranceBlock } from "./AnimBlock.js";
import { AnimBlockLineUpdater } from "./AnimBlockLineUpdater.js";
import { AnimationNameIn, IKeyframesBank, KeyframeBehaviorGroup } from "./TestUsability/WebFlik.js";

type LineOptions = {
  trackEndpoints: boolean;
};

export class FreeLine extends HTMLElement {
  static staticId: number = 0;

  private lineId: number = 0;
  useEndMarker: boolean;
  visibleLine: SVGLineElement;
  maskLine: SVGLineElement;
  gBody: SVGGElement;
  svg: SVGSVGElement;

  startPoint?: [startElem: Element, leftOffset: number, topOffset: number];
  endPoint?: [endElem: Element, leftOffset: number, topOffset: number];
  tracking: boolean = true;
  private trackingTimeout?: NodeJS.Timer;

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
    
    this.svg = element.querySelector('svg') as SVGSVGElement;
    this.gBody = element.querySelector('.free-line__body') as SVGGElement;
    this.visibleLine = this.gBody.querySelector('.free-line__line--visible') as SVGLineElement;
    this.maskLine = this.gBody.querySelector('.free-line__line--mask') as SVGLineElement;
  }

  updateEndpoints = () => {
    if (!this.startPoint || !this.endPoint) { return; }

    // to properly place the endpoints, we need the positions of their bounding boxes
    // get the bounding rectangles for starting reference element, ending reference element, and parent element
    // TODO: Use offsetParent to account for direct parent beieng statically positioned
    const svgParentElement = this.svg.parentElement!;
    
    // the class is appended without classList.add() so that multiple applications
    // of the class do not interfere with each other upon removal
    // CHANGE NOTE: elements are unhidden using override to allow access to bounding box
    this.startPoint[0].classList.value += ` wbfk-override-hidden`;
    this.endPoint[0].classList.value += ` wbfk-override-hidden`;
    const {left: startLeft, right: startRight, top: startTop, bottom: startBottom} = this.startPoint[0].getBoundingClientRect();
    const {left: endLeft, right: endRight, top: endTop, bottom: endBottom} = this.endPoint[0].getBoundingClientRect();
    const {left: parentLeft, top: parentTop} = svgParentElement.getBoundingClientRect();
    this.startPoint[0].classList.value = this.startPoint[0].classList.value.replace(` wbfk-override-hidden`, '');
    this.endPoint[0].classList.value = this.endPoint[0].classList.value.replace(` wbfk-override-hidden`, '');

    // The x and y coordinates of the line need to be with respect to the top left of document
    // Thus, we must subtract the parent element's current top and left from the offset
    // But because elements start in their parent's Content box (which excludes the border) instead of the Fill area,...
    // ...(which includes the border), our element's top and left are offset by the parent element's border width with...
    // ...respect to the actual bounding box of the parent. Therefore, we must subtract the parent's border thicknesses as well.
    const freeLineLeftOffset = -parentLeft - Number.parseFloat(getComputedStyle(svgParentElement).borderLeftWidth);
    const freeLineTopOffset = -parentTop - Number.parseFloat(getComputedStyle(svgParentElement).borderTopWidth);

    // change x and y coords of our <svg>'s nested <line> based on the bounding boxes of the start and end reference elements
    // the offset with respect to the reference elements' tops and lefts is calculated using linear interpolation
    this.x1 = (1 - this.startPoint[1]) * startLeft + (this.startPoint[1]) * startRight + freeLineLeftOffset;
    this.y1 = (1 - this.startPoint[2]) * startTop + (this.startPoint[2]) * startBottom + freeLineTopOffset;
    this.x2 = (1 - this.endPoint[1]) * endLeft + (this.endPoint[1]) * endRight + freeLineLeftOffset;
    this.y2 = (1 - this.endPoint[2]) * endTop + (this.endPoint[2]) * endBottom + freeLineTopOffset;
  }

  setTrackingInterval = () => {
    this.trackingTimeout = setInterval(this.updateEndpoints, 4);
  }

  clearTrackingInterval = () => {
    clearInterval(this.trackingTimeout);
  }
}

customElements.define('wbfk-line', FreeLine);

export class SetLineBlock extends AnimBlock {
  previousStartPoint?: [startElem: Element, leftOffset: number, topOffset: number];
  previousEndPoint?: [endElem: Element, leftOffset: number, topOffset: number];

  lineOptions: LineOptions = {} as LineOptions;
  previousLineOptions: LineOptions = {} as LineOptions;

  protected get defaultOptions(): Partial<AnimBlockOptions> {
    return {
      duration: 0,
      commitStyles: false,
    };
  }
  
  constructor(
    public freeLineElem: FreeLine,
    public startPoint: [startElem: Element, leftOffset: number, topOffset: number],
    public endPoint: [endElem: Element, leftOffset: number, topOffset: number],
    lineOptions: Partial<LineOptions> = {},
    /*animName: string, behaviorGroup: TBehavior*/
    ) {
    // if (!behaviorGroup) { throw new Error(`Invalid set line animation name ${animName}`); }

    if (!(startPoint?.[0] instanceof Element)) {
      throw new Error(`Start point element must not be undefined`); // TODO: Improve error message
    }
    if (!(endPoint?.[0] instanceof Element)) {
      throw new Error(`End point element must not be undefined`); // TODO: Improve error message
    }

    // TODO: Validate offsets?

    super(freeLineElem, `~set-line-points`, {
      generateKeyframes() {
        return [[], []];
      },
    });

    this.lineOptions = this.applyLineOptions(lineOptions);
  }

  protected _onStartForward(): void {
    this.previousStartPoint = this.freeLineElem.startPoint;
    this.previousEndPoint = this.freeLineElem.endPoint;
    this.previousLineOptions.trackEndpoints = this.freeLineElem.tracking;
    this.freeLineElem.startPoint = this.startPoint;
    this.freeLineElem.endPoint = this.endPoint;
    this.freeLineElem.tracking = this.lineOptions.trackEndpoints;
  }

  protected _onStartBackward(): void {
    this.freeLineElem.startPoint = this.previousStartPoint;
    this.freeLineElem.endPoint = this.previousEndPoint;
    this.freeLineElem.tracking = this.previousLineOptions.trackEndpoints;
  }

  applyLineOptions(lineOptions: Partial<LineOptions>): LineOptions {
    return {
      trackEndpoints: this.freeLineElem.tracking,
      ...lineOptions,
    };
  }
}

export class DrawLineBlock<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> extends AnimBlock<TBehavior> {
  freeLineBody: SVGGElement;

  protected get defaultOptions(): Partial<AnimBlockOptions> {
    return {};
  }

  constructor(public freeLineElem: FreeLine, public animName: string, behaviorGroup: TBehavior) {
    if (!behaviorGroup) { throw new Error(`Invalid line-drawing animation name ${animName}`); }
    const freeLineBody = freeLineElem.gBody;
    super(freeLineElem, animName, behaviorGroup);
    this.freeLineBody = freeLineBody;
  }

  protected _onStartForward(): void {
    this.freeLineElem.updateEndpoints();
    if (this.freeLineElem.tracking) {
      this.freeLineElem.setTrackingInterval();
    }
  }

  protected _onFinishBackward(): void {
    this.freeLineElem.clearTrackingInterval();
  }
}
