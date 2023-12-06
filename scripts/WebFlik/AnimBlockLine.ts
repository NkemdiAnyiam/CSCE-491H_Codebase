import { AnimBlock, AnimBlockConfig } from "./AnimBlock.js";
import { IKeyframesBank, KeyframesBankEntry } from "./WebFlik.js";
import { equalWithinTol } from "./utils/helpers.js";

export type ConnectorConfig = {
  pointTrackingEnabled: boolean;
};

class ConnectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectorUpdateError';
  }
}

// CHANGE NOTE: Completely get rid of obsolete AnimBlockLineUpdater
export class Connector extends HTMLElement {
  static staticId: number = 0;

  private connectorId: number = 0;
  readonly markerIdPrefix: string;
  usesMarkerB: boolean = false;
  usesMarkerA: boolean = false;
  private lineLayer: SVGLineElement;
  private lineMask: SVGLineElement;
  private gBody: SVGGElement;
  private mask: SVGMaskElement;

  // TODO: potentially use form <number><CssLengthUnit> for leftOffset and topOffset
  pointA?: [elemA: Element, leftOffset: number, topOffset: number];
  pointB?: [elemB: Element, leftOffset: number, topOffset: number];
  pointTrackingEnabled: boolean = true;
  private continuousTrackingReqId: number = NaN;

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
  
