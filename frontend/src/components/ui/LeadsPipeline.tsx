import React from 'react';
import { Lead } from '../../types/models';
// import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export interface LeadsPipelineProps {
  columns: { [stage: string]: Lead[] };
  loading?: boolean;
  error?: string;
  onMove?: (leadId: number, toStage: string) => void;
}

const stages = ['Lead', 'Qualified', 'Proposal', 'Closed'];

export const LeadsPipeline: React.FC<LeadsPipelineProps> = ({ columns, loading, error, onMove }) => {
  // Component temporarily disabled due to missing react-beautiful-dnd dependency
  if (loading) return <div role="status" aria-busy="true" className="p-4">Loading...</div>;
  if (error) return <div role="alert" className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4 text-gray-500">
      LeadsPipeline component is temporarily disabled. Please install react-beautiful-dnd to enable drag-and-drop functionality.
    </div>
  );
}; 