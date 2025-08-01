import { hmacSha256, sha256, getSignatureKey, createAwsSignature } from '../utils/awsSignature';

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    sign: jest.fn(),
    digest: jest.fn()
  }
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

describe('AWS Signature Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sha256', () => {
    it('should hash data using SHA-256', async () => {
      const mockHashBuffer = new ArrayBuffer(32);
      const mockUint8Array = new Uint8Array(mockHashBuffer);
      // Set some mock values
      mockUint8Array[0] = 171; // 0xab
      mockUint8Array[1] = 205; // 0xcd
      
      mockCrypto.subtle.digest.mockResolvedValue(mockHashBuffer);
      
      const result = await sha256('test data');
      
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
      expect(result).toMatch(/^[a-f0-9]{64}$/); // Should be 64 character hex string
    });
  });

  describe('hmacSha256', () => {
    it('should create HMAC-SHA256 signature', async () => {
      const mockKey = new ArrayBuffer(16);
      const mockSignature = new ArrayBuffer(32);
      
      mockCrypto.subtle.importKey.mockResolvedValue('mock-crypto-key');
      mockCrypto.subtle.sign.mockResolvedValue(mockSignature);
      
      const result = await hmacSha256(mockKey, 'test data');
      
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        mockKey,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      expect(mockCrypto.subtle.sign).toHaveBeenCalledWith('HMAC', 'mock-crypto-key', expect.any(Uint8Array));
      expect(result).toBe(mockSignature);
    });
  });

  describe('getSignatureKey', () => {
    it('should generate AWS signature key', async () => {
      const mockArrayBuffer = new ArrayBuffer(32);
      
      mockCrypto.subtle.importKey.mockResolvedValue('mock-crypto-key');
      mockCrypto.subtle.sign.mockResolvedValue(mockArrayBuffer);
      
      const result = await getSignatureKey('secret', '20230801', 'us-east-1', 's3');
      
      expect(result).toBe(mockArrayBuffer);
      // Should call HMAC 4 times (date, region, service, aws4_request)
      expect(mockCrypto.subtle.sign).toHaveBeenCalledTimes(4);
    });
  });

  describe('createAwsSignature', () => {
    beforeEach(() => {
      // Mock all crypto operations to return predictable values
      const mockArrayBuffer = new ArrayBuffer(32);
      const mockUint8Array = new Uint8Array(mockArrayBuffer);
      mockUint8Array.fill(171); // Fill with 0xab for predictable hex output
      
      mockCrypto.subtle.digest.mockResolvedValue(mockArrayBuffer);
      mockCrypto.subtle.importKey.mockResolvedValue('mock-crypto-key');
      mockCrypto.subtle.sign.mockResolvedValue(mockArrayBuffer);
    });

    it('should create AWS Signature V4 headers', async () => {
      const method = 'GET';
      const url = 'https://s3.amazonaws.com/bucket/key';
      const headers = { 'host': 's3.amazonaws.com' };
      const body = '';
      const accessKey = 'AKIAIOSFODNN7EXAMPLE';
      const secretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      const sessionToken = '';
      const region = 'us-east-1';
      const service = 's3';

      const result = await createAwsSignature(
        method, url, headers, body, accessKey, secretKey, sessionToken, region, service
      );

      expect(result).toHaveProperty('Authorization');
      expect(result).toHaveProperty('X-Amz-Date');
      expect(result).toHaveProperty('X-Amz-Content-Sha256');
      
      expect(result['Authorization']).toMatch(/^AWS4-HMAC-SHA256 Credential=/);
      expect(result['X-Amz-Date']).toMatch(/^\d{8}T\d{6}Z$/);
      expect(result['X-Amz-Content-Sha256']).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should include session token when provided', async () => {
      const method = 'GET';
      const url = 'https://s3.amazonaws.com/bucket/key';
      const headers = { 'host': 's3.amazonaws.com' };
      const body = '';
      const accessKey = 'AKIAIOSFODNN7EXAMPLE';
      const secretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      const sessionToken = 'session-token-123';
      const region = 'us-east-1';
      const service = 's3';

      const result = await createAwsSignature(
        method, url, headers, body, accessKey, secretKey, sessionToken, region, service
      );

      expect(result).toHaveProperty('X-Amz-Security-Token');
      expect(result['X-Amz-Security-Token']).toBe('session-token-123');
    });

    it('should handle POST requests with body', async () => {
      const method = 'POST';
      const url = 'https://dynamodb.us-east-1.amazonaws.com/';
      const headers = { 
        'host': 'dynamodb.us-east-1.amazonaws.com',
        'content-type': 'application/x-amz-json-1.0'
      };
      const body = '{"TableName":"test"}';
      const accessKey = 'AKIAIOSFODNN7EXAMPLE';
      const secretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      const sessionToken = '';
      const region = 'us-east-1';
      const service = 'dynamodb';

      const result = await createAwsSignature(
        method, url, headers, body, accessKey, secretKey, sessionToken, region, service
      );

      expect(result).toHaveProperty('Authorization');
      expect(result['Authorization']).toMatch(/^AWS4-HMAC-SHA256 Credential=.*\/dynamodb\/aws4_request/);
    });

    it('should handle query parameters in URL', async () => {
      const method = 'GET';
      const url = 'https://s3.amazonaws.com/bucket/key?response-content-type=text%2Fplain';
      const headers = { 'host': 's3.amazonaws.com' };
      const body = '';
      const accessKey = 'AKIAIOSFODNN7EXAMPLE';
      const secretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      const sessionToken = '';
      const region = 'us-east-1';
      const service = 's3';

      const result = await createAwsSignature(
        method, url, headers, body, accessKey, secretKey, sessionToken, region, service
      );

      expect(result).toHaveProperty('Authorization');
      expect(result['Authorization']).toMatch(/^AWS4-HMAC-SHA256/);
    });
  });
});
