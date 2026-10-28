import { Component, type ReactNode } from 'react';

interface HeroSceneBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface HeroSceneBoundaryState {
  hasError: boolean;
}

/** Swallows any failure of the deferred 3D scene (chunk load, render) and shows nothing. */
export class HeroSceneBoundary extends Component<HeroSceneBoundaryProps, HeroSceneBoundaryState> {
  state: HeroSceneBoundaryState = { hasError: false };

  static getDerivedStateFromError(): HeroSceneBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  render(): ReactNode {
    return this.state.hasError ? null : this.props.children;
  }
}