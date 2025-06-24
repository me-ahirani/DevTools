import React, { useState, useEffect } from 'react';
import { RefreshCw as Refresh, Copy, Check, ArrowLeft, Eye, EyeOff, Settings } from 'lucide-react';
import { copyToClipboard } from '../../utils/fileUtils';

interface PasswordGeneratorProps {
  onBack: () => void;
}

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customCharacters: string;
  useCustomOnly: boolean;
  minUppercase: number;
  minLowercase: number;
  minNumbers: number;
  minSymbols: number;
  noRepeating: boolean;
  noSequential: boolean;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onBack }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
    customCharacters: '',
    useCustomOnly: false,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    noRepeating: false,
    noSequential: false
  });

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const similarChars = 'il1Lo0O';
    const ambiguousChars = '{}[]()/\\\'"`~,;.<>';

    let charset = '';
    let requiredChars = '';

    if (options.useCustomOnly && options.customCharacters) {
      charset = options.customCharacters;
    } else {
      if (options.includeUppercase) {
        let upperChars = uppercase;
        if (options.excludeSimilar) {
          upperChars = upperChars.replace(/[IL]/g, '');
        }
        charset += upperChars;
        requiredChars += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
      }

      if (options.includeLowercase) {
        let lowerChars = lowercase;
        if (options.excludeSimilar) {
          lowerChars = lowerChars.replace(/[il]/g, '');
        }
        charset += lowerChars;
        requiredChars += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
      }

      if (options.includeNumbers) {
        let numberChars = numbers;
        if (options.excludeSimilar) {
          numberChars = numberChars.replace(/[10]/g, '');
        }
        charset += numberChars;
        requiredChars += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
      }

      if (options.includeSymbols) {
        let symbolChars = symbols;
        if (options.excludeAmbiguous) {
          symbolChars = symbolChars.replace(/[{}[\]()/\\'"`,;.<>]/g, '');
        }
        charset += symbolChars;
        requiredChars += symbolChars.charAt(Math.floor(Math.random() * symbolChars.length));
      }

      if (options.customCharacters && !options.useCustomOnly) {
        charset += options.customCharacters;
      }
    }

    if (charset === '') {
      setPassword('');
      setValidationErrors(['No character types selected']);
      return;
    }

    let result = '';
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      result = '';
      
      // Add required characters first
      if (!options.useCustomOnly) {
        result += requiredChars;
      }

      // Fill the rest randomly
      for (let i = result.length; i < options.length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      // Shuffle the result
      result = result.split('').sort(() => Math.random() - 0.5).join('');

      // Validate the password
      const errors = validatePassword(result);
      if (errors.length === 0) {
        break;
      }
      
      attempts++;
    }

    if (attempts >= maxAttempts) {
      setValidationErrors(['Could not generate password meeting all criteria. Try relaxing some constraints.']);
    } else {
      setValidationErrors([]);
    }

    setPassword(result);
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];

    if (!options.useCustomOnly) {
      // Check minimum requirements
      if (options.includeUppercase && options.minUppercase > 0) {
        const uppercaseCount = (pwd.match(/[A-Z]/g) || []).length;
        if (uppercaseCount < options.minUppercase) {
          errors.push(`Needs at least ${options.minUppercase} uppercase letter(s)`);
        }
      }

      if (options.includeLowercase && options.minLowercase > 0) {
        const lowercaseCount = (pwd.match(/[a-z]/g) || []).length;
        if (lowercaseCount < options.minLowercase) {
          errors.push(`Needs at least ${options.minLowercase} lowercase letter(s)`);
        }
      }

      if (options.includeNumbers && options.minNumbers > 0) {
        const numberCount = (pwd.match(/[0-9]/g) || []).length;
        if (numberCount < options.minNumbers) {
          errors.push(`Needs at least ${options.minNumbers} number(s)`);
        }
      }

      if (options.includeSymbols && options.minSymbols > 0) {
        const symbolCount = (pwd.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) || []).length;
        if (symbolCount < options.minSymbols) {
          errors.push(`Needs at least ${options.minSymbols} symbol(s)`);
        }
      }
    }

    // Check no repeating characters
    if (options.noRepeating) {
      for (let i = 0; i < pwd.length - 1; i++) {
        if (pwd[i] === pwd[i + 1]) {
          errors.push('Contains repeating characters');
          break;
        }
      }
    }

    // Check no sequential characters
    if (options.noSequential) {
      for (let i = 0; i < pwd.length - 2; i++) {
        const char1 = pwd.charCodeAt(i);
        const char2 = pwd.charCodeAt(i + 1);
        const char3 = pwd.charCodeAt(i + 2);
        
        if ((char2 === char1 + 1 && char3 === char2 + 1) || 
            (char2 === char1 - 1 && char3 === char2 - 1)) {
          errors.push('Contains sequential characters');
          break;
        }
      }
    }

    return errors;
  };

  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (pwd.length >= 20) score++;

    if (score < 3) return { text: 'Weak', color: 'bg-red-500', level: 1 };
    if (score < 5) return { text: 'Fair', color: 'bg-yellow-500', level: 2 };
    if (score < 7) return { text: 'Good', color: 'bg-blue-500', level: 3 };
    if (score < 8) return { text: 'Strong', color: 'bg-green-500', level: 4 };
    return { text: 'Very Strong', color: 'bg-green-600', level: 5 };
  };

  const updateOption = (key: keyof PasswordOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    generatePassword();
  }, [options]);

  const handleCopy = async () => {
    if (password) {
      const success = await copyToClipboard(password);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const strength = getStrength(password);

  const loadPreset = (preset: string) => {
    switch (preset) {
      case 'basic':
        setOptions({
          ...options,
          length: 12,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: false,
          excludeSimilar: false,
          excludeAmbiguous: false,
          minUppercase: 1,
          minLowercase: 1,
          minNumbers: 1,
          minSymbols: 0,
          noRepeating: false,
          noSequential: false
        });
        break;
      case 'secure':
        setOptions({
          ...options,
          length: 16,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: true,
          excludeSimilar: true,
          excludeAmbiguous: true,
          minUppercase: 2,
          minLowercase: 2,
          minNumbers: 2,
          minSymbols: 2,
          noRepeating: true,
          noSequential: true
        });
        break;
      case 'pin':
        setOptions({
          ...options,
          length: 6,
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: true,
          includeSymbols: false,
          excludeSimilar: false,
          excludeAmbiguous: false,
          minNumbers: 6,
          noRepeating: false,
          noSequential: false
        });
        break;
      case 'memorable':
        setOptions({
          ...options,
          length: 14,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: false,
          excludeSimilar: true,
          excludeAmbiguous: false,
          minUppercase: 2,
          minLowercase: 4,
          minNumbers: 2,
          minSymbols: 0,
          noRepeating: false,
          noSequential: true
        });
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Advanced Password Generator</h1>

        {/* Presets */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Presets</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadPreset('basic')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Basic (12 chars)
            </button>
            <button
              onClick={() => loadPreset('secure')}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              Secure (16 chars)
            </button>
            <button
              onClick={() => loadPreset('pin')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              PIN (6 digits)
            </button>
            <button
              onClick={() => loadPreset('memorable')}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
            >
              Memorable (14 chars)
            </button>
          </div>
        </div>

        {/* Generated Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Generated Password
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                readOnly
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono text-lg focus:outline-none"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-4 py-3 bg-jpmorgan-blue-600 hover:bg-jpmorgan-blue-700 text-white rounded-lg transition-colors"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
            <button
              onClick={generatePassword}
              className="flex items-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Refresh className="h-5 w-5" />
            </button>
          </div>
          
          {/* Strength Indicator */}
          <div className="mt-3 flex items-center space-x-3">
            <span className="text-sm text-gray-700">Strength:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-6 h-2 rounded-full ${
                    level <= strength.level ? strength.color : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className={`text-sm font-medium ${
              strength.text === 'Weak' ? 'text-red-600' :
              strength.text === 'Fair' ? 'text-yellow-600' :
              strength.text === 'Good' ? 'text-blue-600' :
              'text-green-600'
            }`}>
              {strength.text}
            </span>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <ul className="text-red-700 text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Basic Options</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Length: {options.length}
              </label>
              <input
                type="range"
                min="4"
                max="128"
                value={options.length}
                onChange={(e) => updateOption('length', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>4</span>
                <span>128</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={(e) => updateOption('includeUppercase', e.target.checked)}
                  className="w-4 h-4 text-jpmorgan-blue-600 bg-white border-gray-300 rounded focus:ring-jpmorgan-blue-500"
                />
                <span className="text-gray-700">Uppercase (A-Z)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={(e) => updateOption('includeLowercase', e.target.checked)}
                  className="w-4 h-4 text-jpmorgan-blue-600 bg-white border-gray-300 rounded focus:ring-jpmorgan-blue-500"
                />
                <span className="text-gray-700">Lowercase (a-z)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={(e) => updateOption('includeNumbers', e.target.checked)}
                  className="w-4 h-4 text-jpmorgan-blue-600 bg-white border-gray-300 rounded focus:ring-jpmorgan-blue-500"
                />
                <span className="text-gray-700">Numbers (0-9)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={(e) => updateOption('includeSymbols', e.target.checked)}
                  className="w-4 h-4 text-jpmorgan-blue-600 bg-white border-gray-300 rounded focus:ring-jpmorgan-blue-500"
                />
                <span className="text-gray-700">Symbols (!@#$%)</span>
              </label>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.excludeSimilar}
                  onChange={(e) => updateOption('excludeSimilar', e.target.checked)}
                  className="w-4 h-4 text-jpmorgan-blue-600 bg-white border-gray-300 rounded focus:ring-jpmorgan-blue-500"
                />
                <span className="text-gray-700">Exclude similar characters (il1Lo0O)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.excludeAmbiguous}
                  onChange={(e) => updateOption('excludeAmbiguous', e.target.checked)}
                  className="w-4 h-4 text-jpmorgan-blue-600 bg-white border-gray-300 rounded focus:ring-jpmorgan-blue-500"
                />
                <span className="text-gray-700">Exclude ambiguous symbols ({}[]())</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.noRepeating}
                  onChange={(e) => updateOption('noRepeating', e.target.checked)}
                  className="w-4 h-4 text-jpmorgan-blue-600 bg-white border-gray-300 rounded focus:ring-jpmorgan-blue-500"
                />
                <span className="text-gray-700">No repeating characters</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.noSequential}
                  onChange={(e) => updateOption('noSequential', e.target.checked)}
                  className="w-4 h-4 text-jpmorgan-blue-600 bg-white border-gray-300 rounded focus:ring-jpmorgan-blue-500"
                />
                <span className="text-gray-700">No sequential characters (abc, 123)</span>
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>

            {!options.useCustomOnly && (
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-900">Minimum Requirements</h4>
                
                {options.includeUppercase && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Min Uppercase: {options.minUppercase}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={options.minUppercase}
                      onChange={(e) => updateOption('minUppercase', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}

                {options.includeLowercase && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Min Lowercase: {options.minLowercase}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={options.minLowercase}
                      onChange={(e) => updateOption('minLowercase', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}

                {options.includeNumbers && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Min Numbers: {options.minNumbers}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={options.minNumbers}
                      onChange={(e) => updateOption('minNumbers', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}

                {options.includeSymbols && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Min Symbols: {options.minSymbols}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={options.minSymbols}
                      onChange={(e) => updateOption('minSymbols', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-900">Custom Characters</h4>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.useCustomOnly}
                  onChange={(e) => updateOption('useCustomOnly', e.target.checked)}
                  className="w-4 h-4 text-jpmorgan-blue-600 bg-white border-gray-300 rounded focus:ring-jpmorgan-blue-500"
                />
                <span className="text-gray-700">Use only custom characters</span>
              </label>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Custom Character Set
                </label>
                <textarea
                  value={options.customCharacters}
                  onChange={(e) => updateOption('customCharacters', e.target.value)}
                  placeholder="Enter custom characters..."
                  className="w-full h-20 p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {options.customCharacters.length} characters available
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Password Analysis */}
        {password && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-gray-900 font-semibold mb-3">Password Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-700">Length:</span>
                <span className="text-gray-900 ml-2 font-mono">{password.length}</span>
              </div>
              <div>
                <span className="text-gray-700">Uppercase:</span>
                <span className="text-gray-900 ml-2 font-mono">{(password.match(/[A-Z]/g) || []).length}</span>
              </div>
              <div>
                <span className="text-gray-700">Lowercase:</span>
                <span className="text-gray-900 ml-2 font-mono">{(password.match(/[a-z]/g) || []).length}</span>
              </div>
              <div>
                <span className="text-gray-700">Numbers:</span>
                <span className="text-gray-900 ml-2 font-mono">{(password.match(/[0-9]/g) || []).length}</span>
              </div>
              <div>
                <span className="text-gray-700">Symbols:</span>
                <span className="text-gray-900 ml-2 font-mono">{(password.match(/[^A-Za-z0-9]/g) || []).length}</span>
              </div>
              <div>
                <span className="text-gray-700">Unique chars:</span>
                <span className="text-gray-900 ml-2 font-mono">{new Set(password).size}</span>
              </div>
              <div>
                <span className="text-gray-700">Entropy:</span>
                <span className="text-gray-900 ml-2 font-mono">{Math.round(password.length * Math.log2(new Set(password).size))} bits</span>
              </div>
              <div>
                <span className="text-gray-700">Time to crack:</span>
                <span className="text-gray-900 ml-2 font-mono">
                  {password.length > 12 ? '> 1000 years' : password.length > 8 ? '> 100 years' : '< 1 year'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
