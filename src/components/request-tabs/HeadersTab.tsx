import React from 'react';
import KeyValueInput from '@/components/key-value-input';

interface HeadersTabProps {
  headers: Record<string, string>;
  onHeadersChange: (headers: Record<string, string>) => void;
}

const HeadersTab: React.FC<HeadersTabProps> = ({ headers, onHeadersChange }) => {
  return (
    <div className="flex-1 flex flex-col"> {/* Outermost div: fills TabsContent, no direct scrolling/padding */}
      <KeyValueInput label="Headers" value={headers} onChange={onHeadersChange} />
    </div>
  );
};

export default HeadersTab;