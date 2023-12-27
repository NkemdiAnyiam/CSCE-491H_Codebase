interface Nothing {};
export type Union<T, U> = T | (U & Nothing);

type TranslationOffset = {
  offsetSelfX: CssLength; // determines offset to apply to the respective positional property
  offsetSelfY: CssLength; // determines offset to apply to the respective positional property
}

// CHANGE NOTE: Use strings in the format of <number><CssLengthUnit> and remove XY things
export interface TranslateOptions extends TranslationOffset {
  translateX: CssLength;
  translateY: CssLength;
}

export interface MoveToOptions extends TranslationOffset {
  // targetElem: Element; // if specified, translations will be with respect to this target element
  alignmentY: CssYAlignment; // determines vertical alignment with target element
  alignmentX: CssXAlignment; // determines horizontal alignment with target element
  offsetTargetX: CssLength; // offset based on target's width (0.5 pushes us 50% of the target element's width rightward)
  offsetTargetY: CssLength; // offset based on target's height (0.5 pushes us 50% of the target element's height downward)
  preserveX: boolean; // if true, no horizontal translation with respect to the target element (offsets still apply)
  preserveY: boolean; // if true, no vertical translation with respect to the target element (offsets still apply)
}

export type ScrollingOptions = {
  scrollableOffset?: [x: number, y: number];
  scrollableOffsetX?: number;
  scrollableOffsetY?: number;
  targetOffset?: [x: number, y: number];
  targetOffsetX?: number;
  targetOffsetY?: number;
  preserveX?: boolean;
  preserveY?: boolean;
};

export type CssLengthUnit = | 'px' | 'rem' | '%';
export type CssLength = `${number}${CssLengthUnit}`;
export type CssYAlignment = | 'top' | 'bottom' | 'center';
export type CssXAlignment = | 'left' | 'right' | 'center';
