import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { BasicAuth } from '@/types/auth';

interface BasicAuthProps {
  auth: BasicAuth;
  onChange: (auth: BasicAuth) => void;
}

const BasicAuthComponent: React.FC<BasicAuthProps> = ({ auth, onChange }) => {
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...auth,
      username: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...auth,
      password: e.target.value,
    });
  };

  const togglePasswordVisibility = () => {
    onChange({
      ...auth,
      showPassword: !auth.showPassword,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="basic-username">Username</Label>
        <Input
          id="basic-username"
          type="text"
          placeholder="Enter username"
          value={auth.username}
          onChange={handleUsernameChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="basic-password">Password</Label>
        <div className="relative">
          <Input
            id="basic-password"
            type={auth.showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            value={auth.password}
            onChange={handlePasswordChange}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={togglePasswordVisibility}
          >
            {auth.showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Basic authentication will add an Authorization header with Base64 encoded credentials.
      </div>
    </div>
  );
};

export default BasicAuthComponent;
