import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BodyTabProps {
  requestBody: string;
  onRequestBodyChange: (body: string) => void;
}

const BodyTab: React.FC<BodyTabProps> = ({ requestBody, onRequestBodyChange }) => {
  return (
    <div className="flex flex-col flex-1"> {/* Outermost div: flex container, takes all space, NO padding here */}
      <div className="p-4 space-y-1.5 flex-1 overflow-y-auto"> {/* New inner div: for padding, spacing, and scrolling */}
        <Label htmlFor="body">Request Body</Label>
        <Textarea
          id="body"
          placeholder="Enter request body (JSON, etc.)"
          value={requestBody}
          onChange={(e) => onRequestBodyChange(e.target.value)}
          className="flex-1 resize-none" // Textarea: expands within inner div, no internal overflow-y-auto needed here as parent handles it
        />
      </div>
    </div>
  );
};

export default BodyTab;