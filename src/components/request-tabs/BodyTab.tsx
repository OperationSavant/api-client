import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BodyTabProps {
  requestBody: string;
  onRequestBodyChange: (body: string) => void;
}

const BodyTab: React.FC<BodyTabProps> = ({ requestBody, onRequestBodyChange }) => {
  return (
    <div className="flex flex-col space-y-1.5 p-4">
      <Label htmlFor="body">Request Body</Label>
      <Textarea
        id="body"
        placeholder="Enter request body (JSON, etc.)"
        value={requestBody}
        onChange={(e) => onRequestBodyChange(e.target.value)}
      />
    </div>
  );
};

export default BodyTab;