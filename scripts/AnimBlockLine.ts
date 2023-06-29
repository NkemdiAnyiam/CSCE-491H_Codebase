import { AnimBlock, AnimBlockConfig, AnimTimelineAnimation, EntranceBlock } from "./AnimBlock.js";
import { AnimBlockLineUpdater } from "./AnimBlockLineUpdater.js";
import { AnimationNameIn, IKeyframesBank, KeyframeBehaviorGroup } from "./TestUsability/WebFlik.js";

type LineConfig = {
  trackEndpoints: boolean;
};

export class FreeLine extends HTMLElement {
  static staticId: number = 0;

  private lineId: number = 0;
  useEndMarker: boolean;
  useStartMarker: boolean;
  lineLayer: SVGLineElement;
  lineMask: SVGLineElement;
  gBody: SVGGElement;
  svg: SVGSVGElement;

  startPoint?: [startElem: Element, leftOffset: number, topOffset: number];
  endPoint?: [endElem: Element, leftOffset: number, topOffset: number];
  tracking: boolean = false;
  private trackingTimeout?: NodeJS.Timer;

  set x1(val: number) {
    this.lineLayer.x1.baseVal.value = val;
    this.lineMask.x1.baseVal.value = val;
  }
  set x2(val: number) {
    this.lineLayer.x2.baseVal.value = val;
    this.lineMask.x2.baseVal.value = val;
  }
  set y1(val: number) {
    this.lineLayer.y1.baseVal.value = val;
    this.lineMask.y1.baseVal.value = val;
  }
  set y2(val: number) {
    this.lineLayer.y2.baseVal.value = val;
    this.lineMask.y2.baseVal.value = val;
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
    this.useStartMarker = this.hasAttribute('start-marker');

    this.classList.add('markers-hidden'); // TODO: Find better solution

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

    // <link rel="preload" href="/scripts/TestUsability/line-styles.css" as="style" />

    const htmlString = `
    <style>
      :host {
        display: inline-block;
        color: black;
        stroke-linecap: round;
        line-height: 0 !important;
        overflow: visible !important;
        stroke-width: 2;
        /* visibility: hidden; */
      }

      :host(.markers-hidden) marker {
        visibility: hidden;
      }
      
      .free-line {
        visibility: hidden;
        width: auto;
        height: auto;
        position: absolute;
        top: 0;
        left: 0;
        /* pointer-events: none; */
        overflow: visible !important;
        z-index: 1000;
      }
      
      .free-line__body {
        visibility: initial;
      }
      
      .mask-group {
        color: white !important;
        stroke: currentColor !important;
        fill: currentColor !important;
      }
      
      .mask-line {
        stroke-dashoffset: 0 !important;
      /*   stroke-dasharray: 10; */
      }
      
      .main-group {
        
      }
      
      .main-line {
        stroke: currentColor !important;
        stroke-dasharray: 1 !important;
      }
      
      marker {
        fill: currentColor !important;
      }
      
      /*marker.hidden {
        visibility: hidden;
      }*/
    </style>

      <svg class="free-line">
        <g class="free-line__body">
          <mask id="${maskId}">
            <g class="mask-group">
              ${
                this.useStartMarker ?
                `<marker id="${markerId}-start-mask" markerWidth="6" markerHeight="8" refX="5" refY="4" orient="auto-start-reverse">
                  <path d="M0,0 L0,8 L6,4 L0,0" />
                </marker>` :
                ''
              }
              ${
                this.useEndMarker ?
                `<marker id="${markerId}-end-mask" markerWidth="6" markerHeight="8" refX="5" refY="4" orient="auto">
                  <path d="M0,0 L0,8 L6,4 L0,0" />
                </marker>` :
                ''
              }

              <line
                ${this.useStartMarker ? `marker-start="url(#${markerId}-start-mask)"` : ''}
                ${this.useEndMarker ? `marker-end="url(#${markerId}-end-mask)"` : ''}
                class="free-line__line free-line__line--mask mask-line" stroke="white"
              />
            </g>
          </mask>

          <g mask="url(#${maskId})" class="layer-group">
            ${
              this.useStartMarker ?
              `<marker id="${markerId}-start-layer" markerWidth="6" markerHeight="8" refX="5" refY="4" orient="auto-start-reverse">
                <path d="M0,0 L0,8 L6,4 L0,0" />
              </marker>` :
              ''
            }
            ${
              this.useEndMarker ?
              `<marker id="${markerId}-end-layer" markerWidth="6" markerHeight="8" refX="5" refY="4" orient="auto">
                <path d="M0,0 L0,8 L6,4 L0,0" />
              </marker>` :
              ''
            }

            <line
              ${this.useStartMarker ? `marker-start="url(#${markerId}-start-layer)"` : ''}
              ${this.useEndMarker ? `marker-end="url(#${markerId}-end-layer)"` : ''}
              class="free-line__line free-line__line--layer main-line"
              pathLength="1"
            />
          </g>
        </g>
      </svg>
    `;

    const template = document.createElement('template');
    template.innerHTML = htmlString;
    const element = template.content.cloneNode(true);
    shadow.append(element);
    
    this.svg = shadow.querySelector('svg') as SVGSVGElement;
    this.gBody = shadow.querySelector('.free-line__body') as SVGGElement;
    this.lineLayer = this.gBody.querySelector('.free-line__line--layer') as SVGLineElement;
    this.lineMask = this.gBody.querySelector('.free-line__line--mask') as SVGLineElement;
  }

