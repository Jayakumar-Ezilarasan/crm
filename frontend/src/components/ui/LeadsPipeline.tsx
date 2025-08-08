import React from 'react';
import { Lead } from '../../types/models';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export interface LeadsPipelineProps {
  columns: { [stage: string]: Lead[] };
  loading?: boolean;
  error?: string;
  onMove?: (leadId: number, toStage: string) => void;
}

const stages = ['Lead', 'Qualified', 'Proposal', 'Closed'];

export const LeadsPipeline: React.FC<LeadsPipelineProps> = ({ columns, loading, error, onMove }) => {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const leadId = Number(result.draggableId);
    const toStage = result.destination.droppableId;
    if (onMove) onMove(leadId, toStage);
  };

  if (loading) return <div role="status" aria-busy="true" className="p-4">Loading...</div>;
  if (error) return <div role="alert" className="p-4 text-red-600">{error}</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {stages.map(stage => (
          <Droppable droppableId={stage} key={stage}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="bg-gray-100 rounded p-2 min-w-[220px] flex-1"
                aria-label={`${stage} column`}
              >
                <div className="font-bold mb-2">{stage}</div>
                {columns[stage]?.map((lead, idx) => (
                  <Draggable draggableId={lead.id.toString()} index={idx} key={lead.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`bg-white p-3 mb-2 rounded shadow cursor-move ${snapshot.isDragging ? 'ring-2 ring-blue-400' : ''}`}
                        aria-label={`Lead ${lead.id}`}
                      >
                        <div className="font-semibold">{lead.stage}: {lead.value || ''}</div>
                        <div className="text-sm text-gray-500">{lead.source || ''}</div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}; 