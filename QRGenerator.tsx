import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/fileUtils';
import QRCode from 'qrcode';

interface QRGeneratorProps {
  onBack: () => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ onBack }) => {
  const [text, setText] = useState('');
  const [qrDataURL, setQrDataURL] = useState('');
  const [size, setSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateQR = async (input: string, qrSize: number) => {
    if (!input.trim()) {
      setQrDataURL('');
      setError('');
      return;
    }

    try {
      const dataURL = await QRCode.toDataURL(input, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataURL(dataURL);
      setError('');
    } catch (err) {
      setError('Failed to generate QR code');
      setQrDataURL('');
    }
  };

  useEffect(() => {
    generateQR(text, size);
  }, [text, size]);

  const handleDownload = () => {
    if (qrDataURL) {
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = qrDataURL;
      link.click();
    }
  };

  const handleCopyImage = async () => {
    if (qrDataURL) {
      try {
        const response = await fetch(qrDataURL);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy image:', err);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">QR Code Generator</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text or URL
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text or URL to generate QR code..."
              className="w-full h-24 p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-jpmorgan-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size: {size}px
            </label>
            <input
              type="range"
              min="128"
              max="512"
              step="32"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>128px</span>
              <span>512px</span>
            </div>
          </div>

          {qrDataURL && (
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg border border-gray-200">
                <img
                  src={qrDataURL}
                  alt="Generated QR Code"
                  className="block mx-auto"
                  style={{ width: size, height: size }}
                />
              </div>
              
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={handleCopyImage}
                  className="flex items-center space-x-2 px-4 py-2 bg-jpmorgan-blue-600 hover:bg-jpmorgan-blue-700 text-white rounded-lg transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Image'}</span>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {!qrDataURL && !error && text.trim() === '' && (
            <div className="text-center py-12 text-gray-500">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-4xl">📱</span>
              </div>
              <p>Enter text or URL above to generate QR code</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-jpmorgan-blue-50 border border-jpmorgan-blue-200 rounded-lg">
          <h3 className="text-gray-900 font-semibold mb-2">QR Code Uses</h3>
          <ul className="text-gray-700 text-sm space-y-1">
            <li>• Share URLs and website links</li>
            <li>• Store contact information (vCard)</li>
            <li>• WiFi network credentials</li>
            <li>• Payment information</li>
            <li>• Event details and calendar entries</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