  updateEndpoints = () => {
    if (!this.startPoint || !this.endPoint) { return; }

    // to properly place the endpoints, we need the positions of their bounding boxes
    // get the bounding rectangles for starting reference element, ending reference element, and parent element
    // TODO: Use offsetParent to account for direct parent beieng statically positioned
    const svgParentElement = this.parentElement!;
    
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

  lineConfig: LineConfig = {} as LineConfig;
  previousLineConfig: LineConfig = {} as LineConfig;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      duration: 0,
      commitStyles: false,
    };
  }
  
  constructor(
    public freeLineElem: FreeLine,
    public startPoint: [startElem: Element, leftOffset: number, topOffset: number],
    public endPoint: [endElem: Element, leftOffset: number, topOffset: number],
    lineConfig: Partial<LineConfig> = {},
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

    this.lineConfig = this.applyLineConfig(lineConfig);
  }

  protected _onStartForward(): void {
    this.previousStartPoint = this.freeLineElem.startPoint;
    this.previousEndPoint = this.freeLineElem.endPoint;
    this.previousLineConfig.trackEndpoints = this.freeLineElem.tracking;
    this.freeLineElem.startPoint = this.startPoint;
    this.freeLineElem.endPoint = this.endPoint;
    this.freeLineElem.tracking = this.lineConfig.trackEndpoints;
  }

  protected _onStartBackward(): void {
    this.freeLineElem.startPoint = this.previousStartPoint;
    this.freeLineElem.endPoint = this.previousEndPoint;
    this.freeLineElem.tracking = this.previousLineConfig.trackEndpoints;
  }

  applyLineConfig(lineConfig: Partial<LineConfig>): LineConfig {
    return {
      trackEndpoints: this.freeLineElem.tracking,
      ...lineConfig,
    };
  }
}

export class DrawLineBlock<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> extends AnimBlock<TBehavior> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {};
  }

  constructor(public freeLineElem: FreeLine, public animName: string, behaviorGroup: TBehavior) {
    if (!behaviorGroup) { throw new Error(`Invalid line-drawing animation name ${animName}`); }
    super(freeLineElem, animName, behaviorGroup);
  }

  protected _onStartForward(): void {
    this.freeLineElem.updateEndpoints();
    this.domElem.classList.remove('wbfk-hidden');
    if (this.freeLineElem.tracking) {
      this.freeLineElem.setTrackingInterval();
    }
  }

  protected _onFinishBackward(): void {
    this.domElem.classList.add('wbfk-hidden');
    this.freeLineElem.clearTrackingInterval();
  }
}

export class EraseLineBlock<TBehavior extends KeyframeBehaviorGroup = KeyframeBehaviorGroup> extends AnimBlock<TBehavior> {
  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {};
  }

  constructor(public freeLineElem: FreeLine, public animName: string, behaviorGroup: TBehavior) {
    if (!behaviorGroup) { throw new Error(`Invalid line-erasing animation name ${animName}`); }
    super(freeLineElem, animName, behaviorGroup);
  }

  protected _onStartForward(): void {
    this.freeLineElem.clearTrackingInterval();
  }

  protected _onStartBackward(): void {
    this.freeLineElem.updateEndpoints();
    if (this.freeLineElem.tracking) {
      this.freeLineElem.setTrackingInterval();
    }
  }
}
