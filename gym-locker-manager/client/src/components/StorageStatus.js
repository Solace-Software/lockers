import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const StorageStatus = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get('/api/status');
        setStorageInfo(response.data.storage);
        setIsVisible(true);
      } catch (error) {
        console.error('Failed to fetch storage status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!storageInfo || !isVisible) return null;

  const isMemory = storageInfo.type === 'memory';
  const isUnknown = storageInfo.type === 'unknown';

  const IconComponent = isMemory || isUnknown ? AlertTriangle : Database;

  return (
    <div 
      className={`status-indicator ${
        isMemory ? 'status-indicator-warning' :
        isUnknown ? 'status-indicator-error' :
        'status-indicator-success'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 p-2 rounded-lg ${
          isMemory ? 'bg-app-status-warning-bg' :
          isUnknown ? 'bg-app-status-error-bg' :
          'bg-app-status-success-bg'
        }`}>
          <IconComponent 
            className={`w-5 h-5 ${
              isMemory ? 'text-app-status-warning-icon' :
              isUnknown ? 'text-app-status-error-icon' :
              'text-app-status-success-icon'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="status-title">
            {isMemory ? 'In-Memory Storage' :
             isUnknown ? 'Storage Initializing' :
             'Database Storage'}
          </h3>
          <p className="status-message mt-1">
            {isMemory ? (
              <>
                Running in temporary storage mode. Data will be lost when the server restarts.
                <span className="block mt-1 opacity-90">
                  Reason: {storageInfo.details?.reason || 'Unknown'}
                </span>
              </>
            ) : isUnknown ? (
              <>
                Storage system is currently initializing.
                <span className="block mt-1 opacity-90">
                  {storageInfo.details?.reason || 'Please wait...'}
                </span>
              </>
            ) : (
              <>
                Connected to {storageInfo.details?.database} on {storageInfo.details?.host}
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 p-1.5 hover:bg-app-interactive-hover rounded-lg transition-colors duration-200"
          aria-label="Dismiss"
        >
          <svg 
            className={`w-4 h-4 ${
              isMemory ? 'text-app-status-warning-text' :
              isUnknown ? 'text-app-status-error-text' :
              'text-app-status-success-text'
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default StorageStatus;