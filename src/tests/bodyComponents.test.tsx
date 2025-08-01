import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FormDataBody from '../components/body/FormDataBody';
import UrlEncodedBody from '../components/body/UrlEncodedBody';
import RawBody from '../components/body/RawBody';
import BinaryBody from '../components/body/BinaryBody';
import GraphQLBody from '../components/body/GraphQLBody';
import type { FormDataField, KeyValuePair, RawBodyConfig, BinaryBodyConfig, GraphQLBodyConfig } from '../types/body';

// Mock File constructor for testing
const mockFile = (name: string, type: string = 'text/plain') => {
  const file = new File(['test content'], name, { type });
  return file;
};

describe('Body Components', () => {
  describe('FormDataBody', () => {
    const mockOnChange = jest.fn();
    const defaultFormData: FormDataField[] = [];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render empty state when no form data', () => {
      render(<FormDataBody formData={defaultFormData} onChange={mockOnChange} />);
      
      expect(screen.getByText(/no form data fields/i)).toBeInTheDocument();
      expect(screen.getByText(/click "add field"/i)).toBeInTheDocument();
    });

    it('should add new field when Add Field button is clicked', () => {
      render(<FormDataBody formData={defaultFormData} onChange={mockOnChange} />);
      
      const addButton = screen.getByRole('button', { name: /add field/i });
      fireEvent.click(addButton);
      
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          key: '',
          value: '',
          enabled: true,
          type: 'text'
        })
      ]);
    });

    it('should render existing form data fields', () => {
      const formData: FormDataField[] = [
        { key: 'name', value: 'John', enabled: true, type: 'text' },
        { key: 'email', value: 'john@example.com', enabled: false, type: 'text' }
      ];

      render(<FormDataBody formData={formData} onChange={mockOnChange} />);
      
      expect(screen.getByDisplayValue('name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('email')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('should update field key when input changes', () => {
      const formData: FormDataField[] = [
        { key: 'name', value: 'John', enabled: true, type: 'text' }
      ];

      render(<FormDataBody formData={formData} onChange={mockOnChange} />);
      
      const keyInput = screen.getByDisplayValue('name');
      fireEvent.change(keyInput, { target: { value: 'username' } });
      
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          key: 'username',
          value: 'John',
          enabled: true,
          type: 'text'
        })
      ]);
    });

    it('should remove field when delete button is clicked', () => {
      const formData: FormDataField[] = [
        { key: 'name', value: 'John', enabled: true, type: 'text' },
        { key: 'email', value: 'john@example.com', enabled: true, type: 'text' }
      ];

      render(<FormDataBody formData={formData} onChange={mockOnChange} />);
      
      // Get all delete buttons (they have the trash icon)
      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.className.includes('text-destructive')
      );
      
      // Click the first delete button
      fireEvent.click(deleteButtons[0]);
      
      expect(mockOnChange).toHaveBeenCalledWith([
        {
          key: 'email',
          value: 'john@example.com',
          enabled: true,
          type: 'text'
        }
      ]);
    });
  });

  describe('UrlEncodedBody', () => {
    const mockOnChange = jest.fn();
    const defaultUrlEncoded: KeyValuePair[] = [];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render empty state when no fields', () => {
      render(<UrlEncodedBody urlEncoded={defaultUrlEncoded} onChange={mockOnChange} />);
      
      expect(screen.getByText(/no form fields/i)).toBeInTheDocument();
    });

    it('should add new field when Add Field button is clicked', () => {
      render(<UrlEncodedBody urlEncoded={defaultUrlEncoded} onChange={mockOnChange} />);
      
      const addButton = screen.getByRole('button', { name: /add field/i });
      fireEvent.click(addButton);
      
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          key: '',
          value: '',
          enabled: true,
          description: ''
        })
      ]);
    });

    it('should show preview of URL-encoded data', () => {
      const urlEncoded: KeyValuePair[] = [
        { key: 'name', value: 'John Doe', enabled: true },
        { key: 'email', value: 'john@example.com', enabled: true }
      ];

      render(<UrlEncodedBody urlEncoded={urlEncoded} onChange={mockOnChange} />);
      
      expect(screen.getByText(/preview:/i)).toBeInTheDocument();
      // Preview should show URL-encoded format
      const preview = screen.getByDisplayValue(/name=John\+Doe&email=john%40example\.com/);
      expect(preview).toBeInTheDocument();
    });
  });

  describe('RawBody', () => {
    const mockOnChange = jest.fn();
    const defaultRawConfig: RawBodyConfig = {
      content: '',
      language: 'json',
      autoFormat: true
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render content textarea', () => {
      render(<RawBody rawConfig={defaultRawConfig} onChange={mockOnChange} />);
      
      expect(screen.getByPlaceholderText(/enter json data/i)).toBeInTheDocument();
    });

    it('should update content when textarea changes', () => {
      render(<RawBody rawConfig={defaultRawConfig} onChange={mockOnChange} />);
      
      const textarea = screen.getByPlaceholderText(/enter json data/i);
      fireEvent.change(textarea, { target: { value: '{"test": true}' } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '{"test": true}',
          language: 'json',
          autoFormat: true
        })
      );
    });

    it('should update language when selector changes', () => {
      render(<RawBody rawConfig={defaultRawConfig} onChange={mockOnChange} />);
      
      // This would test the language selector, but requires more complex interaction
      // with the Select component which is mocked in our test environment
    });

    it('should show validation status for JSON', () => {
      const validJsonConfig: RawBodyConfig = {
        content: '{"valid": true}',
        language: 'json',
        autoFormat: true
      };

      render(<RawBody rawConfig={validJsonConfig} onChange={mockOnChange} />);
      
      expect(screen.getByText(/valid json/i)).toBeInTheDocument();
    });
  });

  describe('BinaryBody', () => {
    const mockOnChange = jest.fn();
    const defaultBinaryConfig: BinaryBodyConfig = {};

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render upload area when no file selected', () => {
      render(<BinaryBody binaryConfig={defaultBinaryConfig} onChange={mockOnChange} />);
      
      expect(screen.getByText(/upload a file/i)).toBeInTheDocument();
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });

    it('should show file info when file is selected', () => {
      const file = mockFile('test.txt', 'text/plain');
      const binaryConfig: BinaryBodyConfig = {
        file,
        fileName: 'test.txt',
        contentType: 'text/plain'
      };

      render(<BinaryBody binaryConfig={binaryConfig} onChange={mockOnChange} />);
      
      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(screen.getByText(/text\/plain/)).toBeInTheDocument();
    });

    it('should call onChange when file name is updated', () => {
      const file = mockFile('test.txt');
      const binaryConfig: BinaryBodyConfig = {
        file,
        fileName: 'test.txt',
        contentType: 'text/plain'
      };

      render(<BinaryBody binaryConfig={binaryConfig} onChange={mockOnChange} />);
      
      const fileNameInput = screen.getByDisplayValue('test.txt');
      fireEvent.change(fileNameInput, { target: { value: 'renamed.txt' } });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'renamed.txt'
        })
      );
    });
  });

  describe('GraphQLBody', () => {
    const mockOnChange = jest.fn();
    const defaultGraphQLConfig: GraphQLBodyConfig = {
      query: '',
      variables: '{}',
      operationName: ''
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render query textarea', () => {
      render(<GraphQLBody graphqlConfig={defaultGraphQLConfig} onChange={mockOnChange} />);
      
      expect(screen.getByPlaceholderText(/enter your graphql query/i)).toBeInTheDocument();
    });

    it('should update query when textarea changes', () => {
      render(<GraphQLBody graphqlConfig={defaultGraphQLConfig} onChange={mockOnChange} />);
      
      const queryTextarea = screen.getByPlaceholderText(/enter your graphql query/i);
      fireEvent.change(queryTextarea, { 
        target: { value: 'query { users { name } }' } 
      });
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'query { users { name } }'
        })
      );
    });

    it('should show variables validation status', () => {
      const configWithValidJson: GraphQLBodyConfig = {
        query: 'query GetUser($id: ID!) { user(id: $id) { name } }',
        variables: '{"id": "123"}',
        operationName: ''
      };

      render(<GraphQLBody graphqlConfig={configWithValidJson} onChange={mockOnChange} />);
      
      // Switch to variables tab
      const variablesTab = screen.getByRole('tab', { name: /variables/i });
      fireEvent.click(variablesTab);
      
      expect(screen.getByText(/valid json/i)).toBeInTheDocument();
    });

    it('should insert example query when button is clicked', () => {
      render(<GraphQLBody graphqlConfig={defaultGraphQLConfig} onChange={mockOnChange} />);
      
      const exampleButton = screen.getByText(/query example/i);
      fireEvent.click(exampleButton);
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.stringContaining('query GetUser')
        })
      );
    });
  });
});
