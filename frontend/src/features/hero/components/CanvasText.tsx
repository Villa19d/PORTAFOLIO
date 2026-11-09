import { useEffect, useMemo, useRef, useState } from 'react';
import TechText from '../vendor/TechText';

export type CanvasTextColor = 'gradient' | 'solid';

export interface CanvasTextProps {
  text: string;
  /** Base font size in px; the HTML size is passed so the canvas matches it. */
  fontSize: number;
  fontWeight?: number;
  color?: CanvasTextColor;
  letterSpacing?: number;
  align?: 'left' | 'center' | 'right';
  intro?: 'none' | 'type';
  onReady?: () => void;
}

interface Palette {
  ink: string;
  accent: string;
  accent2: string;
  fontFamily: string;
}

let gradientSeq = 0;

function readPalette(): Palette {
  if (typeof window === 'undefined') {
    return { ink: '#e6edf3', accent: '#00e5ff', accent2: '#39ff88', fontFamily: 'sans-serif' };
  }
  const styles = getComputedStyle(document.documentElement);
  const ink = styles.getPropertyValue('--text-main').trim() || styles.color || '#e6edf3';
  const accent = styles.getPropertyValue('--accent-primary').trim() || ink;
  const accent2 = styles.getPropertyValue('--accent-secondary').trim() || accent;
  const fontFamily = styles.getPropertyValue('--font-display').trim() || 'sans-serif';
  return { ink, accent, accent2, fontFamily };
}

/**
 * TechText bakes each glyph from `color`, and a canvas gradient can be used as a
 * fillStyle. We hand it a gradient whose coordinates live in the container's user
 * space (the per-glyph sprites reuse the same transform), and give it a unique
 * `toString` so the component re-lays out whenever the gradient itself changes.
 */
function buildGradient(width: number, from: string, to: string): CanvasGradient | null {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return null;
  const gradient = ctx.createLinearGradient(width * 0.05, 0, width * 0.95, 0);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  gradientSeq += 1;
  const id = gradientSeq;
  Object.defineProperty(gradient, 'toString', { value: () => `hero-canvas-gradient-${id}` });
  return gradient;
}

/**
 * The TechText engine, isolated in a lazy chunk. Theme tokens are resolved to
 * concrete values (a canvas cannot read CSS variables) and re-read when <html>
 * flips `data-theme`. Used by both the hero name and the hero role.
 */
export function CanvasText({
  text,
  fontSize,
  fontWeight = 800,
  color = 'solid',
  letterSpacing = -0.025,
  align = 'left',
  intro = 'none',
  onReady,
}: CanvasTextProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [palette, setPalette] = useState<Palette>(readPalette);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => setPalette(readPalette()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    });
    return () => observer.disconnect();
  }, []);

  const ink = useMemo(() => {
    if (color !== 'gradient') return palette.ink;
    if (width <= 0) return palette.accent;
    return buildGradient(width, palette.accent, palette.accent2) ?? palette.accent;
  }, [color, palette, width]);

  return (
    <div ref={wrapRef} className="h-full w-full">
      <TechText
        text={text}
        fontFamily={palette.fontFamily}
        fontWeight={fontWeight}
        fontSize={Math.max(1, Math.round(fontSize))}
        letterSpacing={letterSpacing}
        color={ink as unknown as string}
        accentColor={palette.accent}
        align={align}
        reveal="letter"
        lineStyle="dashed"
        dashLength={4}
        dashGap={2}
        strokeWidth={1.5}
        reach={200}
        softness={0.7}
        // specks={15}
        specks={0}
        selection
        // labels
        labels={false}
        draggable
        clickKick
        sweep={false}
        intro={intro}
        onReady={onReady}
      />
    </div>
  );
}

export default CanvasText;
