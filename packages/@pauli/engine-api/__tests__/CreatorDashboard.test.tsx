import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreatorDashboard } from '../src/CreatorDashboard';

describe('CreatorDashboard', () => {
  it('renders dashboard title', () => {
    render(<CreatorDashboard creatorId="test-creator" />);
    expect(screen.getByText(/Creator Dashboard/i)).toBeInTheDocument();
  });

  it('renders project creation input', () => {
    render(<CreatorDashboard creatorId="test-creator" />);
    expect(screen.getByPlaceholderText(/Project name/i)).toBeInTheDocument();
  });

  it('disables create button when input is empty', () => {
    render(<CreatorDashboard creatorId="test-creator" />);
    const button = screen.getByRole('button', { name: /Create Project/i });
    expect(button).toBeDisabled();
  });

  it('enables create button when input has text', () => {
    render(<CreatorDashboard creatorId="test-creator" />);
    const input = screen.getByPlaceholderText(/Project name/i);
    fireEvent.change(input, { target: { value: 'My Project' } });

    const button = screen.getByRole('button', { name: /Create Project/i });
    expect(button).not.toBeDisabled();
  });

  it('calls onProjectCreate callback on successful creation', async () => {
    const mockOnProjectCreate = jest.fn();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ projectId: '123' }),
      } as Response)
    );

    render(<CreatorDashboard creatorId="test-creator" onProjectCreate={mockOnProjectCreate} />);

    const input = screen.getByPlaceholderText(/Project name/i);
    fireEvent.change(input, { target: { value: 'My Project' } });

    const button = screen.getByRole('button', { name: /Create Project/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnProjectCreate).toHaveBeenCalled();
    });
  });
});
