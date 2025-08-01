// Test setup file
import '@testing-library/jest-dom';

// Mock TextEncoder/TextDecoder for Node environment
const { TextEncoder, TextDecoder } = require('text-encoding');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock VS Code API
(global as any).acquireVsCodeApi = jest.fn(() => ({
  postMessage: jest.fn(),
  setState: jest.fn(),
  getState: jest.fn()
}));

// Mock crypto for AWS signature tests
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      importKey: jest.fn(),
      sign: jest.fn(),
      digest: jest.fn()
    }
  }
});

// Mock fetch for OAuth tests
(global as any).fetch = jest.fn();
