import { CssLength, CssXAlignment, CssYAlignment, ScrollingOptions, parsedConnectorOffset, EndpointXPlacement, EndpointYPlacement } from "./interfaces";

export const equalWithinTol = (numA: number, numB: number): boolean => Math.abs(numA - numB) < 0.001;
export const mergeArrays = <T>(...arrays: Array<T>[]): Array<T> => Array.from(new Set(new Array<T>().concat(...arrays)));
export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
  let l = array.length;
  while (l--) {
    if (predicate(array[l], l, array)) { return l; }
  }
  return -1;
}
export const negateNumString = (str: string): string => str[0] === '-' ? str.slice(1) : `-${str}`;
export const createStyles = (rules: string = ''): void => {
  const sheet = document.createElement('style');
  sheet.id = `wbfk-global-styles`;
  sheet.innerHTML = rules;
  document.body.appendChild(sheet);
};

export const getOpeningTag = (element: Element | null | undefined): string => {
  if (!element) { return String(element); }
  const htmlText = element.outerHTML;
  const start  = htmlText.search(/</);
  const end  = htmlText.search(/>/);
  return htmlText.substring(start, end + 1);
};

export const overrideHidden = (...elements: Element[]): void => { for (const element of elements) {element.classList.value += ` wbfk-override-hidden`} };
export const unOverrideHidden = (...elements: Element[]): void => { for (const element of elements) {element.classList.value = element.classList.value.replace(` wbfk-override-hidden`, '')} };

export const splitXYTupleString = (tupleStr: `${CssLength}, ${CssLength}` | undefined): [x: CssLength, y: CssLength] | undefined => {
  return tupleStr?.split(', ') as [x: CssLength, y: CssLength] | undefined;
};
export const splitXYAlignmentString = (tupleStr: `${CssXAlignment} ${CssYAlignment}` | undefined): [x: CssXAlignment, y: CssYAlignment] | undefined => {
  return tupleStr?.split(' ') as [x: CssXAlignment, y: CssYAlignment] | undefined;
};

export function parseConnectorOffset(offset: number | EndpointYPlacement, alignment: 'vertical'): parsedConnectorOffset;
export function parseConnectorOffset(offset: number | EndpointXPlacement, alignment: 'horizontal'): parsedConnectorOffset;
export function parseConnectorOffset(offset: number | EndpointXPlacement | EndpointYPlacement, alignment: 'vertical' | 'horizontal'): parsedConnectorOffset {
  if (typeof offset === 'number') { return [offset, 0]; }

  let match;
  
  switch(alignment) {
    case 'horizontal':
      match =
        offset.match(/^((?:-)?\d+(?:\.\d+)?\%|left|center|right)(?: (\+|-) ((?:-)?\d+(?:\.\d+)?px))?$/)
        || offset.match(/^((?:-)?\d+(?:\.\d+)?px|left|center|right)(?: (\+|-) ((?:-)?\d+(?:\.\d+)?\%))?$/);
      break;
    case 'vertical':
      match =
        offset.match(/^((?:-)?\d+(?:\.\d+)?\%|top|center|bottom)(?: (\+|-) ((?:-)?\d+(?:\.\d+)?px))?$/)
        || offset.match(/^((?:-)?\d+(?:\.\d+)?px|top|center|bottom)(?: (\+|-) ((?:-)?\d+(?:\.\d+)?\%))?$/);
      break;
    default:
      throw new RangeError(`Invalid alignment value ${alignment}. Must be 'horizontal' or 'vertical'.`);
  }

  
  if (!match) {
    throw new RangeError(`Invalid connector offset string ${offset} using alignment ${alignment}.`);
  }

  const [val1, operator = '+', val2] = match.slice(1, 4);
  const sign = operator === '+' ? 1 : -1;

  if (val1.includes('%')) {
    return [Number.parseFloat(val1) / 100, Number.parseFloat(val2 ?? '0px') * sign];
  }
  else if (val1.includes('px')) {
    return [Number.parseFloat(val2 ?? '0%') / 100, Number.parseFloat(val1) * sign];
  }
  else {
    let alignmentPerc;
    switch(val1 as CssXAlignment | CssYAlignment) {
      case "left":
      case "top":
        alignmentPerc = 0;
        break;
      case "right":
      case "bottom":
        alignmentPerc = 1;
        break;
      case "center":
        alignmentPerc = 0.5;
        break;
      default:
        throw new RangeError(`Something wrong occured for ${val1} to be ${val1}`);
    }

    if (val2?.includes('%')) {
      return [alignmentPerc + Number.parseFloat(val2 ?? '0%') / 100 * sign, 0];
    }
    else {
      return [alignmentPerc, Number.parseFloat(val2 ?? '0px') * sign];
    }
  }
}

