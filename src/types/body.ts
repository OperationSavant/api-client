// Types for different request body formats

export type BodyType = 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface FormDataField extends KeyValuePair {
  type: 'text' | 'file';
  file?: File;
  fileName?: string;
}

export interface RawBodyConfig {
  content: string;
  language: 'json' | 'xml' | 'html' | 'text' | 'javascript' | 'css';
  autoFormat: boolean;
}

export interface BinaryBodyConfig {
  file?: File;
  fileName?: string;
  contentType?: string;
}

export interface GraphQLBodyConfig {
  query: string;
  variables: string; // JSON string
  operationName?: string;
}

export interface RequestBodyConfig {
  type: BodyType;
  formData: FormDataField[];
  urlEncoded: KeyValuePair[];
  raw: RawBodyConfig;
  binary: BinaryBodyConfig;
  graphql: GraphQLBodyConfig;
}

// Default configurations
export const createDefaultRequestBody = (): RequestBodyConfig => ({
  type: 'none',
  formData: [],
  urlEncoded: [],
  raw: {
    content: '',
    language: 'json',
    autoFormat: true
  },
  binary: {},
  graphql: {
    query: '',
    variables: '{}',
    operationName: ''
  }
});

// Helper functions for body content generation
export const generateRequestBody = (config: RequestBodyConfig): { body: string | FormData | File | null; contentType?: string } => {
  switch (config.type) {
    case 'none':
      return { body: null };
      
    case 'form-data':
      const formData = new FormData();
      config.formData
        .filter(field => field.enabled && field.key)
        .forEach(field => {
          if (field.type === 'file' && field.file) {
            formData.append(field.key, field.file, field.fileName || field.file.name);
          } else {
            formData.append(field.key, field.value);
          }
        });
      return { body: formData }; // Don't set Content-Type, let browser set it with boundary
      
    case 'x-www-form-urlencoded':
      const params = new URLSearchParams();
      config.urlEncoded
        .filter(field => field.enabled && field.key)
        .forEach(field => {
          params.append(field.key, field.value);
        });
      return { 
        body: params.toString(), 
        contentType: 'application/x-www-form-urlencoded' 
      };
      
    case 'raw':
      return { 
        body: config.raw.content,
        contentType: getContentTypeForLanguage(config.raw.language)
      };
      
    case 'binary':
      if (config.binary.file) {
        return { 
          body: config.binary.file,
          contentType: config.binary.contentType || config.binary.file.type || 'application/octet-stream'
        };
      }
      return { body: null };
      
    case 'graphql':
      const graphqlBody = {
        query: config.graphql.query,
        variables: JSON.parse(config.graphql.variables || '{}'),
        ...(config.graphql.operationName && { operationName: config.graphql.operationName })
      };
      return { 
        body: JSON.stringify(graphqlBody, null, 2),
        contentType: 'application/json'
      };
      
    default:
      return { body: null };
  }
};

const getContentTypeForLanguage = (language: string): string => {
  switch (language) {
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'html':
      return 'text/html';
    case 'javascript':
      return 'application/javascript';
    case 'css':
      return 'text/css';
    case 'text':
    default:
      return 'text/plain';
  }
};
