import { generateRequestBody, createDefaultRequestBody } from '../types/body';
import type { RequestBodyConfig, FormDataField, KeyValuePair } from '../types/body';

describe('Body Types and Utilities', () => {
  describe('createDefaultRequestBody', () => {
    it('should create default request body configuration', () => {
      const defaultBody = createDefaultRequestBody();
      
      expect(defaultBody.type).toBe('none');
      expect(defaultBody.formData).toEqual([]);
      expect(defaultBody.urlEncoded).toEqual([]);
      expect(defaultBody.raw.content).toBe('');
      expect(defaultBody.raw.language).toBe('json');
      expect(defaultBody.raw.autoFormat).toBe(true);
      expect(defaultBody.binary).toEqual({});
      expect(defaultBody.graphql.query).toBe('');
      expect(defaultBody.graphql.variables).toBe('{}');
    });
  });

  describe('generateRequestBody', () => {
    it('should return null body for none type', () => {
      const config = createDefaultRequestBody();
      const result = generateRequestBody(config);
      
      expect(result.body).toBeNull();
      expect(result.contentType).toBeUndefined();
    });

    it('should generate FormData for form-data type', () => {
      const config: RequestBodyConfig = {
        ...createDefaultRequestBody(),
        type: 'form-data',
        formData: [
          { key: 'name', value: 'John', enabled: true, type: 'text' },
          { key: 'disabled', value: 'test', enabled: false, type: 'text' },
          { key: 'email', value: 'john@example.com', enabled: true, type: 'text' }
        ]
      };
      
      const result = generateRequestBody(config);
      
      expect(result.body).toBeInstanceOf(FormData);
      expect(result.contentType).toBeUndefined(); // FormData sets boundary automatically
      
      const formData = result.body as FormData;
      expect(formData.get('name')).toBe('John');
      expect(formData.get('email')).toBe('john@example.com');
      expect(formData.get('disabled')).toBeNull(); // Disabled fields should not be included
    });

    it('should generate URL-encoded string for x-www-form-urlencoded type', () => {
      const config: RequestBodyConfig = {
        ...createDefaultRequestBody(),
        type: 'x-www-form-urlencoded',
        urlEncoded: [
          { key: 'name', value: 'John Doe', enabled: true },
          { key: 'email', value: 'john@example.com', enabled: true },
          { key: 'disabled', value: 'test', enabled: false }
        ]
      };
      
      const result = generateRequestBody(config);
      
      expect(typeof result.body).toBe('string');
      expect(result.contentType).toBe('application/x-www-form-urlencoded');
      
      const params = new URLSearchParams(result.body as string);
      expect(params.get('name')).toBe('John Doe');
      expect(params.get('email')).toBe('john@example.com');
      expect(params.get('disabled')).toBeNull(); // Disabled fields should not be included
    });

    it('should generate raw content with appropriate content type', () => {
      const config: RequestBodyConfig = {
        ...createDefaultRequestBody(),
        type: 'raw',
        raw: {
          content: '{"name": "John", "age": 30}',
          language: 'json',
          autoFormat: true
        }
      };
      
      const result = generateRequestBody(config);
      
      expect(result.body).toBe('{"name": "John", "age": 30}');
      expect(result.contentType).toBe('application/json');
    });

    it('should generate different content types for different languages', () => {
      const languages = [
        { language: 'json', expected: 'application/json' },
        { language: 'xml', expected: 'application/xml' },
        { language: 'html', expected: 'text/html' },
        { language: 'javascript', expected: 'application/javascript' },
        { language: 'css', expected: 'text/css' },
        { language: 'text', expected: 'text/plain' }
      ] as const;

      languages.forEach(({ language, expected }) => {
        const config: RequestBodyConfig = {
          ...createDefaultRequestBody(),
          type: 'raw',
          raw: {
            content: 'test content',
            language,
            autoFormat: true
          }
        };
        
        const result = generateRequestBody(config);
        expect(result.contentType).toBe(expected);
      });
    });

    it('should generate GraphQL request body', () => {
      const config: RequestBodyConfig = {
        ...createDefaultRequestBody(),
        type: 'graphql',
        graphql: {
          query: 'query GetUser($id: ID!) { user(id: $id) { name } }',
          variables: '{"id": "123"}',
          operationName: 'GetUser'
        }
      };
      
      const result = generateRequestBody(config);
      
      expect(typeof result.body).toBe('string');
      expect(result.contentType).toBe('application/json');
      
      const parsed = JSON.parse(result.body as string);
      expect(parsed.query).toBe('query GetUser($id: ID!) { user(id: $id) { name } }');
      expect(parsed.variables).toEqual({ id: '123' });
      expect(parsed.operationName).toBe('GetUser');
    });

    it('should handle GraphQL without operation name', () => {
      const config: RequestBodyConfig = {
        ...createDefaultRequestBody(),
        type: 'graphql',
        graphql: {
          query: 'query { users { name } }',
          variables: '{}',
          operationName: ''
        }
      };
      
      const result = generateRequestBody(config);
      const parsed = JSON.parse(result.body as string);
      
      expect(parsed.operationName).toBeUndefined();
    });

    it('should return null for binary type without file', () => {
      const config: RequestBodyConfig = {
        ...createDefaultRequestBody(),
        type: 'binary',
        binary: {}
      };
      
      const result = generateRequestBody(config);
      expect(result.body).toBeNull();
    });

    it('should handle binary file with custom content type', () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const config: RequestBodyConfig = {
        ...createDefaultRequestBody(),
        type: 'binary',
        binary: {
          file: mockFile,
          fileName: 'custom.txt',
          contentType: 'application/custom'
        }
      };
      
      const result = generateRequestBody(config);
      
      expect(result.body).toBe(mockFile);
      expect(result.contentType).toBe('application/custom');
    });

    it('should use file type as fallback content type for binary', () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const config: RequestBodyConfig = {
        ...createDefaultRequestBody(),
        type: 'binary',
        binary: {
          file: mockFile,
          fileName: 'test.txt'
        }
      };
      
      const result = generateRequestBody(config);
      
      expect(result.body).toBe(mockFile);
      expect(result.contentType).toBe('text/plain');
    });

    it('should use octet-stream as ultimate fallback for binary', () => {
      const mockFile = new File(['test content'], 'test.txt', { type: '' });
      const config: RequestBodyConfig = {
        ...createDefaultRequestBody(),
        type: 'binary',
        binary: {
          file: mockFile
        }
      };
      
      const result = generateRequestBody(config);
      
      expect(result.body).toBe(mockFile);
      expect(result.contentType).toBe('application/octet-stream');
    });
  });
});
