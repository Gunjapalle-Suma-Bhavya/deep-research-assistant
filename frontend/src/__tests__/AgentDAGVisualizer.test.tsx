import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentDAGVisualizer } from '../components/AgentDAGVisualizer';

describe('AgentDAGVisualizer', () => {
  it('renders all 5 core DAG pipeline nodes', () => {
    render(
      <AgentDAGVisualizer
        status="scoping"
        subtopics={[]}
        sourcesCount={0}
        currentStepDescription="Scoping research intent"
      />
    );

    expect(screen.getByText('Scoper Agent')).toBeInTheDocument();
    expect(screen.getByText('Topic Planner')).toBeInTheDocument();
    expect(screen.getByText('Parallel Workers')).toBeInTheDocument();
    expect(screen.getByText('Synthesizer')).toBeInTheDocument();
    expect(screen.getByText(/Final Monograph|Final Briefing/)).toBeInTheDocument();
  });

  it('renders subtopics when present in research state', () => {
    const mockSubtopics = [
      { name: 'Quantum Key Distribution', focus: 'Security protocols', status: 'completed' as const },
      { name: 'Trapped-Ion Processors', focus: 'Qubit coherence', status: 'in_progress' as const },
    ];

    render(
      <AgentDAGVisualizer
        status="researching"
        subtopics={mockSubtopics}
        sourcesCount={12}
        currentStepDescription="Executing parallel web searchers"
      />
    );

    expect(screen.getByText('Quantum Key Distribution')).toBeInTheDocument();
    expect(screen.getByText('Trapped-Ion Processors')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Sources counter
  });
});
