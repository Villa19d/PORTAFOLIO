import { lazy, Suspense } from 'react';
import { useCapabilities } from '../../hooks/useCapabilities';

const CustomCursor = lazy(() =>
  import('./CustomCursor').then(({ CustomCursor }) => ({ default: CustomCursor }))
);

export function CursorLoader() {
  const { canUseHeavyEffects } = useCapabilities();

  if (!canUseHeavyEffects) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <CustomCursor />
    </Suspense>
  );
}
