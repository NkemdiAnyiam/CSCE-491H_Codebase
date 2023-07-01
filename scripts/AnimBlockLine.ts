import { AnimBlock, AnimBlockConfig, AnimTimelineAnimation, EntranceBlock } from "./AnimBlock.js";
import { AnimBlockLineUpdater } from "./AnimBlockLineUpdater.js";
import { AnimationNameIn, IKeyframesBank, KeyframesBankEntry } from "./TestUsability/WebFlik.js";

type ConnectorConfig = {
  trackEndpoints: boolean;
};

export class Connector extends HTMLElement {
  static staticId: number = 0;

  private connectorId: number = 0;
  useEndMarker: boolean;
  useStartMarker: boolean;
  private lineLayer: SVGLineElement;
  private lineMask: SVGLineElement;
  private gBody: SVGGElement;
  private mask: SVGMaskElement;

  startPoint?: [startElem: Element, leftOffset: number, topOffset: number];
  endPoint?: [endElem: Element, leftOffset: number, topOffset: number];
  tracking: boolean = false;
  private trackingTimeout?: NodeJS.Timer;

  get x1(): number { return this.lineLayer.x1.baseVal.value; }
  get x2(): number { return this.lineLayer.x2.baseVal.value; }
  get y1(): number { return this.lineLayer.y1.baseVal.value; }
  get y2(): number { return this.lineLayer.y2.baseVal.value; }

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
    this.connectorId = Connector.staticId++;
    const shadow = this.attachShadow({mode: 'open'});

    const markerId = `markerArrow--${this.connectorId}`;
    const maskId = `mask--${this.connectorId}`;
    this.useEndMarker = this.hasAttribute('end-marker');
    this.useStartMarker = this.hasAttribute('start-marker');

    this.classList.add('markers-hidden'); // TODO: Find better solution

    // <link rel="preload" href="/scripts/TestUsability/line-styles.css" as="style" />

