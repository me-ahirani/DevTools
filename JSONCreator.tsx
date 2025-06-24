import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Download, Plus, Trash2 } from 'lucide-react';
import { copyToClipboard, downloadFile } from '../../utils/fileUtils';

interface JSONCreatorProps {
  onBack: () => void;
}

interface FormField {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

export const JSONCreator: React.FC<JSONCreatorProps> = ({ onBack }) => {
  const [fields, setFields] = useState<FormField[]>([
    { id: '1', key: 'name', value: 'John Doe', type: 'string' },
    { id: '2', key: 'age', value: '30', type: 'number' },
    { id: '3', key: 'active', value: 'true', type: 'boolean' }
  ]);
  const [jsonOutput, setJsonOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateJSON = () => {
    try {
      const result: any = {};
      
      fields.forEach(field => {
        if (!field.key.trim()) return;
        
        let processedValue: any = field.value;
        
        switch (field.type) {
          case 'number':
            processedValue = field.value === '' ? 0 : Number(field.value);
            if (isNaN(processedValue)) {
              throw new Error(`Invalid number value for field "${field.key}"`);
            }
            break;
          case 'boolean':
            processedValue = field.value.toLowerCase() === 'true';
            break;
          case 'array':
            try {
              processedValue = field.value ? JSON.parse(field.value) : [];
              if (!Array.isArray(processedValue)) {
                throw new Error(`Field "${field.key}" must be a valid array`);
              }
            } catch {
              processedValue = field.value.split(',').map(item => item.trim());
            }
            break;
          case 'object':
            try {
              processedValue = field.value ? JSON.parse(field.value) : {};
            } catch {
              throw new Error(`Invalid JSON object for field "${field.key}"`);
            }
            break;
          default:
            processedValue = field.value;
        }
        
        result[field.key] = processedValue;
      });
      
      const formatted = JSON.stringify(result, null, 2);
      setJsonOutput(formatted);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating JSON');
      setJsonOutput('');
    }
  };

  React.useEffect(() => {
    generateJSON();
  }, [fields]);

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      key: '',
      value: '',
      type: 'string'
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const handleCopy = async () => {
    if (jsonOutput) {
      const success = await copyToClipboard(jsonOutput);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownload = () => {
    if (jsonOutput) {
      downloadFile(jsonOutput, 'generated.json', 'application/json');
    }
  };

  const loadTemplate = (template: string) => {
    switch (template) {
      case 'user':
        setFields([
          { id: '1', key: 'id', value: '1', type: 'number' },
          { id: '2', key: 'name', value: 'John Doe', type: 'string' },
          { id: '3', key: 'email', value: 'john@example.com', type: 'string' },
          { id: '4', key: 'active', value: 'true', type: 'boolean' },
          { id: '5', key: 'roles', value: '["admin", "user"]', type: 'array' }
        ]);
        break;
      case 'product':
        setFields([
          { id: '1', key: 'id', value: '101', type: 'number' },
          { id: '2', key: 'name', value: 'Financial Product', type: 'string' },
          { id: '3', key: 'price', value: '999.99', type: 'number' },
          { id: '4', key: 'available', value: 'true', type: 'boolean' },
          { id: '5', key: 'categories', value: '["finance", "investment"]', type: 'array' },
          { id: '6', key: 'metadata', value: '{"risk": "medium", "term": "5 years"}', type: 'object' }
        ]);
        break;
      case 'api':
        setFields([
          { id: '1', key: 'status', value: 'success', type: 'string' },
          { id: '2', key: 'code', value: '200', type: 'number' },
          { id: '3', key: 'message', value: 'Request processed successfully', type: 'string' },
          { id: '4', key: 'data', value: '{"items": [], "total": 0}', type: 'object' },
          { id: '5', key: 'timestamp', value: new Date().toISOString(), type: 'string' }
        ]);
        break;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Tools</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">JSON Creator</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleCopy}
              disabled={!jsonOutput}
              className="flex items-center space-x-2 px-4 py-2 bg-jpmorgan-blue-600 hover:bg-jpmorgan-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!jsonOutput}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Templates</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadTemplate('user')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              User Profile
            </button>
            <button
              onClick={() => loadTemplate('product')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              Product Data
            </button>
            <button
              onClick={() => loadTemplate('api')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              API Response
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Builder */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
              <button
                onClick={addField}
                className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fields.map((field) => (
                <div key={field.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Key"
                        value={field.key}
                        onChange={(e) => updateField(field.id, { key: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value as FormField['type'] })}
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                      </select>
                    </div>
                    
                    <div className="col-span-6">
                      {field.type === 'boolean' ? (
                        <select
                          value={field.value}
                          onChange={(e) => updateField(field.id, { value: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          placeholder={
                            field.type === 'array' ? '["item1", "item2"] or comma,separated' :
                            field.type === 'object' ? '{"key": "value"}' :
                            'Value'
                          }
                          value={field.value}
                          onChange={(e) => updateField(field.id, { value: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                        />
                      )}
                    </div>
                    
                    <div className="col-span-1">
                      <button
                        onClick={() => removeField(field.id)}
                        className="w-full p-1 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* JSON Output */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated JSON</h3>
            <div className="relative">
              <textarea
                value={jsonOutput}
                readOnly
                placeholder="JSON output will appear here..."
                className="w-full h-96 p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm resize-none focus:outline-none"
              />
              {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-300 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-jpmorgan-blue-50 border border-jpmorgan-blue-200 rounded-lg">
          <h4 className="text-gray-900 font-semibold mb-2">JSON Creator Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <h5 className="font-medium text-gray-900 mb-1">Data Types:</h5>
              <ul className="space-y-1">
                <li>• String: Text values</li>
                <li>• Number: Numeric values</li>
                <li>• Boolean: true/false</li>
                <li>• Array: List of items</li>
                <li>• Object: Nested JSON</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-1">Templates:</h5>
              <ul className="space-y-1">
                <li>• User profile structure</li>
                <li>• Product data format</li>
                <li>• API response template</li>
                <li>• Custom field configuration</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-1">Features:</h5>
              <ul className="space-y-1">
                <li>• Real-time JSON generation</li>
                <li>• Error validation</li>
                <li>• Copy to clipboard</li>
                <li>• Download as file</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
