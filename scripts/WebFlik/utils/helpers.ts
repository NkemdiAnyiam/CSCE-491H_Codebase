import { ScrollingOptions } from "./interfaces";

export const equalWithinTol = (numA: number, numB: number): boolean => Math.abs(numA - numB) < 0.001;
export const mergeArrays = <T>(...arrays: Array<T>[]): Array<T> => Array.from(new Set(new Array<T>().concat(...arrays)));
export const negateNumString = (str: string): string => str[0] === '-' ? str.slice(1) : `-${str}`;
export const createStyles = (rules: string = ''): void => {
  let sheet = document.createElement('style');
  sheet.id = `wbfk-global-styles`;
  sheet.innerHTML = rules;
  document.body.appendChild(sheet);
}

export function computeSelfScrollingBounds(scrollable: Element, target: Element, scrollOptions: ScrollingOptions): {fromXY: [number, number], toXY: [number, number]} {
  // determines the intersection point of the target
  const offsetPercX: number = scrollOptions.targetOffsetX ?? scrollOptions.targetOffset?.[0] ?? 0;
  const offsetPercY: number = scrollOptions.targetOffsetY ?? scrollOptions.targetOffset?.[1] ?? 0;
  // determines the intersection point of the scrolling container
  const placementOffsetPercX: number = scrollOptions.scrollableOffsetX ?? scrollOptions.scrollableOffset?.[0] ?? 0;
  const placementOffsetPercY: number = scrollOptions.scrollableOffsetY ?? scrollOptions.scrollableOffset?.[1] ?? 0;

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
  const oldTargetIntersectionPointPos = [
    targetInnerLeft + (targetRect.width * offsetPercX),
    targetInnerTop + (targetRect.height * offsetPercY)
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
    newTargetIntersectionPointPos[0] > oldTargetIntersectionPointPos[1] ? 'left' : 'right',
    newTargetIntersectionPointPos[1] > oldTargetIntersectionPointPos[0] ? 'up' : 'down',
  ];

  const toXY: [number, number] = [0, 0];

  switch(scrollDirectionX) {
    case "left":
      // Capped at 0 because that's the minimum scrollLeft value
      toXY[0] = Math.max(newTargetIntersectionPointPos[0], 0);
    case "right":
      // Capped at the highest scrollWidth value, which equals the scroll width minus the
      // minimum between the width of the scrolling container and the viewport width)
      toXY[0] = Math.min(newTargetIntersectionPointPos[0], scrollable.scrollWidth - maxSelfViewWidth);
  }
  switch(scrollDirectionY) {
    case "up":
      // Capped at 0 because that's the minimum scrollTop value
      toXY[1] = Math.max(newTargetIntersectionPointPos[1], 0);
    case "down":
      // Capped at the highest scrollTop value, which equals the scroll height minus the
      // minimum between the height of the scrolling container and the viewport height)
      toXY[1] = Math.min(newTargetIntersectionPointPos[1], scrollable.scrollHeight - maxSelfViewHeight);
  }

  return {fromXY, toXY};
}
