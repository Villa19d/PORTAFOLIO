export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  public problem: ProblemDetail;
  public status: number;

  constructor(problem: ProblemDetail, status: number) {
    super(problem.detail || problem.title || 'API Error');
    this.name = 'ApiError';
    this.problem = problem;
    this.status = status;
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 60000);

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: options.signal || controller.signal,
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      let problem: ProblemDetail;
      try {
        problem = await response.json();
      } catch {
        problem = {
          title: response.statusText,
          status: response.status,
          detail: 'Failed to parse error response',
        };
      }
      throw new ApiError(problem, response.status);
    }

    // For 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        {
          title: 'Request Timeout',
          status: 408,
          detail: 'The request took too long to complete.',
        },
        408
      );
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}
