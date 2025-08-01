import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BasicAuthComponent from '../components/auth/BasicAuth';
import BearerAuthComponent from '../components/auth/BearerAuth';
import ApiKeyAuthComponent from '../components/auth/ApiKeyAuth';
import OAuth2AuthComponent from '../components/auth/OAuth2Auth';
import { AwsAuth } from '../components/auth/AwsAuth';
import AuthSelector from '../components/auth/AuthSelector';
import { BasicAuth, BearerAuth, ApiKeyAuth, OAuth2Auth, AwsAuth as AwsAuthType, AuthConfig } from '../types/auth';

describe('Authentication Components', () => {
  describe('BasicAuthComponent', () => {
    const mockOnChange = jest.fn();
    const defaultAuth: BasicAuth = { username: '', password: '', showPassword: false };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render username and password fields', () => {
      render(<BasicAuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should call onChange when username is updated', async () => {
      const user = userEvent.setup();
      render(<BasicAuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'testuser' })
      );
    });

    it('should call onChange when password is updated', async () => {
      const user = userEvent.setup();
      render(<BasicAuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'testpass');
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'testpass' })
      );
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<BasicAuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      const toggleButton = screen.getByRole('button');
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      
      expect(passwordInput.type).toBe('password');
      
      await user.click(toggleButton);
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ showPassword: true })
      );
    });
  });

  describe('BearerAuthComponent', () => {
    const mockOnChange = jest.fn();
    const defaultAuth: BearerAuth = { token: '', prefix: 'Bearer' };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render token input and prefix selector', () => {
      render(<BearerAuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText(/token/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Bearer')).toBeInTheDocument();
    });

    it('should call onChange when token is updated', async () => {
      const user = userEvent.setup();
      render(<BearerAuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      const tokenInput = screen.getByLabelText(/token/i);
      await user.type(tokenInput, 'abc123');
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'abc123' })
      );
    });
  });

  describe('ApiKeyAuthComponent', () => {
    const mockOnChange = jest.fn();
    const defaultAuth: ApiKeyAuth = { key: '', value: '', addTo: 'header' };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render key and value inputs', () => {
      render(<ApiKeyAuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText(/key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });

    it('should call onChange when key is updated', async () => {
      const user = userEvent.setup();
      render(<ApiKeyAuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      const keyInput = screen.getByLabelText(/key/i);
      await user.type(keyInput, 'X-API-Key');
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'X-API-Key' })
      );
    });

    it('should call onChange when value is updated', async () => {
      const user = userEvent.setup();
      render(<ApiKeyAuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      const valueInput = screen.getByLabelText(/value/i);
      await user.type(valueInput, 'secret123');
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'secret123' })
      );
    });
  });

  describe('OAuth2AuthComponent', () => {
    const mockOnChange = jest.fn();
    const defaultAuth: OAuth2Auth = {
      tokenUrl: '',
      clientId: '',
      clientSecret: '',
      grantType: 'client_credentials',
      scope: '',
      clientAuth: 'header'
    };

    beforeEach(() => {
      jest.clearAllMocks();
      // Mock fetch for token generation
      global.fetch = jest.fn();
    });

    it('should render OAuth 2.0 configuration fields', () => {
      render(<OAuth2AuthComponent auth={defaultAuth} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText(/token url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/client id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/client secret/i)).toBeInTheDocument();
    });

    it('should generate token when button is clicked', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ access_token: 'new_token' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const authWithValues = {
        ...defaultAuth,
        tokenUrl: 'https://auth.example.com/token',
        clientId: 'client123',
        clientSecret: 'secret123'
      };

      render(<OAuth2AuthComponent auth={authWithValues} onChange={mockOnChange} />);
      
      const generateButton = screen.getByText(/generate token/i);
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ accessToken: 'new_token' })
        );
      });
    });
  });

  describe('AwsAuth', () => {
    const mockOnChange = jest.fn();
    const defaultAuth: AwsAuthType = {
      accessKey: '',
      secretKey: '',
      sessionToken: '',
      region: 'us-east-1',
      service: 's3'
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render AWS credential fields', () => {
      render(<AwsAuth auth={defaultAuth} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText(/access key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/secret access key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/session token/i)).toBeInTheDocument();
    });

    it('should call onChange when access key is updated', async () => {
      const user = userEvent.setup();
      render(<AwsAuth auth={defaultAuth} onChange={mockOnChange} />);
      
      const accessKeyInput = screen.getByLabelText(/access key/i);
      await user.type(accessKeyInput, 'AKIA123');
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ accessKey: 'AKIA123' })
      );
    });
  });

  describe('AuthSelector', () => {
    const mockOnChange = jest.fn();
    const defaultAuth: AuthConfig = { type: 'none' };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render authentication type selector', () => {
      render(<AuthSelector auth={defaultAuth} onChange={mockOnChange} />);
      
      expect(screen.getByText(/authorization type/i)).toBeInTheDocument();
    });

    it('should show Basic Auth component when selected', async () => {
      const user = userEvent.setup();
      render(<AuthSelector auth={defaultAuth} onChange={mockOnChange} />);
      
      // Click on the select trigger to open dropdown
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      
      // Select Basic Auth option
      const basicAuthOption = screen.getByText('Basic Auth');
      await user.click(basicAuthOption);
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'basic',
          basic: expect.objectContaining({
            username: '',
            password: ''
          })
        })
      );
    });

    it('should show Bearer Token component when selected', async () => {
      const user = userEvent.setup();
      render(<AuthSelector auth={defaultAuth} onChange={mockOnChange} />);
      
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      
      const bearerOption = screen.getByText('Bearer Token');
      await user.click(bearerOption);
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bearer',
          bearer: expect.objectContaining({
            token: '',
            prefix: 'Bearer'
          })
        })
      );
    });
  });
});
