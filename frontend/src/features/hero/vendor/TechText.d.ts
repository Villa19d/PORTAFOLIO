import type { CSSProperties, ReactElement } from 'react';

/**
 * Types for the vendored React Bits `TechText` component (see vendor/TechText.jsx).
 * Prop names mirror the original component exactly; `onReady` is the only local
 * addition (fired once after the first frame is painted). This declaration lets the
 * strict TypeScript build consume the .jsx file without enabling `allowJs`.
 */
export interface TechTextProps {
  text?: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  letterSpacing?: number;
  color?: string | CanvasGradient;
  accentColor?: string;
  align?: 'left' | 'center' | 'right';
  reach?: number;
  softness?: number;
  dashLength?: number;
  dashGap?: number;
  strokeWidth?: number;
  lineStyle?: 'solid' | 'dashed';
  reveal?: 'letter' | 'area';
  specks?: number;
  selection?: boolean;
  labels?: boolean;
  draggable?: boolean;
  bounce?: number;
  sweep?: boolean;
  speed?: number;
  clickKick?: boolean;
  intro?: 'none' | 'type' | 'assemble' | 'metrics';
  introDuration?: number;
  guides?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Called once, after the first frame has been painted to the canvas. */
  onReady?: () => void;
}

declare function TechText(props: TechTextProps): ReactElement;

export default TechText;
