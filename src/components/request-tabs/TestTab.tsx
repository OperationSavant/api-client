import React, { useState } from 'react';
import { Plus, Play, Trash2, Copy, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  TestSuite, 
  TestAssertion, 
  TestExecution, 
  TestResult,
  TestAssertionType,
  TestOperator,
  TEST_ASSERTION_CONFIGS,
  createDefaultTestAssertion,
  createDefaultTestSuite,
  getOperatorsForType,
  requiresFieldForType,
  getValueTypeForAssertion
} from '../../types/testing';

interface TestTabProps {
  testSuites: TestSuite[];
  onTestSuitesChange: (suites: TestSuite[]) => void;
  onRunTests?: (suiteId: string) => void;
  testExecutions?: TestExecution[];
  isRunning?: boolean;
}

const TestTab: React.FC<TestTabProps> = ({
  testSuites,
  onTestSuitesChange,
  onRunTests,
  testExecutions = [],
  isRunning = false
}) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'results'>('setup');
  const [selectedSuite, setSelectedSuite] = useState<string>('');

  const addTestSuite = () => {
    const newSuite = createDefaultTestSuite();
    onTestSuitesChange([...testSuites, newSuite]);
    setSelectedSuite(newSuite.id);
  };

  const updateTestSuite = (suiteId: string, updates: Partial<TestSuite>) => {
    const updated = testSuites.map(suite =>
      suite.id === suiteId ? { ...suite, ...updates } : suite
    );
    onTestSuitesChange(updated);
  };

  const deleteTestSuite = (suiteId: string) => {
    const updated = testSuites.filter(suite => suite.id !== suiteId);
    onTestSuitesChange(updated);
    if (selectedSuite === suiteId) {
      setSelectedSuite(updated[0]?.id || '');
    }
  };

  const addAssertion = (suiteId: string, type: TestAssertionType) => {
    const newAssertion = createDefaultTestAssertion(type);
    updateTestSuite(suiteId, {
      assertions: [...(testSuites.find(s => s.id === suiteId)?.assertions || []), newAssertion]
    });
  };

  const updateAssertion = (suiteId: string, assertionId: string, updates: Partial<TestAssertion>) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    const updatedAssertions = suite.assertions.map(assertion =>
      assertion.id === assertionId ? { ...assertion, ...updates } : assertion
    );
    updateTestSuite(suiteId, { assertions: updatedAssertions });
  };

  const deleteAssertion = (suiteId: string, assertionId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    const updatedAssertions = suite.assertions.filter(assertion => assertion.id !== assertionId);
    updateTestSuite(suiteId, { assertions: updatedAssertions });
  };

  const currentSuite = testSuites.find(s => s.id === selectedSuite);
  const latestExecution = selectedSuite ? 
    testExecutions.filter(e => e.suiteId === selectedSuite).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] : 
    undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Tests</Label>
        <div className="flex gap-2">
          <Button
            onClick={() => addTestSuite()}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Test Suite
          </Button>
          {currentSuite && (
            <Button
              onClick={() => onRunTests?.(selectedSuite)}
              size="sm"
              disabled={isRunning || currentSuite.assertions.length === 0}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Running...' : 'Run Tests'}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'setup' | 'results')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Test Setup</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          {testSuites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No test suites created.</p>
              <p className="text-sm">Click "Add Test Suite" to start testing your API responses.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Test Suite Selection */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium min-w-fit">Test Suite:</Label>
                <Select value={selectedSuite} onValueChange={setSelectedSuite}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a test suite" />
                  </SelectTrigger>
                  <SelectContent>
                    {testSuites.map(suite => (
                      <SelectItem key={suite.id} value={suite.id}>
                        {suite.name} ({suite.assertions.length} tests)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentSuite && (
                  <Button
                    onClick={() => deleteTestSuite(selectedSuite)}
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Test Suite Configuration */}
              {currentSuite && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Input
                          value={currentSuite.name}
                          onChange={(e) => updateTestSuite(selectedSuite, { name: e.target.value })}
                          className="font-medium"
                          placeholder="Test suite name"
                        />
                        <Textarea
                          value={currentSuite.description || ''}
                          onChange={(e) => updateTestSuite(selectedSuite, { description: e.target.value })}
                          placeholder="Describe what this test suite validates..."
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={currentSuite.enabled}
                          onCheckedChange={(checked) => updateTestSuite(selectedSuite, { enabled: !!checked })}
                        />
                        <Label className="text-sm">Enabled</Label>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Test Assertions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Test Assertions</Label>
                        <Select onValueChange={(type) => addAssertion(selectedSuite, type as TestAssertionType)}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Add test" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEST_ASSERTION_CONFIGS.map(config => (
                              <SelectItem key={config.type} value={config.type}>
                                {config.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {currentSuite.assertions.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border rounded-lg">
                          <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No test assertions added.</p>
                          <p className="text-xs">Select a test type above to add your first assertion.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentSuite.assertions.map((assertion) => (
                            <AssertionEditor
                              key={assertion.id}
                              assertion={assertion}
                              onChange={(updates) => updateAssertion(selectedSuite, assertion.id, updates)}
                              onDelete={() => deleteAssertion(selectedSuite, assertion.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {testExecutions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No test results yet.</p>
              <p className="text-sm">Run some tests to see results here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latestExecution && (
                <TestResults execution={latestExecution} />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface AssertionEditorProps {
  assertion: TestAssertion;
  onChange: (updates: Partial<TestAssertion>) => void;
  onDelete: () => void;
}

const AssertionEditor: React.FC<AssertionEditorProps> = ({ assertion, onChange, onDelete }) => {
  const config = TEST_ASSERTION_CONFIGS.find(c => c.type === assertion.type);
  const operators = getOperatorsForType(assertion.type);
  const requiresField = requiresFieldForType(assertion.type);
  const valueType = getValueTypeForAssertion(assertion.type);

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={assertion.enabled}
            onCheckedChange={(checked) => onChange({ enabled: !!checked })}
          />
          <Badge variant="secondary" className="text-xs">
            {config?.name || assertion.type}
          </Badge>
          <Input
            value={assertion.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Test description..."
            className="flex-1 text-sm"
          />
          <Button
            onClick={onDelete}
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-2 items-end">
          {requiresField && (
            <div className="col-span-4 space-y-1">
              <Label className="text-xs text-muted-foreground">
                {config?.fieldDescription || 'Field'}
              </Label>
              <Input
                value={assertion.field || ''}
                onChange={(e) => onChange({ field: e.target.value })}
                placeholder={config?.fieldPlaceholder || 'Field name'}
                className="text-sm"
              />
            </div>
          )}
          
          <div className={`${requiresField ? 'col-span-3' : 'col-span-4'} space-y-1`}>
            <Label className="text-xs text-muted-foreground">Operator</Label>
            <Select value={assertion.operator} onValueChange={(value) => onChange({ operator: value as TestOperator })}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map(op => (
                  <SelectItem key={op} value={op}>
                    {op.replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={`${requiresField ? 'col-span-5' : 'col-span-8'} space-y-1`}>
            <Label className="text-xs text-muted-foreground">Expected Value</Label>
            <Input
              value={String(assertion.expectedValue)}
              onChange={(e) => {
                let value: string | number | boolean = e.target.value;
                if (valueType === 'number') {
                  value = parseFloat(e.target.value) || 0;
                } else if (valueType === 'boolean') {
                  value = e.target.value.toLowerCase() === 'true';
                }
                onChange({ expectedValue: value });
              }}
              placeholder={`Enter ${valueType} value`}
              type={valueType === 'number' ? 'number' : 'text'}
              className="text-sm"
            />
          </div>
        </div>

        {config?.description && (
          <p className="text-xs text-muted-foreground">
            {config.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

interface TestResultsProps {
  execution: TestExecution;
}

const TestResults: React.FC<TestResultsProps> = ({ execution }) => {
  const successRate = execution.totalTests > 0 ? (execution.passedTests / execution.totalTests) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Test Results</CardTitle>
            <CardDescription>
              Executed {execution.timestamp.toLocaleString()} • {execution.duration}ms
            </CardDescription>
          </div>
          <Badge variant={execution.status === 'passed' ? 'default' : 'destructive'}>
            {execution.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{execution.passedTests}</div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{execution.failedTests}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{execution.totalTests}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Success Rate</span>
            <span>{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        <Separator />

        {/* Individual Results */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Test Results</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {execution.results.map((result) => (
              <div key={result.id} className="flex items-center gap-3 p-2 rounded-lg border">
                {result.passed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{result.message}</div>
                  {!result.passed && (
                    <div className="text-xs text-muted-foreground">
                      Expected: {String(result.expectedValue)} | Actual: {String(result.actualValue)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestTab;
