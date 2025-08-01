import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Upload } from 'lucide-react';
import { FormDataField } from '@/types/body';

interface FormDataBodyProps {
  formData: FormDataField[];
  onChange: (formData: FormDataField[]) => void;
}

const FormDataBody: React.FC<FormDataBodyProps> = ({ formData, onChange }) => {
  const addField = () => {
    const newField: FormDataField = {
      key: '',
      value: '',
      enabled: true,
      type: 'text'
    };
    onChange([...formData, newField]);
  };

  const removeField = (index: number) => {
    const updated = formData.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateField = (index: number, updates: Partial<FormDataField>) => {
    const updated = formData.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    );
    onChange(updated);
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (file) {
      updateField(index, { 
        file, 
        fileName: file.name,
        value: file.name // Display filename in value field
      });
    } else {
      updateField(index, { 
        file: undefined, 
        fileName: undefined,
        value: ''
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Form Data</Label>
        <Button
          onClick={addField}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </Button>
      </div>

      {formData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No form data fields.</p>
          <p className="text-sm">Click "Add Field" to start adding form data.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {formData.map((field, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
              <Checkbox
                checked={field.enabled}
                onCheckedChange={(checked) => 
                  updateField(index, { enabled: !!checked })
                }
              />
              
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  placeholder="Key"
                  value={field.key}
                  onChange={(e) => updateField(index, { key: e.target.value })}
                  disabled={!field.enabled}
                />
                
                <div className="flex gap-2">
                  {field.type === 'text' ? (
                    <Input
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => updateField(index, { value: e.target.value })}
                      disabled={!field.enabled}
                      className="flex-1"
                    />
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                        disabled={!field.enabled}
                        className="hidden"
                        id={`file-${index}`}
                      />
                      <Label
                        htmlFor={`file-${index}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted/50">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm truncate">
                            {field.fileName || 'Choose file...'}
                          </span>
                        </div>
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <Select
                value={field.type}
                onValueChange={(value: 'text' | 'file') => {
                  updateField(index, { 
                    type: value,
                    // Reset file-related fields when switching to text
                    ...(value === 'text' && { 
                      file: undefined, 
                      fileName: undefined,
                      value: ''
                    })
                  });
                }}
                disabled={!field.enabled}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => removeField(index)}
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {formData.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p>• Files will be uploaded as multipart/form-data</p>
          <p>• Content-Type header will be set automatically</p>
          <p>• Disabled fields will be excluded from the request</p>
        </div>
      )}
    </div>
  );
};

export default FormDataBody;
