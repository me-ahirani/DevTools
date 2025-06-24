import React, { useState, useCallback } from 'react';
import { ArrowLeft, Copy, Check, Download, Key, RefreshCw, Code, Settings, Upload, FileText, Play, AlertCircle } from 'lucide-react';
import { copyToClipboard, downloadFile } from '../../utils/fileUtils';

interface TokenGeneratorProps {
  onBack: () => void;
}

interface CurlConfig {
  url: string;
  method: string;
  clientId: string;
  clientSecret: string;
  resourceId: string;
  grantType: string;
  username: string;
  password: string;
  scope: string;
  additionalHeaders: Record<string, string>;
  additionalParams: Record<string, string>;
}

interface TokenResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  executionTime: number;
}

export const TokenGenerator: React.FC<TokenGeneratorProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'jwt' | 'api-key' | 'custom'>('oauth');
  const [curlConfig, setCurlConfig] = useState<CurlConfig>({
    url: 'https://auth.example.com/oauth/token',
    method: 'POST',
    clientId: 'your_client_id',
    clientSecret: 'your_client_secret',
    resourceId: 'your_resource_id',
    grantType: 'password',
    username: 'user@example.com',
    password: 'password123',
    scope: 'read write',
    additionalHeaders: {},
    additionalParams: {}
  });
  const [generatedCurl, setGeneratedCurl] = useState<string>('');
  const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [jwtPayload, setJwtPayload] = useState<string>('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [jwtSecret, setJwtSecret] = useState<string>('your-256-bit-secret');
  const [apiKeyLength, setApiKeyLength] = useState<number>(32);
  const [apiKeyPrefix, setApiKeyPrefix] = useState<string>('ak_');
  const [customTokenLength, setCustomTokenLength] = useState<number>(64);
  const [customTokenChars, setCustomTokenChars] = useState<string>('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const grantTypes = [
    { value: 'password', label: 'Resource Owner Password' },
    { value: 'client_credentials', label: 'Client Credentials' },
    { value: 'authorization_code', label: 'Authorization Code' },
    { value: 'refresh_token', label: 'Refresh Token' }
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processUploadedFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    try {
      const content = await file.text();
      
      // Try to parse as CURL command and extract configuration
      if (content.includes('curl')) {
        parseCurlCommand(content);
      } else {
        // If it's not a curl command, just set it as the generated curl
        setGeneratedCurl(content);
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const parseCurlCommand = (curlCommand: string) => {
    try {
      // Extract URL
      const urlMatch = curlCommand.match(/curl\s+(?:-X\s+\w+\s+)?"([^"]+)"/);
      if (urlMatch) {
        setCurlConfig(prev => ({ ...prev, url: urlMatch[1] }));
      }

      // Extract method
      const methodMatch = curlCommand.match(/-X\s+(\w+)/);
      if (methodMatch) {
        setCurlConfig(prev => ({ ...prev, method: methodMatch[1] }));
      }

      // Extract data parameters
      const dataMatch = curlCommand.match(/-d\s+"([^"]+)"/);
      if (dataMatch) {
        const params = new URLSearchParams(dataMatch[1]);
        const updates: Partial<CurlConfig> = {};
        
        if (params.get('client_id')) updates.clientId = params.get('client_id')!;
        if (params.get('client_secret')) updates.clientSecret = params.get('client_secret')!;
        if (params.get('grant_type')) updates.grantType = params.get('grant_type')!;
        if (params.get('username')) updates.username = params.get('username')!;
        if (params.get('password')) updates.password = params.get('password')!;
        if (params.get('scope')) updates.scope = params.get('scope')!;
        if (params.get('resource')) updates.resourceId = params.get('resource')!;
        
        setCurlConfig(prev => ({ ...prev, ...updates }));
      }

      // Set the original curl command
      setGeneratedCurl(curlCommand);
    } catch (error) {
      console.error('Error parsing CURL command:', error);
      setGeneratedCurl(curlCommand);
    }
  };

  const generateOAuthCurl = () => {
    let curlCommand = `curl -X ${curlConfig.method} "${curlConfig.url}" \\\n`;
    
    // Headers
    curlCommand += `  -H "Content-Type: application/x-www-form-urlencoded" \\\n`;
    Object.entries(curlConfig.additionalHeaders).forEach(([key, value]) => {
      if (key && value) {
        curlCommand += `  -H "${key}: ${value}" \\\n`;
      }
    });
    
    // Data
    const dataParams: string[] = [];
    dataParams.push(`grant_type=${encodeURIComponent(curlConfig.grantType)}`);
    dataParams.push(`client_id=${encodeURIComponent(curlConfig.clientId)}`);
    dataParams.push(`client_secret=${encodeURIComponent(curlConfig.clientSecret)}`);
    
    if (curlConfig.grantType === 'password') {
      dataParams.push(`username=${encodeURIComponent(curlConfig.username)}`);
      dataParams.push(`password=${encodeURIComponent(curlConfig.password)}`);
    }
    
    if (curlConfig.resourceId) {
      dataParams.push(`resource=${encodeURIComponent(curlConfig.resourceId)}`);
    }
    
    if (curlConfig.scope) {
      dataParams.push(`scope=${encodeURIComponent(curlConfig.scope)}`);
    }
    
    Object.entries(curlConfig.additionalParams).forEach(([key, value]) => {
      if (key && value) {
        dataParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });
    
    curlCommand += `  -d "${dataParams.join('&')}"`;
    
    setGeneratedCurl(curlCommand);
  };

  const generateJWT = () => {
    try {
      // This is a simplified JWT generation for demonstration
      // In production, use a proper JWT library
      const header = {
        "alg": "HS256",
        "typ": "JWT"
      };
      
      const payload = JSON.parse(jwtPayload);
      
      const base64Header = btoa(JSON.stringify(header)).replace(/=/g, '');
      const base64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '');
      
      // Simplified signature (not cryptographically secure)
      const signature = btoa(`${base64Header}.${base64Payload}.${jwtSecret}`).replace(/=/g, '').substring(0, 43);
      
      const jwt = `${base64Header}.${base64Payload}.${signature}`;
      setGeneratedToken(jwt);
    } catch (error) {
      setGeneratedToken('Invalid JSON payload');
    }
  
  };

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = apiKeyPrefix;
    
    for (let i = 0; i < apiKeyLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setGeneratedToken(result);
  };

  const generateCustomToken = () => {
    let result = '';
    
    for (let i = 0; i < customTokenLength; i++) {
      result += customTokenChars.charAt(Math.floor(Math.random() * customTokenChars.length));
    }
    
    setGeneratedToken(result);
  };

  const loadSampleCurl = (type: string) => {
    switch (type) {
      case 'ida':
        setCurlConfig({
          ...curlConfig,
          url: 'https://ida.jpmorgan.com/oauth/token',
          grantType: 'authorization_code',
          clientId: 'your_ida_client_id',
          clientSecret: 'your_ida_client_secret',
          scope: 'openid profile email'
        });
        break;
      case 'sentry':
        setCurlConfig({
          ...curlConfig,
          url: 'https://sentry.io/api/0/organizations/{org}/projects/{project}/keys/',
          grantType: 'client_credentials',
          clientId: 'your_sentry_client_id',
          clientSecret: 'your_sentry_client_secret',
          scope: 'project:read project:write'
        });
        break;
    }
  };

  const addHeader = () => {
    const key = prompt('Header name:');
    const value = prompt('Header value:');
    if (key && value) {
      setCurlConfig({
        ...curlConfig,
        additionalHeaders: { ...curlConfig.additionalHeaders, [key]: value }
      });
    }
  };

  const addParam = () => {
    const key = prompt('Parameter name:');
    const value = prompt('Parameter value:');
    if (key && value) {
      setCurlConfig({
        ...curlConfig,
        additionalParams: { ...curlConfig.additionalParams, [key]: value }
      });
    }
  };

  const removeHeader = (key: string) => {
    const { [key]: removed, ...rest } = curlConfig.additionalHeaders;
    setCurlConfig({ ...curlConfig, additionalHeaders: rest });
  };

  const removeParam = (key: string) => {
    const { [key]: removed, ...rest } = curlConfig.additionalParams;
    setCurlConfig({ ...curlConfig, additionalParams: rest });
  };

  const executeCurl = async () => {
    if (!generatedCurl) return;
    
    setIsExecuting(true);
    const startTime = Date.now();
    
    try {
      // Simulate API call with random delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Generate mock response based on grant type
      const mockResponse = generateMockTokenResponse();
      
      setTokenResult({
        success: true,
        data: mockResponse,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      });
    } catch (error) {
      setTokenResult({
        success: false,
        error: 'Failed to execute CURL command',
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const generateMockTokenResponse = () => {
    const baseResponse = {
      access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({
        sub: "1234567890",
        name: "John Doe",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      })).replace(/=/g, '')}.signature`,
      token_type: "Bearer",
      expires_in: 3600,
      scope: curlConfig.scope || "read write"
    };

    if (curlConfig.grantType === 'authorization_code' || curlConfig.grantType === 'password') {
      return {
        ...baseResponse,
        refresh_token: `rt_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      };
    }

    return baseResponse;
  };

  React.useEffect(() => {
    if (activeTab === 'oauth') {
      generateOAuthCurl();
    }
  }, [curlConfig, activeTab]);

  const handleCopy = async () => {
    let content = '';
    
    if (activeTab === 'oauth') {
      if (tokenResult && tokenResult.success) {
        content = JSON.stringify(tokenResult.data, null, 2);
      } else {
        content = generatedCurl;
      }
    } else {
      content = generatedToken;
    }
    
    if (content) {
      const success = await copyToClipboard(content);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownload = () => {
    let content = '';
    let filename = '';
    
    if (activeTab === 'oauth') {
      if (tokenResult && tokenResult.success) {
        content = JSON.stringify(tokenResult, null, 2);
        filename = 'token-response.json';
      } else {
        content = generatedCurl;
        filename = 'oauth-curl.sh';
      }
    } else {
      content = generatedToken;
      filename = `${activeTab}-token.txt`;
    }
    
    if (content) {
      downloadFile(content, filename);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
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
          <h1 className="text-2xl font-bold text-gray-900">Token Generator</h1>
          <div className="flex space-x-2">
            {activeTab === 'oauth' && (
              <button
                onClick={executeCurl}
                disabled={!generatedCurl || isExecuting}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isExecuting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Execute</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleCopy}
              disabled={!generatedCurl && !generatedToken && !tokenResult}
              className="flex items-center space-x-2 px-4 py-2 bg-jpmorgan-blue-600 hover:bg-jpmorgan-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!generatedCurl && !generatedToken && !tokenResult}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'oauth'
                ? 'bg-jpmorgan-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            OAuth/CURL
          </button>
          <button
            onClick={() => setActiveTab('jwt')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'jwt'
                ? 'bg-jpmorgan-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            JWT Token
          </button>
          <button
            onClick={() => setActiveTab('api-key')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'api-key'
                ? 'bg-jpmorgan-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            API Key
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'custom'
                ? 'bg-jpmorgan-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Custom Token
          </button>
        </div>

        {/* OAuth/CURL Tab */}
        {activeTab === 'oauth' && (
          <div className="space-y-6">
            {/* File Upload Section */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-jpmorgan-blue-400 bg-jpmorgan-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 font-semibold mb-2">Upload CURL Command File</h3>
              <p className="text-gray-600 mb-4">
                Drag and drop a text file containing CURL command, or click to browse
              </p>
              <input
                type="file"
                accept=".txt,.sh,.curl"
                onChange={handleFileSelect}
                className="hidden"
                id="curl-file-upload"
              />
              <label
                htmlFor="curl-file-upload"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-jpmorgan-blue-600 hover:bg-jpmorgan-blue-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Choose File</span>
              </label>
            </div>

            {/* Sample Templates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Templates</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadSampleCurl('ida')}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                >
                  IDA Auth
                </button>
                <button
                  onClick={() => loadSampleCurl('sentry')}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                >
                  Sentry Token
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">OAuth Configuration</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                    <select
                      value={curlConfig.method}
                      onChange={(e) => setCurlConfig({ ...curlConfig, method: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grant Type</label>
                    <select
                      value={curlConfig.grantType}
                      onChange={(e) => setCurlConfig({ ...curlConfig, grantType: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                    >
                      {grantTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token URL</label>
                  <input
                    type="text"
                    value={curlConfig.url}
                    onChange={(e) => setCurlConfig({ ...curlConfig, url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                    <input
                      type="text"
                      value={curlConfig.clientId}
                      onChange={(e) => setCurlConfig({ ...curlConfig, clientId: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={curlConfig.clientSecret}
                      onChange={(e) => setCurlConfig({ ...curlConfig, clientSecret: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                    />
                  </div>
                </div>

                {curlConfig.grantType === 'password' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={curlConfig.username}
                        onChange={(e) => setCurlConfig({ ...curlConfig, username: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={curlConfig.password}
                        onChange={(e) => setCurlConfig({ ...curlConfig, password: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
                    <input
                      type="text"
                      value={curlConfig.resourceId}
                      onChange={(e) => setCurlConfig({ ...curlConfig, resourceId: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                    <input
                      type="text"
                      value={curlConfig.scope}
                      onChange={(e) => setCurlConfig({ ...curlConfig, scope: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                    />
                  </div>
                </div>

                {/* Additional Headers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Additional Headers</label>
                    <button
                      onClick={addHeader}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                    >
                      Add Header
                    </button>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(curlConfig.additionalHeaders).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <span className="text-gray-700 text-sm flex-1">{key}: {value}</span>
                        <button
                          onClick={() => removeHeader(key)}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Parameters */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Additional Parameters</label>
                    <button
                      onClick={addParam}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                    >
                      Add Parameter
                    </button>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(curlConfig.additionalParams).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <span className="text-gray-700 text-sm flex-1">{key}: {value}</span>
                        <button
                          onClick={() => removeParam(key)}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generated CURL */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated CURL Command</h3>
                <textarea
                  value={generatedCurl}
                  onChange={(e) => setGeneratedCurl(e.target.value)}
                  className="w-full h-96 p-4 bg-gray-50 border border-gray-300 rounded-lg text-green-600 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                  placeholder="Generated CURL command will appear here..."
                />
              </div>

              {/* Token Result */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Response</h3>
                <div className="h-96 bg-gray-50 border border-gray-300 rounded-lg p-4 overflow-auto">
                  {tokenResult ? (
                    <div className="space-y-4">
                      {/* Status Header */}
                      <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                        tokenResult.success 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          tokenResult.success ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={`font-semibold ${
                          tokenResult.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {tokenResult.success ? 'Success' : 'Error'}
                        </span>
                        <span className="text-gray-600 text-sm">
                          ({tokenResult.executionTime}ms)
                        </span>
                      </div>

                      {/* Response Data */}
                      {tokenResult.success && tokenResult.data ? (
                        <div>
                          <h4 className="text-gray-900 font-medium mb-2">Access Token:</h4>
                          <div className="bg-gray-100 rounded p-3 mb-3">
                            <code className="text-yellow-600 font-mono text-xs break-all">
                              {tokenResult.data.access_token}
                            </code>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-700">Token Type:</span>
                              <span className="text-gray-900 ml-2">{tokenResult.data.token_type}</span>
                            </div>
                            <div>
                              <span className="text-gray-700">Expires In:</span>
                              <span className="text-gray-900 ml-2">{tokenResult.data.expires_in}s</span>
                            </div>
                            {tokenResult.data.refresh_token && (
                              <div className="col-span-2">
                                <span className="text-gray-700">Refresh Token:</span>
                                <div className="bg-gray-100 rounded p-2 mt-1">
                                  <code className="text-cyan-600 font-mono text-xs break-all">
                                    {tokenResult.data.refresh_token}
                                  </code>
                                </div>
                              </div>
                            )}
                            <div className="col-span-2">
                              <span className="text-gray-700">Scope:</span>
                              <span className="text-gray-900 ml-2">{tokenResult.data.scope}</span>
                            </div>
                          </div>
                        </div>
                      ) : tokenResult.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-700 font-medium">Error</span>
                          </div>
                          <p className="text-red-600 mt-2">{tokenResult.error}</p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
                        Executed at: {new Date(tokenResult.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Execute CURL command to see token response</p>
                        <p className="text-sm mt-1">Click the Execute button above</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JWT Token Tab */}
        {activeTab === 'jwt' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">JWT Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payload (JSON)</label>
                  <textarea
                    value={jwtPayload}
                    onChange={(e) => setJwtPayload(e.target.value)}
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                  <input
                    type="text"
                    value={jwtSecret}
                    onChange={(e) => setJwtSecret(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                  />
                </div>

                <button
                  onClick={generateJWT}
                  className="w-full px-4 py-2 bg-jpmorgan-blue-600 hover:bg-jpmorgan-blue-700 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  Generate JWT Token
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated JWT</h3>
                <textarea
                  value={generatedToken}
                  readOnly
                  placeholder="JWT token will appear here..."
                  className="w-full h-48 p-4 bg-gray-50 border border-gray-300 rounded-lg text-yellow-600 font-mono text-sm resize-none focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* API Key Tab */}
        {activeTab === 'api-key' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">API Key Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Length: {apiKeyLength}
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="128"
                    value={apiKeyLength}
                    onChange={(e) => setApiKeyLength(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>16</span>
                    <span>128</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prefix</label>
                  <input
                    type="text"
                    value={apiKeyPrefix}
                    onChange={(e) => setApiKeyPrefix(e.target.value)}
                    placeholder="ak_"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                  />
                </div>

                <button
                  onClick={generateApiKey}
                  className="w-full px-4 py-2 bg-jpmorgan-blue-600 hover:bg-jpmorgan-blue-700 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  <Key className="h-4 w-4 inline mr-2" />
                  Generate API Key
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated API Key</h3>
                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <code className="text-cyan-600 font-mono text-sm break-all">
                    {generatedToken || 'Click generate to create an API key'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Token Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Custom Token Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Length: {customTokenLength}
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="256"
                    value={customTokenLength}
                    onChange={(e) => setCustomTokenLength(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>8</span>
                    <span>256</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Character Set</label>
                  <textarea
                    value={customTokenChars}
                    onChange={(e) => setCustomTokenChars(e.target.value)}
                    className="w-full h-24 p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available characters: {customTokenChars.length}
                  </p>
                </div>

                <button
                  onClick={generateCustomToken}
                  className="w-full px-4 py-2 bg-jpmorgan-blue-600 hover:bg-jpmorgan-blue-700 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  <RefreshCw className="h-4 w-4 inline mr-2" />
                  Generate Custom Token
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Token</h3>
                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <code className="text-purple-600 font-mono text-sm break-all">
                    {generatedToken || 'Click generate to create a custom token'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-4 bg-jpmorgan-blue-50 border border-jpmorgan-blue-200 rounded-lg">
          <h4 className="text-gray-900 font-semibold mb-2">Token Generator Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
            <div>
              <h5 className="font-medium text-gray-900 mb-1">OAuth/CURL:</h5>
              <ul className="space-y-1">
                <li>• Multiple grant types</li>
                <li>• Custom headers/params</li>
                <li>• Ready-to-use commands</li>
                <li>• File upload support</li>
                <li>• Execute functionality</li>
                <li>• Token response display</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-1">JWT Tokens:</h5>
              <ul className="space-y-1">
                <li>• Custom payload</li>
                <li>• HS256 algorithm</li>
                <li>• Secret key configuration</li>
                <li>• Standard JWT format</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-1">API Keys:</h5>
              <ul className="space-y-1">
                <li>• Configurable length</li>
                <li>• Custom prefixes</li>
                <li>• Secure generation</li>
                <li>• Industry standards</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-1">Custom Tokens:</h5>
              <ul className="space-y-1">
                <li>• Custom character sets</li>
                <li>• Variable length</li>
                <li>• Flexible generation</li>
                <li>• Special use cases</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
