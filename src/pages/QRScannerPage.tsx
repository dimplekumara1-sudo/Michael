import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

const QRScannerPage = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanning = () => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

html5QrcodeScanner.render(
  (decodedText: string) => {
        setScanResult(decodedText);
        setIsScanning(false);
        html5QrcodeScanner.clear();
      },
      (error) => {
        console.warn(`QR Code scan error: ${error}`);
      }
    );

    setScanner(html5QrcodeScanner);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    Html5Qrcode.scanFile(file, true)
      .then((decodedText: string) => {
        setScanResult(decodedText);
        setError(null);
      })
      .catch((err: any) => {
        setError('Could not read QR code from image. Please try again.');
        console.error('QR scan error:', err);
      });
  };

  const isGalleryLink = (url: string) => {
    return url.includes('eventsnap.com/gallery/') || 
           url.includes('gallery') || 
           url.includes('mega.nz/folder/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-4 rounded-full">
                <QrCode className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Scanner</h1>
            <p className="text-gray-600">
              Scan a QR code to access your private gallery or booking information
            </p>
          </div>

          {!scanResult && !isScanning && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={startScanning}
                  className="flex items-center justify-center space-x-3 bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-6 w-6" />
                  <span className="font-semibold">Scan with Camera</span>
                </button>

                <label className="flex items-center justify-center space-x-3 bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition-colors cursor-pointer">
                  <Upload className="h-6 w-6" />
                  <span className="font-semibold">Upload QR Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">How to use:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Click "Scan with Camera" to use your device's camera</li>
                  <li>Point your camera at the QR code until it's recognized</li>
                  <li>Or upload a saved QR code image from your device</li>
                  <li>You'll be automatically redirected to your gallery or booking</li>
                </ol>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Scanning QR Code...</h3>
                <button
                  onClick={stopScanning}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="bg-black rounded-lg overflow-hidden">
                <div id="reader" className="w-full"></div>
              </div>

              <p className="text-center text-gray-600">
                Position the QR code within the scanning area above
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Scan Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setScanResult(null);
                }}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {scanResult && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-2">QR Code Scanned Successfully!</h3>
                    <div className="bg-white rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600 mb-1">Detected content:</p>
                      <p className="font-mono text-sm text-gray-900 break-all">{scanResult}</p>
                    </div>

                    {isGalleryLink(scanResult) ? (
                      <div className="space-y-3">
                        <p className="text-green-700">
                          This appears to be a gallery access link. Click below to view your photos!
                        </p>
                        <a
                          href={scanResult}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Camera className="h-5 w-5" />
                          <span>View Gallery</span>
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-green-700">
                          QR code content detected. This might be a URL or other information.
                        </p>
                        {scanResult.startsWith('http') && (
                          <a
                            href={scanResult}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <QrCode className="h-5 w-5" />
                            <span>Open Link</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setScanResult(null);
                  setError(null);
                }}
                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Scan Another QR Code
              </button>
            </div>
          )}

          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Need help?</h3>
            <p className="text-blue-800 text-sm mb-3">
              If you're having trouble scanning your QR code:
            </p>
            <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
              <li>Make sure your camera has good lighting</li>
              <li>Hold your device steady and at the right distance</li>
              <li>Try uploading a photo of the QR code instead</li>
              <li>Contact support if you continue having issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
