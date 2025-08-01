import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BearerAuth } from '@/types/auth';

interface BearerAuthProps {
  auth: BearerAuth;
  onChange: (auth: BearerAuth) => void;
}

const BearerAuthComponent: React.FC<BearerAuthProps> = ({ auth, onChange }) => {
  const handleTokenChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...auth,
      token: e.target.value,
    });
  };

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...auth,
      prefix: e.target.value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bearer-token">Token</Label>
        <Textarea
          id="bearer-token"
          placeholder="Enter bearer token"
          value={auth.token}
          onChange={handleTokenChange}
          className="min-h-[100px] resize-none"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bearer-prefix">Prefix</Label>
        <Input
          id="bearer-prefix"
          type="text"
          placeholder="Bearer"
          value={auth.prefix}
          onChange={handlePrefixChange}
        />
      </div>
      
      <div className="text-sm text-muted-foreground">
        Bearer token will be added to the Authorization header with the specified prefix.
      </div>
    </div>
  );
};

export default BearerAuthComponent;