    // TODO: Improve marker sizing configuration
    const htmlString = `
    <style>
      :host {
        position: absolute;
        top: 0;
        left: 0;
        display: initial;
        line-height: 0 !important;
        overflow: visible !important;
        visibility: hidden !important;
      }

      :host(.markers-hidden) marker {
        visibility: hidden;
      }
      
      .connector__svg {
        visibility: hidden !important;
        overflow: visible !important;
      }
      
      .connector__g-body {
        visibility: initial;
      }
      
      .connector__mask-group {
        stroke: white !important;
        fill: white !important;
      }
      
      .connector__layer-group {
        
      }

      .connector__line {
        fill: none;
      }
      
      .connector__line--mask {
        stroke-dashoffset: 0 !important;
      }
      
      .connector__line--layer {
        stroke-dasharray: 1 !important;
      }
      
      marker {
        stroke: none;
      }
    </style>

      <svg class="connector__svg">
        <g class="connector__g-body">
          <mask id="${maskId}" maskUnits="userSpaceOnUse">
            <g class="connector__mask-group">
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
                class="connector__line connector__line--mask"
              />
            </g>
          </mask>

          <g mask="url(#${maskId})" class="connector__layer-group">
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
              class="connector__line connector__line--layer"
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
    
    this.gBody = shadow.querySelector('.connector__g-body') as SVGGElement;
    this.lineLayer = this.gBody.querySelector('.connector__line--layer') as SVGLineElement;
    this.lineMask = this.gBody.querySelector('.connector__line--mask') as SVGLineElement;
    this.mask = this.gBody.querySelector('mask') as SVGMaskElement;
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
    const connectorLeftOffset = -parentLeft - Number.parseFloat(getComputedStyle(svgParentElement).borderLeftWidth);
    const connectorTopOffset = -parentTop - Number.parseFloat(getComputedStyle(svgParentElement).borderTopWidth);

    // change x and y coords of our <svg>'s nested <line> based on the bounding boxes of the start and end reference elements
    // the offset with respect to the reference elements' tops and lefts is calculated using linear interpolation
    const x1 = (1 - this.startPoint[1]) * startLeft + (this.startPoint[1]) * startRight + connectorLeftOffset;
    const y1 = (1 - this.startPoint[2]) * startTop + (this.startPoint[2]) * startBottom + connectorTopOffset;
    const x2 = (1 - this.endPoint[1]) * endLeft + (this.endPoint[1]) * endRight + connectorLeftOffset;
    const y2 = (1 - this.endPoint[2]) * endTop + (this.endPoint[2]) * endBottom + connectorTopOffset;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    // TODO: Document
    this.mask.width.baseVal.valueAsString = `${Math.abs(x2 - x1) + 50}`;
    this.mask.x.baseVal.valueAsString = `${Math.min(x1, x2) - 25}`;
    this.mask.height.baseVal.valueAsString = `${Math.abs(y2 - y1) + 50}`;
    this.mask.y.baseVal.valueAsString = `${Math.min(y1, y2) - 25}`;
  }

  setTrackingInterval = () => {
    this.trackingTimeout = setInterval(this.updateEndpoints, 4);
  }

  clearTrackingInterval = () => {
    clearInterval(this.trackingTimeout);
  }
}

customElements.define('wbfk-connector', Connector);

export class SetConnectorBlock extends AnimBlock {
  connectorElem: Connector;
  previousStartPoint?: [startElem: Element, leftOffset: number, topOffset: number];
  previousEndPoint?: [endElem: Element, leftOffset: number, topOffset: number];
  startPoint: [startElem: Element, leftOffset: number, topOffset: number];
  endPoint: [endElem: Element, leftOffset: number, topOffset: number];

  connectorConfig: ConnectorConfig = {} as ConnectorConfig;
  previousConnectorConfig: ConnectorConfig = {} as ConnectorConfig;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      duration: 0,
      commitStyles: false,
      pregenerateKeyframes: true,
    };
  }
  
  constructor(
    connectorElem: Connector | null,
    startPoint: [startElem: Element | null, leftOffset: number, topOffset: number],
    endPoint: [endElem: Element | null, leftOffset: number, topOffset: number],
    connectorConfig: Partial<ConnectorConfig> = {},
    /*animName: string, behaviorGroup: TBehavior*/
    ) {
    // if (!behaviorGroup) { throw new Error(`Invalid set line animation name ${animName}`); }

    if (!connectorElem) { throw new Error('Connector element must not be null'); }
    if (!(connectorElem instanceof Connector)) { throw new Error('Must pass Connector element'); }
    if (!(startPoint?.[0] instanceof Element)) {
      throw new Error(`Start point element must not be null`); // TODO: Improve error message
    }
    if (!(endPoint?.[0] instanceof Element)) {
      throw new Error(`End point element must not be null`); // TODO: Improve error message
    }

    // TODO: Validate offsets?

    super(connectorElem, `~set-line-points`, {
      generateKeyframes() {
        return [[], []];
      },
    });

    this.connectorElem = connectorElem;
    this.startPoint = startPoint as [startElem: Element, leftOffset: number, topOffset: number];
    this.endPoint = endPoint as [endElem: Element, leftOffset: number, topOffset: number];

    this.connectorConfig = this.applyLineConfig(connectorConfig);
  }

  protected _onStartForward(): void {
    this.previousStartPoint = this.connectorElem.startPoint;
    this.previousEndPoint = this.connectorElem.endPoint;
    this.previousConnectorConfig.trackEndpoints = this.connectorElem.tracking;
    this.connectorElem.startPoint = this.startPoint;
    this.connectorElem.endPoint = this.endPoint;
    this.connectorElem.tracking = this.connectorConfig.trackEndpoints;
  }

  protected _onStartBackward(): void {
    this.connectorElem.startPoint = this.previousStartPoint;
    this.connectorElem.endPoint = this.previousEndPoint;
    this.connectorElem.tracking = this.previousConnectorConfig.trackEndpoints;
  }

  applyLineConfig(connectorConfig: Partial<ConnectorConfig>): ConnectorConfig {
    return {
      trackEndpoints: this.connectorElem.tracking,
      ...connectorConfig,
    };
  }
}

export class DrawConnectorBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  connectorElem: Connector;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      classesToRemoveOnStart: ['wbfk-hidden'],
      commitStyles: false,
      // pregenerateKeyframes: true,
    };
  }

  constructor(connectorElem: Connector | null, public animName: string, bankEntry: TBankEntry) {
    if (!bankEntry) { throw new Error(`Invalid line-drawing animation name ${animName}`); }
    if (!connectorElem) { throw new Error('Connector element must not be null'); }
    if (!(connectorElem instanceof Connector)) { throw new Error('Must pass Connector element'); }

    super(connectorElem, animName, bankEntry);
    this.connectorElem = connectorElem;
  }

  stepForward(): Promise<void> {
    this.connectorElem.updateEndpoints();
    return super.stepForward();
  }

  protected _onStartForward(): void {
    // this.connectorElem.updateEndpoints();
    this.domElem.classList.remove('wbfk-hidden');
    if (this.connectorElem.tracking) {
      this.connectorElem.setTrackingInterval();
    }
  }

  protected _onFinishBackward(): void {
    this.domElem.classList.add('wbfk-hidden');
    this.connectorElem.clearTrackingInterval();
  }
}

export class EraseConnectorBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  connectorElem: Connector;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      classesToAddOnFinish: ['wbfk-hidden'],
      commitStyles: false,
      // pregenerateKeyframes: true,
    };
  }

  constructor(connectorElem: Connector | null, public animName: string, bankEntry: TBankEntry) {
    if (!bankEntry) { throw new Error(`Invalid line-erasing animation name ${animName}`); }
    if (!connectorElem) { throw new Error('Connector element must not be null'); }
    if (!(connectorElem instanceof Connector)) { throw new Error('Must pass Connector element'); }

    super(connectorElem, animName, bankEntry);
    this.connectorElem = connectorElem;
  }

  protected _onStartForward(): void {
    this.connectorElem.clearTrackingInterval();
  }

  stepBackward(): Promise<void> {
    this.connectorElem.updateEndpoints();
    return super.stepBackward();
  }

  protected _onStartBackward(): void {
    if (this.connectorElem.tracking) {
      this.connectorElem.setTrackingInterval();
    }
  }
}
