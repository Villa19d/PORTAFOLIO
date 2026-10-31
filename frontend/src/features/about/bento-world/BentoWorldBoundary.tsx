import { Component, type ReactNode } from 'react';

interface BentoWorldBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface BentoWorldBoundaryState {
  hasError: boolean;
}

/** Swallows any failure of the mini world (chunk load, render) so the card comes back. */
export class BentoWorldBoundary extends Component<BentoWorldBoundaryProps, BentoWorldBoundaryState> {
  override state: BentoWorldBoundaryState = { hasError: false };

  static getDerivedStateFromError(): BentoWorldBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  override render(): ReactNode {
    return this.state.hasError ? null : this.props.children;
  }
}
