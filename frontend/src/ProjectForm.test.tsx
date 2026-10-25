import { fireEvent, render, screen } from '@testing-library/react';
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

    fireEvent.change(screen.getByLabelText('repoUrl'), { target: { value: 'http://unsafe.test' } });
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
});
