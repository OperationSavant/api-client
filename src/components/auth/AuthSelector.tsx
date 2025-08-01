import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthConfig, AuthType } from '@/types/auth';
import BasicAuthComponent from './BasicAuth';
import BearerAuthComponent from './BearerAuth';
import ApiKeyAuthComponent from './ApiKeyAuth';
import OAuth2AuthComponent from './OAuth2Auth';
import { AwsAuth } from './AwsAuth';

interface AuthSelectorProps {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

const AuthSelector: React.FC<AuthSelectorProps> = ({ auth, onChange }) => {
  const handleAuthTypeChange = (type: AuthType) => {
    const newAuth: AuthConfig = { type };
    
    // Initialize default values for each auth type
    switch (type) {
      case 'basic':
        newAuth.basic = { username: '', password: '', showPassword: false };
        break;
      case 'bearer':
        newAuth.bearer = { token: '', prefix: 'Bearer' };
        break;
      case 'apikey':
        newAuth.apikey = { key: '', value: '', addTo: 'header' };
        break;
      case 'oauth2':
        newAuth.oauth2 = {
          grantType: 'client_credentials',
          clientId: '',
          clientSecret: '',
          tokenUrl: '',
          scope: '',
          clientAuth: 'header'
        };
        break;
      case 'aws':
        newAuth.aws = {
          accessKey: '',
          secretKey: '',
          sessionToken: '',
          service: 's3',
          region: 'us-east-1'
        };
        break;
    }
    
    onChange(newAuth);
  };

  const handleAuthConfigChange = (authType: AuthType) => (config: any) => {
    onChange({
      ...auth,
      [authType]: config,
    });
  };

  const renderAuthComponent = () => {
    switch (auth.type) {
      case 'basic':
        return auth.basic ? (
          <BasicAuthComponent
            auth={auth.basic}
            onChange={handleAuthConfigChange('basic')}
          />
        ) : null;
        
      case 'bearer':
        return auth.bearer ? (
          <BearerAuthComponent
            auth={auth.bearer}
            onChange={handleAuthConfigChange('bearer')}
          />
        ) : null;
        
      case 'apikey':
        return auth.apikey ? (
          <ApiKeyAuthComponent
            auth={auth.apikey}
            onChange={handleAuthConfigChange('apikey')}
          />
        ) : null;
        
      case 'oauth2':
        return auth.oauth2 ? (
          <OAuth2AuthComponent
            auth={auth.oauth2}
            onChange={handleAuthConfigChange('oauth2')}
          />
        ) : null;
        
      case 'aws':
        return auth.aws ? (
          <AwsAuth
            auth={auth.aws}
            onChange={handleAuthConfigChange('aws')}
          />
        ) : null;
        
      default:
        return (
          <div className="text-sm text-muted-foreground">
            This request does not use any authorization.
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="auth-type">Authorization Type</Label>
        <Select onValueChange={handleAuthTypeChange} defaultValue={auth.type}>
          <SelectTrigger>
            <SelectValue placeholder="Select authorization type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Auth</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="apikey">API Key</SelectItem>
            <SelectItem value="oauth2">OAuth 2.0</SelectItem>
            <SelectItem value="aws">AWS Signature</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {auth.type !== 'none' && (
        <div className="border-t pt-4">
          {renderAuthComponent()}
        </div>
      )}
    </div>
  );
};

export default AuthSelector;
