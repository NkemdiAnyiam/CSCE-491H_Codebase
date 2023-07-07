import { AnimBlock, AnimBlockConfig } from "./AnimBlock.js";
import { KeyframesBankEntry } from "./TestUsability/WebFlik.js";

export type ConnectorConfig = {
  trackEndpoints: boolean;
};

export class Connector extends HTMLElement {
  static staticId: number = 0;

  private connectorId: number = 0;
  readonly markerIdPrefix: string;
  usesMarkerB: boolean;
  usesMarkerA: boolean;
  private lineLayer: SVGLineElement;
  private lineMask: SVGLineElement;
  private gBody: SVGGElement;
  private mask: SVGMaskElement;

  pointA?: [elemA: Element, leftOffset: number, topOffset: number];
  pointB?: [elemB: Element, leftOffset: number, topOffset: number];
  trackingEnabled: boolean = false;
  private currentlyTracking: boolean = false;
  private timeoutForTracking?: NodeJS.Timer;

  get ax(): number { return this.lineLayer.x1.baseVal.value; }
  get bx(): number { return this.lineLayer.x2.baseVal.value; }
  get ay(): number { return this.lineLayer.y1.baseVal.value; }
  get by(): number { return this.lineLayer.y2.baseVal.value; }

  set ax(val: number) {
    this.lineLayer.x1.baseVal.value = val;
    this.lineMask.x1.baseVal.value = val;
  }
  set bx(val: number) {
    this.lineLayer.x2.baseVal.value = val;
    this.lineMask.x2.baseVal.value = val;
  }
  set ay(val: number) {
    this.lineLayer.y1.baseVal.value = val;
    this.lineMask.y1.baseVal.value = val;
  }
  set by(val: number) {
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

    const markerIdPrefix = `markerArrow--${this.connectorId}`;
    this.markerIdPrefix = markerIdPrefix;
    const maskId = `mask--${this.connectorId}`;
    this.usesMarkerA = this.hasAttribute('a-marker');
    this.usesMarkerB = this.hasAttribute('b-marker');
    const markerWidth = 5;
    const markerHeight = 7;

    // TODO: Improve marker sizing configuration
    const htmlString = `
    <style>
      :host {
        --a-marker: url(#${markerIdPrefix}-a--layer);
        --b-marker: url(#${markerIdPrefix}-b--layer);
        position: absolute;
        top: 0;
        left: 0;
        display: initial;
        line-height: 0 !important;
        overflow: visible !important;
        visibility: hidden !important;
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
        marker-start: var(--a-marker);
        marker-end: var(--b-marker);
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
                this.usesMarkerA ?
                `<marker id="${markerIdPrefix}-a--mask" markerWidth="${markerWidth}" markerHeight="${markerHeight}" refX="${markerWidth-1}" refY="${markerHeight/2}" orient="auto-start-reverse">
                  <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
                </marker>` :
                ''
              }
              ${
                this.usesMarkerB ?
                `<marker id="${markerIdPrefix}-b--mask" markerWidth="${markerWidth}" markerHeight="${markerHeight}" refX="${markerWidth-1}" refY="${markerHeight/2}" orient="auto">
                  <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
                </marker>` :
                ''
              }

              <line
                ${this.usesMarkerA ? `marker-start="url(#${markerIdPrefix}-a--mask)"` : ''}
                ${this.usesMarkerB ? `marker-end="url(#${markerIdPrefix}-b--mask)"` : ''}
                class="connector__line connector__line--mask"
              />
            </g>
          </mask>

          <g mask="url(#${maskId})" class="connector__layer-group">
            ${
              this.usesMarkerA ?
              `<marker id="${markerIdPrefix}-a--layer" markerWidth="${markerWidth}" markerHeight="${markerHeight}" refX="${markerWidth-1}" refY="${markerHeight/2}" orient="auto-start-reverse">
                <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
              </marker>` :
              ''
            }
            ${
              this.usesMarkerB ?
              `<marker id="${markerIdPrefix}-b--layer" markerWidth="${markerWidth}" markerHeight="${markerHeight}" refX="${markerWidth-1}" refY="${markerHeight/2}" orient="auto">
                <path d="M0,0 L0,${markerHeight} L${markerWidth},${markerHeight/2} L0,0" />
              </marker>` :
              ''
            }

            <line
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

  updateEndpoints = (usingTimeout = false) => {
    if (usingTimeout && !this.currentlyTracking) { return; }
    const pointA = this.pointA;
    const pointB = this.pointB;
    if (!pointA || !pointB) { return; }

    // to properly place the endpoints, we need the positions of their bounding boxes
    // get the bounding rectangles for A reference element, B reference element, and parent element
    // TODO: Use offsetParent to account for direct parent beieng statically positioned
    const svgParentElement = this.parentElement!;
    
    // the class is appended without classList.add() so that multiple applications
    // of the class do not interfere with each other upon removal
    // CHANGE NOTE: elements are unhidden using override to allow access to bounding box
    pointA[0].classList.value += ` wbfk-override-hidden`;
    pointB[0].classList.value += ` wbfk-override-hidden`;
    const {left: aLeft, right: aRight, top: aTop, bottom: aBottom} = pointA[0].getBoundingClientRect();
    const {left: bLeft, right: bRight, top: bTop, bottom: bBottom} = pointB[0].getBoundingClientRect();
    const {left: parentLeft, top: parentTop} = svgParentElement.getBoundingClientRect();
    pointA[0].classList.value = pointA[0].classList.value.replace(` wbfk-override-hidden`, '');
    pointB[0].classList.value = pointB[0].classList.value.replace(` wbfk-override-hidden`, '');

    // The x and y coordinates of the line need to be with respect to the top left of document
    // Thus, we must subtract the parent element's current top and left from the offset
    // But because elements start in their parent's Content box (which excludes the border) instead of the Fill area,...
    // ...(which includes the border), our element's top and left are offset by the parent element's border width with...
    // ...respect to the actual bounding box of the parent. Therefore, we must subtract the parent's border thicknesses as well.
    const connectorLeftOffset = -parentLeft - Number.parseFloat(getComputedStyle(svgParentElement).borderLeftWidth);
    const connectorTopOffset = -parentTop - Number.parseFloat(getComputedStyle(svgParentElement).borderTopWidth);

    // change x and y coords of our <svg>'s nested <line> based on the bounding boxes of the A and B reference elements
    // the offset with respect to the reference elements' tops and lefts is calculated using linear interpolation
    const ax = (1 - pointA[1]) * aLeft + (pointA[1]) * aRight + connectorLeftOffset;
    const ay = (1 - pointA[2]) * aTop + (pointA[2]) * aBottom + connectorTopOffset;
    const bx = (1 - pointB[1]) * bLeft + (pointB[1]) * bRight + connectorLeftOffset;
    const by = (1 - pointB[2]) * bTop + (pointB[2]) * bBottom + connectorTopOffset;
    this.ax = ax;
    this.ay = ay;
    this.bx = bx;
    this.by = by;
    // TODO: Document
    this.mask.width.baseVal.valueAsString = `${Math.abs(bx - ax) + 50}`;
    this.mask.x.baseVal.valueAsString = `${Math.min(ax, bx) - 25}`;
    this.mask.height.baseVal.valueAsString = `${Math.abs(by - ay) + 50}`;
    this.mask.y.baseVal.valueAsString = `${Math.min(ay, by) - 25}`;
  }

  setTrackingInterval = () => {
    this.timeoutForTracking = setInterval(this.updateEndpoints, 4, true);
    this.currentlyTracking = true;
  }

  clearTrackingInterval = () => {
    this.currentlyTracking = false;
    clearInterval(this.timeoutForTracking);
  }
}

customElements.define('wbfk-connector', Connector);

export class SetConnectorBlock extends AnimBlock {
  connectorElem: Connector;
  previousPointA?: [elemA: Element, leftOffset: number, topOffset: number];
  previousPointB?: [elemB: Element, leftOffset: number, topOffset: number];
  pointA: [elemA: Element, leftOffset: number, topOffset: number];
  pointB: [elemB: Element, leftOffset: number, topOffset: number];

  connectorConfig: ConnectorConfig = {} as ConnectorConfig;
  previousConnectorConfig: ConnectorConfig = {} as ConnectorConfig;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      duration: 0,
      commitsStyles: false,
      pregeneratesKeyframes: true,
    };
  }
  
  constructor(
    connectorElem: Connector | null,
    pointA: [elemA: Element | null, leftOffset: number, topOffset: number],
    pointB: [elemB: Element | null, leftOffset: number, topOffset: number],
    connectorConfig: Partial<ConnectorConfig> = {},
    /*animName: string, behaviorGroup: TBehavior*/
    ) {
    // if (!behaviorGroup) { throw new Error(`Invalid set line animation name ${animName}`); }

    if (!connectorElem) { throw new Error('Connector element must not be null'); }
    if (!(connectorElem instanceof Connector)) { throw new Error('Must pass Connector element'); }
    if (!(pointA?.[0] instanceof Element)) {
      throw new Error(`Point A element must not be null`); // TODO: Improve error message
    }
    if (!(pointB?.[0] instanceof Element)) {
      throw new Error(`Point B element must not be null`); // TODO: Improve error message
    }

    // TODO: Validate offsets?

    super(connectorElem, `~set-line-points`, {
      generateKeyframes() {
        return [[], []];
      },
    });

    this.connectorElem = connectorElem;
    this.pointA = pointA as [elemA: Element, leftOffset: number, topOffset: number];
    this.pointB = pointB as [elemB: Element, leftOffset: number, topOffset: number];

    this.connectorConfig = this.applyLineConfig(connectorConfig);
  }

  protected _onStartForward(): void {
    this.previousPointA = this.connectorElem.pointA;
    this.previousPointB = this.connectorElem.pointB;
    this.previousConnectorConfig.trackEndpoints = this.connectorElem.trackingEnabled;
    this.connectorElem.pointA = this.pointA;
    this.connectorElem.pointB = this.pointB;
    this.connectorElem.trackingEnabled = this.connectorConfig.trackEndpoints;
  }

  protected _onStartBackward(): void {
    this.connectorElem.pointA = this.previousPointA;
    this.connectorElem.pointB = this.previousPointB;
    this.connectorElem.trackingEnabled = this.previousConnectorConfig.trackEndpoints;
  }

  applyLineConfig(connectorConfig: Partial<ConnectorConfig>): ConnectorConfig {
    return {
      trackEndpoints: this.connectorElem.trackingEnabled,
      ...connectorConfig,
    };
  }
}

export class DrawConnectorBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  connectorElem: Connector;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      classesToRemoveOnStart: ['wbfk-hidden'],
      commitsStyles: false,
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
    if (this.connectorElem.trackingEnabled) {
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
      commitsStyles: false,
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
    if (this.connectorElem.trackingEnabled) {
      this.connectorElem.setTrackingInterval();
    }
  }
}