export const computeSelfScrollingBounds = (scrollable: Element, target: Element, scrollOptions: ScrollingOptions): {fromXY: [number, number], toXY: [number, number]} => {
  // determines the intersection point of the target
  const [offsetPercX, offsetPixelsX] = parseConnectorOffset(scrollOptions.targetOffsetX ?? scrollOptions.targetOffset?.[0] ?? '0px', 'horizontal');
  const [offsetPercY, offsetPixelsY] = parseConnectorOffset(scrollOptions.targetOffsetY ?? scrollOptions.targetOffset?.[1] ?? '0px', 'vertical');
  // determines the intersection point of the scrolling container
  const [placementOffsetPercX, placementOffsetPixelsX] = parseConnectorOffset(scrollOptions.scrollableOffsetX ?? scrollOptions.scrollableOffset?.[0] ?? '0px', 'horizontal');
  const [placementOffsetPercY, placementOffsetPixelsY] = parseConnectorOffset(scrollOptions.scrollableOffsetY ?? scrollOptions.scrollableOffset?.[1] ?? '0px', 'vertical');

  const selfRect = scrollable.getBoundingClientRect();
  const targetRect = target!.getBoundingClientRect();
  const targetInnerLeft = targetRect.left - selfRect.left + (scrollable === document.documentElement ? 0 : scrollable.scrollLeft);
  const targetInnerTop = targetRect.top - selfRect.top + (scrollable === document.documentElement ? 0 : scrollable.scrollTop);
  // The maximum view height should be the height of the scrolling container,
  // but it can only be as large as the viewport height since all scrolling should be
  // with respect to what the user can see.
  // The same logic applies for max width
  const maxSelfViewWidth = Math.min(selfRect.width, window.innerWidth);
  const maxSelfViewHeight = Math.min(selfRect.height, window.innerHeight);

  // initial position of the intersection point of the target relative to the top of the scrolling container
  // note that offsetPixels and placementOffsetPixels effectively mean the same thing
  const oldTargetIntersectionPointPos = [
    targetInnerLeft + (targetRect.width * offsetPercX) + offsetPixelsX + placementOffsetPixelsX,
    targetInnerTop + (targetRect.height * offsetPercY) + offsetPixelsY + placementOffsetPixelsY
  ];
  // new position of the intersection point of the target relative to the top of the scrolling container
  const newTargetIntersectionPointPos = [
    oldTargetIntersectionPointPos[0] - (maxSelfViewWidth * placementOffsetPercX),
    oldTargetIntersectionPointPos[1] - (maxSelfViewHeight * placementOffsetPercY),
  ];
  // set to just start scrolling from current scroll position
  const fromXY: [number, number] = [scrollable.scrollLeft, scrollable.scrollTop];
  // If new target intersection is larger (lower) than initial,
  // we'd need to scroll the screen up to move the target intersection down to it.
  // Same logic but opposite for needing to scroll down.
  // Same logic applies to horizontal scrolling with left and right instead of up and down.
  const [scrollDirectionX, scrollDirectionY] = [
    newTargetIntersectionPointPos[0] > oldTargetIntersectionPointPos[0] ? 'left' : 'right',
    newTargetIntersectionPointPos[1] > oldTargetIntersectionPointPos[1] ? 'up' : 'down',
  ];

  const toXY: [number, number] = [0, 0];

  switch(scrollDirectionX) {
    case "left":
      // Capped at 0 because that's the minimum scrollLeft value
      toXY[0] = Math.max(newTargetIntersectionPointPos[0], 0);
      break;
    case "right":
      // Capped at the highest scrollWidth value, which equals the scroll width minus the
      // minimum between the width of the scrolling container and the viewport width)
      toXY[0] = Math.min(newTargetIntersectionPointPos[0], scrollable.scrollWidth - maxSelfViewWidth);
      break;
  }
  switch(scrollDirectionY) {
    case "up":
      // Capped at 0 because that's the minimum scrollTop value
      toXY[1] = Math.max(newTargetIntersectionPointPos[1], 0);
      break;
    case "down":
      // Capped at the highest scrollTop value, which equals the scroll height minus the
      // minimum between the height of the scrolling container and the viewport height)
      toXY[1] = Math.min(newTargetIntersectionPointPos[1], scrollable.scrollHeight - maxSelfViewHeight);
      break;
  }

  return {fromXY, toXY};
};