  constructor() {
    super();
    this.connectorId = Connector.staticId++;
    const shadow = this.attachShadow({mode: 'open'});

    const markerIdPrefix = `markerArrow--${this.connectorId}`;
    this.markerIdPrefix = markerIdPrefix;
    const maskId = `mask--${this.connectorId}`;
    this.usesMarkerA = this.hasAttribute('a-marker');
    this.usesMarkerB = this.hasAttribute('b-marker');
    this.pointTrackingEnabled = !this.hasAttribute('tracking-disabled');
    const markerWidth = 5;
    const markerHeight = 7;

    // TODO: Improve marker sizing configuration
    const htmlString = `
      <style>
        :host {
          --a-marker-opacity: 1;
          --b-marker-opacity: 1;
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
          marker-start: url(#${markerIdPrefix}-a--layer);
          marker-end: url(#${markerIdPrefix}-b--layer);
        }
        
        marker {
          stroke: none;
        }

        #${markerIdPrefix}-a--layer {
          opacity: var(--a-marker-opacity);
        }
        #${markerIdPrefix}-b--layer {
          opacity: var(--b-marker-opacity);
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

  updateEndpoints = (): void => {
    const pointA = this.pointA;
    const pointB = this.pointB;
    if (!pointA || !pointB) { return; }

    // to properly place the endpoints, we need the positions of their bounding boxes
    
    // CHANGE NOTE: Use offsetParent instead of direct parent to properly get nearest positioned ancestor
    const offsetParent = this.offsetParent;
    if (!offsetParent) {
      this.clearTrackingInterval();
      // TODO: Add specifics about where exactly failure occured
      const errorArr = [
        `Cannot call updateEndpoints() while the connector or its parent is invisible.`,
        this.pointTrackingEnabled ? `\nThis connector was also tracking its endpoints, so we disabled it.` : '',
        this.pointTrackingEnabled ? `If this connector needs to continuously update its endpoints, make sure to Exit it if its parent is going to be hidden; this safely pauses the tracking.` : '',
        this.pointTrackingEnabled ? `If this connector does not need to continuously update its endpoints, try setting its 'trackEndpoints' config setting to false.` : '',
      ]
      throw new ConnectorError(errorArr.join(' '));
    }

    // The x and y coordinates of the line need to be with respect to the top left of document
    // Thus, we must subtract the offsetParent element's current top and left from the total offset
    // But because elements start in their parent's Content box (which excludes the border) instead of the Fill area,...
    // (which includes the border), our element's top and left are offset by the offsetParent element's border width with...
    // ...respect to the actual bounding box of the offsetParent. Therefore, we must subtract the offsetParent's border thicknesses as well.
    const {left: offsetParentLeft, top: offsetParentTop} = offsetParent.getBoundingClientRect();
    const connectorLeftOffset = -offsetParentLeft - Number.parseFloat(getComputedStyle(offsetParent).borderLeftWidth);
    const connectorTopOffset = -offsetParentTop - Number.parseFloat(getComputedStyle(offsetParent).borderTopWidth);

    // get the bounding rectangles for A reference element and B reference element
    // CHANGE NOTE: elements are unhidden using override to allow access to bounding box
    // the override class is appended without classList.add() so that multiple applications...
    // of the class do not interfere with each other upon removal
    const [aHidden, bHidden] = [pointA[0].classList.value.includes('wbfk-hidden'), pointB[0].classList.value.includes('wbfk-hidden')];
    if (aHidden) pointA[0].classList.value += ` wbfk-override-hidden`;
    if (bHidden) pointB[0].classList.value += ` wbfk-override-hidden`;
    const {left: aLeft, right: aRight, top: aTop, bottom: aBottom} = pointA[0].getBoundingClientRect();
    const {left: bLeft, right: bRight, top: bTop, bottom: bBottom} = pointB[0].getBoundingClientRect();
    if (aHidden) pointA[0].classList.value = pointA[0].classList.value.replace(` wbfk-override-hidden`, '');
    if (bHidden) pointB[0].classList.value = pointB[0].classList.value.replace(` wbfk-override-hidden`, '');

    // change x and y coords of our <svg>'s nested <line> based on the bounding boxes of the A and B reference elements
    // the offset with respect to the reference elements' tops and lefts is calculated using linear interpolation
    const ax = (1 - pointA[1]) * aLeft + (pointA[1]) * aRight + connectorLeftOffset;
    const ay = (1 - pointA[2]) * aTop + (pointA[2]) * aBottom + connectorTopOffset;
    const bx = (1 - pointB[1]) * bLeft + (pointB[1]) * bRight + connectorLeftOffset;
    const by = (1 - pointB[2]) * bTop + (pointB[2]) * bBottom + connectorTopOffset;
    let changedX = false;
    let changedY = false;
    if (!equalWithinTol(ax, this.ax)) {
      this.ax = ax;
      changedX = true;
    }
    if (!equalWithinTol(ay, this.ay)) {
      this.ay = ay;
      changedY = true;
    }
    if (!equalWithinTol(bx, this.bx)) {
      this.bx = bx;
      changedX = true;
    }
    if (!equalWithinTol(by, this.by)) {
      this.by = by;
      changedY = true;
    }
    // TODO: Document purpose of manipulating mask
    if (changedX) {
      this.mask.width.baseVal.valueAsString = `${Math.abs(bx - ax) + 50}`;
      this.mask.x.baseVal.valueAsString = `${Math.min(ax, bx) - 25}`;
    }
    if (changedY) {
      this.mask.height.baseVal.valueAsString = `${Math.abs(by - ay) + 50}`;
      this.mask.y.baseVal.valueAsString = `${Math.min(ay, by) - 25}`;
    }
  }

  // CHANGE NOTE: Use requestAnimationFrame() loop instead of setInterval() to laglessly update endpoints
  continuouslyUpdateEndpoints = () => {
    this.updateEndpoints();
    this.continuousTrackingReqId = window.requestAnimationFrame(this.continuouslyUpdateEndpoints);
  }

  setTrackingInterval(): void {
    this.continuousTrackingReqId = window.requestAnimationFrame(this.continuouslyUpdateEndpoints);
  }

  clearTrackingInterval (): void {
    window.cancelAnimationFrame(this.continuousTrackingReqId);
  }
}

customElements.define('wbfk-connector', Connector);

if (window.CSS.registerProperty) {
  window.CSS.registerProperty({
    name: "--b-marker-opacity",
    syntax: "<number>",
    inherits: true,
    initialValue: '1',
  });

  window.CSS.registerProperty({
    name: "--a-marker-opacity",
    syntax: "<number>",
    inherits: true,
    initialValue: '1',
  });
}

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
      startsNextBlock: true,
    };
  }
  
  constructor(
    connectorElem: Connector | null,
    pointA: [elemA: Element | null, leftOffset: number, topOffset: number],
    pointB: [elemB: Element | null, leftOffset: number, topOffset: number],
    animName: string,
    bank: IKeyframesBank,
    category: string,
    connectorConfig: Partial<ConnectorConfig> = {},
    ) {
    super(connectorElem, animName, bank, category);

    // if (!connectorElem) { throw new Error('Connector element must not be null'); }
    if (!(connectorElem instanceof Connector)) { throw this.generateError(Error, 'Must pass Connector element'); }
    if (!(pointA?.[0] instanceof Element)) {
      throw this.generateError(Error, `Point A element must not be null`);
    }
    if (!(pointB?.[0] instanceof Element)) {
      throw this.generateError(Error, `Point B element must not be null`);
    }

    // TODO: Validate offsets?


    this.connectorElem = connectorElem;
    this.pointA = pointA as [elemA: Element, leftOffset: number, topOffset: number];
    this.pointB = pointB as [elemB: Element, leftOffset: number, topOffset: number];

    this.connectorConfig = this.applyLineConfig(connectorConfig);
  }

  protected _onStartForward(): void {
    this.previousPointA = this.connectorElem.pointA;
    this.previousPointB = this.connectorElem.pointB;
    this.previousConnectorConfig.pointTrackingEnabled = this.connectorElem.pointTrackingEnabled;
    this.connectorElem.pointA = this.pointA;
    this.connectorElem.pointB = this.pointB;
    this.connectorElem.pointTrackingEnabled = this.connectorConfig.pointTrackingEnabled;
  }

  protected _onStartBackward(): void {
    this.connectorElem.pointA = this.previousPointA;
    this.connectorElem.pointB = this.previousPointB;
    this.connectorElem.pointTrackingEnabled = this.previousConnectorConfig.pointTrackingEnabled;
  }

  applyLineConfig(connectorConfig: Partial<ConnectorConfig>): ConnectorConfig {
    return {
      pointTrackingEnabled: this.connectorElem.pointTrackingEnabled,
      ...connectorConfig,
    };
  }
}

export class DrawConnectorBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  connectorElem: Connector;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      // pregenerateKeyframes: true,
    };
  }

  constructor(connectorElem: Connector | null, public animName: string, bank: IKeyframesBank, category: string) {
    super(connectorElem, animName, bank, category);

    // if (!connectorElem) { throw new Error('Connector element must not be null'); }
    if (!(connectorElem instanceof Connector)) { throw this.generateError(Error, 'Must pass Connector element'); }
    this.connectorElem = connectorElem;
  }

  protected _onStartForward(): void {
    this.domElem.classList.remove('wbfk-hidden');
    this.connectorElem.updateEndpoints();
    if (this.connectorElem.pointTrackingEnabled) {
      this.connectorElem.setTrackingInterval();
    }
  }

  protected _onFinishBackward(): void {
    this.connectorElem.clearTrackingInterval();
    this.domElem.classList.add('wbfk-hidden');
  }
}

export class EraseConnectorBlock<TBankEntry extends KeyframesBankEntry = KeyframesBankEntry> extends AnimBlock<TBankEntry> {
  connectorElem: Connector;

  protected get defaultConfig(): Partial<AnimBlockConfig> {
    return {
      commitsStyles: false,
      // pregenerateKeyframes: true,
    };
  }

  constructor(connectorElem: Connector | null, public animName: string, bank: IKeyframesBank, category: string) {
    super(connectorElem, animName, bank, category);

    // if (!connectorElem) { throw new Error('Connector element must not be null'); }
    if (!(connectorElem instanceof Connector)) { throw this.generateError(Error, 'Must pass Connector element'); }

    this.connectorElem = connectorElem;
  }

  // protected _onStartForward(): void {
  // }

  protected _onStartBackward(): void {
    this.domElem.classList.remove('wbfk-hidden');
    this.connectorElem.updateEndpoints();
    if (this.connectorElem.pointTrackingEnabled) {
      this.connectorElem.setTrackingInterval();
    }
  }

  // protected _onFinishBackward(): void {
  // }

  protected _onFinishForward(): void {
    this.connectorElem.clearTrackingInterval();
    this.domElem.classList.add('wbfk-hidden');
  }
}
