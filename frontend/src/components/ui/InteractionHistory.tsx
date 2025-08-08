import React from 'react';
import { Interaction } from '../../types/models';

export interface InteractionHistoryProps {
  interactions?: Interaction[];
  loading?: boolean;
  error?: string;
}

export const InteractionHistory: React.FC<InteractionHistoryProps> = ({ interactions, loading, error }) => {
  if (loading) return <div role="status" aria-busy="true" className="p-4">Loading...</div>;
  if (error) return <div role="alert" className="p-4 text-red-600">{error}</div>;
  if (!interactions || interactions.length === 0) return <div className="p-4">No interactions found.</div>;

  return (
    <ol className="relative border-l border-gray-200" aria-label="Interaction history timeline">
      {interactions.map((item, idx) => (
        <li key={item.id} className="mb-10 ml-6">
          <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
            <span className="text-blue-600 text-xs font-bold">{idx + 1}</span>
          </span>
          <div className="flex flex-col">
            <span className="font-semibold">{item.type}</span>
            <span className="text-sm text-gray-500">{item.summary}</span>
            <span className="text-xs text-gray-400">{new Date(item.interaction_date).toLocaleString()}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}; 