import { 
  TestAssertion, 
  TestSuite, 
  TestResult,
  TestExecution,
  ResponseTestData,
  createDefaultTestAssertion,
  createDefaultTestSuite,
  getOperatorsForType,
  requiresFieldForType,
  getValueTypeForAssertion,
  TEST_ASSERTION_CONFIGS
} from '../types/testing';

describe('Testing Types', () => {
  describe('createDefaultTestAssertion', () => {
    it('should create default status-code assertion', () => {
      const assertion = createDefaultTestAssertion('status-code');
      
      expect(assertion.id).toBeDefined();
      expect(assertion.enabled).toBe(true);
      expect(assertion.type).toBe('status-code');
      expect(assertion.operator).toBe('equals');
      expect(assertion.expectedValue).toBe(200);
      expect(assertion.description).toBe('Success response');
    });

    it('should create default response-time assertion', () => {
      const assertion = createDefaultTestAssertion('response-time');
      
      expect(assertion.type).toBe('response-time');
      expect(assertion.operator).toBe('less-than');
      expect(assertion.expectedValue).toBe(1000);
    });

    it('should create default json-path assertion', () => {
      const assertion = createDefaultTestAssertion('json-path');
      
      expect(assertion.type).toBe('json-path');
      expect(assertion.field).toBe('data.user.id');
      expect(assertion.operator).toBe('equals');
      expect(assertion.expectedValue).toBe('123');
    });
  });

  describe('createDefaultTestSuite', () => {
    it('should create default test suite', () => {
      const suite = createDefaultTestSuite();
      
      expect(suite.id).toBeDefined();
      expect(suite.name).toBe('New Test Suite');
      expect(suite.description).toBe('');
      expect(suite.assertions).toEqual([]);
      expect(suite.enabled).toBe(true);
    });
  });

  describe('getOperatorsForType', () => {
    it('should return correct operators for status-code', () => {
      const operators = getOperatorsForType('status-code');
      expect(operators).toContain('equals');
      expect(operators).toContain('not-equals');
      expect(operators).toContain('greater-than');
      expect(operators).toContain('less-than');
      expect(operators).toContain('in-range');
    });

    it('should return correct operators for header-exists', () => {
      const operators = getOperatorsForType('header-exists');
      expect(operators).toEqual(['exists', 'not-exists']);
    });

    it('should return correct operators for response-body-contains', () => {
      const operators = getOperatorsForType('response-body-contains');
      expect(operators).toContain('contains');
      expect(operators).toContain('not-contains');
      expect(operators).toContain('matches');
      expect(operators).toContain('not-matches');
    });
  });

  describe('requiresFieldForType', () => {
    it('should return false for status-code', () => {
      expect(requiresFieldForType('status-code')).toBe(false);
    });

    it('should return false for response-time', () => {
      expect(requiresFieldForType('response-time')).toBe(false);
    });

    it('should return true for header-exists', () => {
      expect(requiresFieldForType('header-exists')).toBe(true);
    });

    it('should return true for header-value', () => {
      expect(requiresFieldForType('header-value')).toBe(true);
    });

    it('should return true for json-path', () => {
      expect(requiresFieldForType('json-path')).toBe(true);
    });
  });

  describe('getValueTypeForAssertion', () => {
    it('should return number for status-code', () => {
      expect(getValueTypeForAssertion('status-code')).toBe('number');
    });

    it('should return number for response-time', () => {
      expect(getValueTypeForAssertion('response-time')).toBe('number');
    });

    it('should return string for content-type', () => {
      expect(getValueTypeForAssertion('content-type')).toBe('string');
    });

    it('should return boolean for header-exists', () => {
      expect(getValueTypeForAssertion('header-exists')).toBe('boolean');
    });
  });

  describe('TEST_ASSERTION_CONFIGS', () => {
    it('should contain all assertion types', () => {
      const expectedTypes = [
        'status-code',
        'response-time',
        'content-type',
        'header-exists',
        'header-value',
        'json-path',
        'json-property-exists',
        'response-body-contains',
        'response-size'
      ];

      const configTypes = TEST_ASSERTION_CONFIGS.map(config => config.type);
      
      expectedTypes.forEach(type => {
        expect(configTypes).toContain(type);
      });
    });

    it('should have valid configurations for each type', () => {
      TEST_ASSERTION_CONFIGS.forEach(config => {
        expect(config.type).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.description).toBeDefined();
        expect(Array.isArray(config.operators)).toBe(true);
        expect(config.operators.length).toBeGreaterThan(0);
        expect(typeof config.requiresField).toBe('boolean');
        expect(['string', 'number', 'boolean', 'array']).toContain(config.valueType);
        expect(Array.isArray(config.examples)).toBe(true);
        expect(config.examples.length).toBeGreaterThan(0);
      });
    });

    it('should have examples with required properties', () => {
      TEST_ASSERTION_CONFIGS.forEach(config => {
        config.examples.forEach(example => {
          expect(example.description).toBeDefined();
          expect(example.operator).toBeDefined();
          expect(example.expectedValue).toBeDefined();
          
          if (config.requiresField) {
            expect(example.field).toBeDefined();
          }
        });
      });
    });
  });
});

