import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './lib/api';
import ProjectForm from './ProjectForm';

const validProject = {
  slug: 'mi-proyecto',
  title: { es: 'Mi proyecto', en: 'My project' },
  summary: { es: 'Resumen', en: 'Summary' },
  description: { es: 'Descripción segura', en: 'Safe description' },
  techStack: ['React'],
  imageUrl: 'https://example.com/image.webp',
  videoUrl: null,
  repoUrl: 'https://github.com/example/project',
  liveUrl: null,
  featured: false,
  published: false,
  displayOrder: 0,
};

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  return render(<ProjectForm initialValue={validProject} onSubmit={onSubmit} />);
}

describe('ProjectForm', () => {
  it('exposes exact character limits and HTTPS URL validation', () => {
    renderForm();
    const textareas = screen.getAllByRole('textbox').filter((element) => element.tagName === 'TEXTAREA');

    expect(textareas[0]).toHaveAttribute('maxLength', '120');
    expect(textareas[1]).toHaveAttribute('maxLength', '300');
    expect(textareas[2]).toHaveAttribute('maxLength', '20000');

    fireEvent.change(screen.getByLabelText('URL del repositorio 1'), { target: { value: 'http://unsafe.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }));
    expect(screen.getByRole('alert')).toHaveTextContent('https://');
  });

  it('limits techStack to 20 chips', async () => {
    renderForm();
    const techInput = screen.getByLabelText('Tecnologías');
    const addButton = screen.getByRole('button', { name: 'Agregar' });

    for (let index = 0; index < 20; index += 1) {
      fireEvent.change(techInput, { target: { value: `Tech ${index}` } });
      fireEvent.click(addButton);
    }
    const chips = await screen.findAllByRole('button', { name: /×$/ });
    expect(chips).toHaveLength(20);
  });

  it('rejects an empty techStack collection', () => {
    render(
      <ProjectForm
        initialValue={{ ...validProject, techStack: [] }}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }));
    expect(screen.getByRole('alert')).toHaveTextContent('al menos una tecnología');
  });

  it('shows a duplicate slug error for a 409 response', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError({}, 409));
    renderForm(onSubmit);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }));

    expect(await screen.findByText('Este slug ya existe.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mi-proyecto')).toHaveValue('mi-proyecto');
  });

  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '[click](javascript:alert(1))',
  ])('does not render unsafe Markdown payload %s', (payload) => {
    renderForm();
    const description = screen.getAllByRole('textbox').find((element) => element.tagName === 'TEXTAREA' && element.getAttribute('maxLength') === '20000');
    fireEvent.change(description!, { target: { value: payload } });

    const preview = screen.getByRole('region', { name: 'Vista previa de Markdown' });
    expect(preview.querySelector('script')).not.toBeInTheDocument();
    expect(preview.querySelector('img[onerror]')).not.toBeInTheDocument();
    expect(preview.querySelector('a[href^="javascript:"]')).not.toBeInTheDocument();
    expect(vi.fn()).not.toHaveBeenCalled();
  });
    it('submits media and repos in order and derives repoUrl from the first repo', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProjectForm
        initialValue={{
          ...validProject,
          media: [{ type: 'YOUTUBE', url: 'https://www.youtube.com/watch?v=abc123_DEF' }],
          repos: [
            { label: 'Frontend', url: 'https://github.com/example/front' },
            { label: '  ', url: 'https://github.com/example/back' },
          ],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Bajar repositorio 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const sent = onSubmit.mock.calls[0]?.[0];
    expect(sent.repoUrl).toBe('https://github.com/example/back');
    expect(sent.repos).toEqual([
      { label: null, url: 'https://github.com/example/back' },
      { label: 'Frontend', url: 'https://github.com/example/front' },
    ]);
    expect(sent.media).toHaveLength(1);
  });

  it('rejects a form without repositories and duplicated repositories', () => {
    const { rerender } = render(
      <ProjectForm initialValue={{ ...validProject, repoUrl: '' }} onSubmit={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }));
    expect(screen.getByRole('alert')).toHaveTextContent('al menos un repositorio');

    rerender(
      <ProjectForm
        initialValue={{
          ...validProject,
          repos: [
            { url: 'https://github.com/example/a' },
            { url: 'https://github.com/example/a' },
          ],
        }}
        onSubmit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }));
    expect(screen.getByRole('alert')).toHaveTextContent('repetidos');
  });
});
