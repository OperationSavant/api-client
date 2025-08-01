import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApiKeyAuth } from '@/types/auth';

interface ApiKeyAuthProps {
  auth: ApiKeyAuth;
  onChange: (auth: ApiKeyAuth) => void;
}

const ApiKeyAuthComponent: React.FC<ApiKeyAuthProps> = ({ auth, onChange }) => {
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...auth,
      key: e.target.value,
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...auth,
      value: e.target.value,
    });
  };

  const handleAddToChange = (value: 'header' | 'query') => {
    onChange({
      ...auth,
      addTo: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="apikey-key">Key</Label>
        <Input
          id="apikey-key"
          type="text"
          placeholder="Enter API key name"
          value={auth.key}
          onChange={handleKeyChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="apikey-value">Value</Label>
        <Input
          id="apikey-value"
          type="text"
          placeholder="Enter API key value"
          value={auth.value}
          onChange={handleValueChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="apikey-addto">Add to</Label>
        <Select onValueChange={handleAddToChange} defaultValue={auth.addTo}>
          <SelectTrigger>
            <SelectValue placeholder="Select where to add the API key" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="header">Header</SelectItem>
            <SelectItem value="query">Query Params</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="text-sm text-muted-foreground">
        API key will be added to {auth.addTo === 'header' ? 'request headers' : 'query parameters'}.
      </div>
    </div>
  );
};

export default ApiKeyAuthComponent;
