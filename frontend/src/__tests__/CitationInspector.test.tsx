import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CitationInspector } from '../components/CitationInspector';
import { CitationSource } from '../types';

describe('CitationInspector', () => {
  const mockSources: CitationSource[] = [
    {
      index: 1,
      url: 'https://nature.com/articles/quantum-2026',
      title: 'Quantum Supremacy in Superconducting Circuits',
      snippet: 'Coherence times achieved 10x improvement across 256 qubits.',
      score: 0.95,
    },
    {
      index: 2,
      url: 'https://arxiv.org/abs/2601.12345',
      title: 'Scalable Error Mitigation via Topological Codes',
      snippet: 'Surface code thresholds surpassed fault tolerance benchmarks.',
      score: 0.89,
    },
  ];

  it('renders citation list when open', () => {
    render(
      <CitationInspector
        sources={mockSources}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Bibliographic Index|Citation Inspector/)).toBeInTheDocument();
    expect(screen.getByText('Quantum Supremacy in Superconducting Circuits')).toBeInTheDocument();
    expect(screen.getByText('Scalable Error Mitigation via Topological Codes')).toBeInTheDocument();
  });

  it('filters citations by search query', () => {
    render(
      <CitationInspector
        sources={mockSources}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/filter source|search source/i);
    fireEvent.change(searchInput, { target: { value: 'Topological' } });

    expect(screen.getByText('Scalable Error Mitigation via Topological Codes')).toBeInTheDocument();
    expect(screen.queryByText('Quantum Supremacy in Superconducting Circuits')).not.toBeInTheDocument();
  });
});
