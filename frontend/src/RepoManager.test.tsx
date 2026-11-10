import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RepoManager from './RepoManager';

describe('RepoManager', () => {
  it('adds, edits, reorders and removes repositories', () => {
    const onChange = vi.fn();
    const value = [
      { label: 'Frontend', url: 'https://github.com/a/front' },
      { label: 'Backend', url: 'https://github.com/a/back' },
    ];
    render(<RepoManager onChange={onChange} value={value} />);

    fireEvent.click(screen.getByRole('button', { name: 'Agregar repositorio' }));
    expect(onChange).toHaveBeenLastCalledWith([...value, { label: '', url: '' }]);

    fireEvent.change(screen.getByLabelText('Etiqueta del repositorio 2'), { target: { value: 'API' } });
    expect(onChange).toHaveBeenLastCalledWith([value[0], { ...value[1], label: 'API' }]);

    fireEvent.click(screen.getByRole('button', { name: 'Subir repositorio 2' }));
    expect(onChange).toHaveBeenLastCalledWith([value[1], value[0]]);

    fireEvent.click(screen.getByRole('button', { name: 'Quitar repositorio 1' }));
    expect(onChange).toHaveBeenLastCalledWith([value[1]]);
  });

  it('disables adding at the limit of 5', () => {
    const five = Array.from({ length: 5 }, (_, n) => ({ label: null, url: `https://github.com/a/${n}` }));
    render(<RepoManager onChange={vi.fn()} value={five} />);

    expect(screen.getByRole('button', { name: 'Agregar repositorio' })).toBeDisabled();
  });
});