describe('Testing Framework Integration', () => {
  let mockResponseData: ResponseTestData;
  
  beforeEach(() => {
    mockResponseData = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'x-custom-header': 'test-value',
        'server': 'nginx'
      },
      body: JSON.stringify({
        status: 'success',
        data: {
          user: {
            id: '123',
            name: 'John Doe',
            email: 'john@example.com'
          },
          items: ['item1', 'item2', 'item3']
        },
        metadata: {
          count: 3,
          page: 1
        }
      }),
      contentType: 'application/json',
      responseTime: 150,
      size: 256,
      data: {
        status: 'success',
        data: {
          user: {
            id: '123',
            name: 'John Doe',
            email: 'john@example.com'
          },
          items: ['item1', 'item2', 'item3']
        },
        metadata: {
          count: 3,
          page: 1
        }
      }
    };
  });

  describe('Test Suite Creation and Management', () => {
    it('should create and modify test suites', () => {
      const suite1 = createDefaultTestSuite();
      const suite2 = createDefaultTestSuite();
      
      expect(suite1.id).not.toBe(suite2.id);
      
      // Modify suite
      suite1.name = 'API Validation Tests';
      suite1.description = 'Test basic API response validation';
      
      expect(suite1.name).toBe('API Validation Tests');
      expect(suite1.description).toBe('Test basic API response validation');
    });

    it('should manage test assertions in suite', () => {
      const suite = createDefaultTestSuite();
      
      // Add assertions
      const statusAssertion = createDefaultTestAssertion('status-code');
      const timeAssertion = createDefaultTestAssertion('response-time');
      const jsonAssertion = createDefaultTestAssertion('json-path');
      
      suite.assertions = [statusAssertion, timeAssertion, jsonAssertion];
      
      expect(suite.assertions).toHaveLength(3);
      expect(suite.assertions[0].type).toBe('status-code');
      expect(suite.assertions[1].type).toBe('response-time');
      expect(suite.assertions[2].type).toBe('json-path');
    });
  });

  describe('Test Assertion Configuration', () => {
    it('should configure status code assertion', () => {
      const assertion = createDefaultTestAssertion('status-code');
      
      assertion.operator = 'equals';
      assertion.expectedValue = 201;
      assertion.description = 'Check for created status';
      
      expect(assertion.operator).toBe('equals');
      expect(assertion.expectedValue).toBe(201);
      expect(assertion.description).toBe('Check for created status');
    });

    it('should configure header validation assertion', () => {
      const assertion = createDefaultTestAssertion('header-value');
      
      assertion.field = 'content-type';
      assertion.operator = 'contains';
      assertion.expectedValue = 'json';
      assertion.description = 'Check content type is JSON';
      
      expect(assertion.field).toBe('content-type');
      expect(assertion.operator).toBe('contains');
      expect(assertion.expectedValue).toBe('json');
    });

    it('should configure JSON path assertion', () => {
      const assertion = createDefaultTestAssertion('json-path');
      
      assertion.field = 'data.user.name';
      assertion.operator = 'equals';
      assertion.expectedValue = 'John Doe';
      assertion.description = 'Validate user name';
      
      expect(assertion.field).toBe('data.user.name');
      expect(assertion.operator).toBe('equals');
      expect(assertion.expectedValue).toBe('John Doe');
    });
  });

  describe('Test Result Validation', () => {
    it('should validate successful test results', () => {
      const result: TestResult = {
        id: 'test-1',
        assertionId: 'assertion-1',
        passed: true,
        actualValue: 200,
        expectedValue: 200,
        message: '✓ Status code equals 200'
      };
      
      expect(result.passed).toBe(true);
      expect(result.actualValue).toBe(result.expectedValue);
      expect(result.message).toContain('✓');
    });

    it('should validate failed test results', () => {
      const result: TestResult = {
        id: 'test-2',
        assertionId: 'assertion-2',
        passed: false,
        actualValue: 404,
        expectedValue: 200,
        message: '✗ Status code equals 200 (Expected: 200, Actual: 404)'
      };
      
      expect(result.passed).toBe(false);
      expect(result.actualValue).not.toBe(result.expectedValue);
      expect(result.message).toContain('✗');
      expect(result.message).toContain('Expected: 200');
      expect(result.message).toContain('Actual: 404');
    });

    it('should handle test execution errors', () => {
      const result: TestResult = {
        id: 'test-3',
        assertionId: 'assertion-3',
        passed: false,
        actualValue: null,
        expectedValue: 'some-value',
        error: 'JSON path not found',
        message: 'Test failed: JSON path not found'
      };
      
      expect(result.passed).toBe(false);
      expect(result.error).toBe('JSON path not found');
      expect(result.message).toContain('Test failed');
    });
  });

  describe('Test Execution Summary', () => {
    it('should calculate test execution statistics', () => {
      const execution: TestExecution = {
        id: 'exec-1',
        suiteId: 'suite-1',
        timestamp: new Date(),
        duration: 150,
        results: [
          { id: '1', assertionId: 'a1', passed: true, actualValue: 200, expectedValue: 200, message: 'Status OK' },
          { id: '2', assertionId: 'a2', passed: true, actualValue: 100, expectedValue: 100, message: 'Time OK' },
          { id: '3', assertionId: 'a3', passed: false, actualValue: 'error', expectedValue: 'success', message: 'Status failed' }
        ],
        status: 'failed',
        totalTests: 3,
        passedTests: 2,
        failedTests: 1
      };
      
      expect(execution.totalTests).toBe(3);
      expect(execution.passedTests).toBe(2);
      expect(execution.failedTests).toBe(1);
      expect(execution.status).toBe('failed');
      
      const successRate = (execution.passedTests / execution.totalTests) * 100;
      expect(successRate).toBeCloseTo(66.67, 1);
    });

    it('should handle empty test execution', () => {
      const execution: TestExecution = {
        id: 'exec-2',
        suiteId: 'suite-2',
        timestamp: new Date(),
        duration: 0,
        results: [],
        status: 'passed',
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      };
      
      expect(execution.totalTests).toBe(0);
      expect(execution.passedTests).toBe(0);
      expect(execution.failedTests).toBe(0);
      expect(execution.status).toBe('passed');
    });
  });

  describe('Response Data Validation', () => {
    it('should have properly structured response data', () => {
      expect(mockResponseData.status).toBe(200);
      expect(mockResponseData.statusText).toBe('OK');
      expect(mockResponseData.headers).toHaveProperty('content-type');
      expect(mockResponseData.body).toBeDefined();
      expect(mockResponseData.contentType).toBe('application/json');
      expect(mockResponseData.responseTime).toBeGreaterThan(0);
      expect(mockResponseData.size).toBeGreaterThan(0);
      expect(mockResponseData.data).toBeDefined();
    });

    it('should have valid JSON data structure', () => {
      expect(mockResponseData.data.status).toBe('success');
      expect(mockResponseData.data.data.user.id).toBe('123');
      expect(mockResponseData.data.data.user.name).toBe('John Doe');
      expect(mockResponseData.data.data.items).toHaveLength(3);
      expect(mockResponseData.data.metadata.count).toBe(3);
    });
  });
});
