import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Database, Radio, Save, RefreshCw, ListenersIcon, Antenna } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';

const Settings = () => {
  const { socket } = useSocket();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [mqttTopic, setMqttTopic] = useState('');
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [testMessages, setTestMessages] = useState([]);
  const [liveMessages, setLiveMessages] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({});

  useEffect(() => {
    fetchConfig();
    fetchMqttListeners();
    
    // Listen for test messages from server
    const handleTestMessage = (data) => {
      setTestMessages(prev => [...prev, data]);
      toast.success('Test message received!');
    };
    
    // Listen for live MQTT messages
    const handleLiveMessage = (data) => {
      const { topic, message, timestamp } = data;
      
      // Only show messages for topics we're subscribed to
      const isSubscribedToTopic = activeSubscriptions.some(subscription => {
        if (subscription === '#') return true; // Wildcard subscription shows all messages
        if (subscription === topic) return true; // Exact match
        if (subscription.endsWith('/#')) {
          const baseTopic = subscription.slice(0, -2); // Remove /#
          return topic.startsWith(baseTopic + '/'); // Check if topic starts with base
        }
        return false;
      });
      
      if (isSubscribedToTopic) {
        setLiveMessages(prev => {
          const newMessages = {
            ...prev,
            [topic]: [...(prev[topic] || []), { message, timestamp }].slice(-50) // Keep last 50 messages
          };
          return newMessages;
        });
      }
    };
    
    // Cleanup function for page refresh/navigation
    const cleanupSubscriptions = async () => {
      try {
        const currentSubscriptions = await axios.get('/api/mqtt/listeners');
        for (const topic of currentSubscriptions.data) {
          await axios.post('/api/mqtt/unsubscribe', { topic });
        }
      } catch (error) {
        console.error('Error during subscription cleanup:', error);
      }
    };
    
    // Add beforeunload listener for page refresh/navigation
    const handleBeforeUnload = () => {
      cleanupSubscriptions();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Add socket listeners
    if (socket) {
      socket.on('test-message-received', handleTestMessage);
      socket.on('mqtt-message-received', handleLiveMessage);
    }
    
    return () => {
      if (socket) {
        socket.off('test-message-received', handleTestMessage);
        socket.off('mqtt-message-received', handleLiveMessage);
      }
      
      // Remove beforeunload listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Cleanup subscriptions when component unmounts
      cleanupSubscriptions();
    };
  }, [socket]);

  const fetchMqttListeners = async () => {
    try {
      const response = await axios.get('/api/mqtt/listeners');
      setActiveSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching MQTT listeners:', error);
      toast.error('Failed to load MQTT listeners');
    }
  };

  const handleSubscribe = async () => {
    if (!mqttTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    
    const topic = mqttTopic.trim();
    console.log('🔔 Starting subscription to:', topic);
    
    // First, update the UI immediately for better UX
    setActiveSubscriptions(prev => {
      console.log('Current subscriptions:', prev);
      if (!prev.includes(topic)) {
        const newSubs = [...prev, topic];
        console.log('Adding topic, new subscriptions:', newSubs);
        return newSubs;
      }
      console.log('Topic already exists, keeping:', prev);
      return prev;
    });
    
    setConnectionStatus(prev => ({ ...prev, [topic]: 'testing' }));
    setMqttTopic('');
    
    try {
      // Test MQTT connection (skip this for now to avoid errors)
      console.log('Testing MQTT connection...');
      // await axios.post('/api/settings/test-mqtt');
      
      // Subscribe to topic
      console.log('Subscribing to topic via API...');
      await axios.post('/api/mqtt/subscribe', { topic });
      console.log('API subscription successful');
      
      // Update connection status to connected
      setConnectionStatus(prev => ({ ...prev, [topic]: 'connected' }));
      setLiveMessages(prev => ({ ...prev, [topic]: [] }));
      
      toast.success(`Subscribed to ${topic}`);
      
      // Refresh from server
      fetchMqttListeners();
    } catch (error) {
      console.error('Error during subscription:', error);
      setConnectionStatus(prev => ({ ...prev, [topic]: 'failed' }));
      toast.error(`Failed to subscribe: ${error.message}`);
      
      // Don't remove from UI - let user try again or manually remove
    }
  };

  const handleUnsubscribe = async (topic) => {
    try {
      // Update UI immediately
      setActiveSubscriptions(prev => prev.filter(sub => sub !== topic));
      
      // Clear connection status and messages for this topic
      setConnectionStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[topic];
        return newStatus;
      });
      
      setLiveMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[topic];
        return newMessages;
      });
      
      // Call API in background
      await axios.post('/api/mqtt/unsubscribe', { topic });
      
      toast.success(`Unsubscribed from ${topic}`);
      fetchMqttListeners();
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      toast.error('Failed to unsubscribe from topic');
      
      // Re-add to UI if API call failed
      setActiveSubscriptions(prev => [...prev, topic]);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/settings/config');
      setConfig(response.data);
    } catch (error) {
      toast.error('Failed to load configuration');
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleNestedChange = (section, subsection, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [key]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/settings/config', config);
      toast.success('Configuration saved successfully');
      await fetchConfig(); // Reload config to get server-side changes
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const testDatabaseConnection = async () => {
    setTestingConnection(true);
    try {
      await axios.post('/api/settings/test-database');
      toast.success('Database connection successful');
    } catch (error) {
      toast.error('Database connection failed');
      console.error('Database test failed:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const testMqttConnection = async () => {
    setTestingConnection(true);
    try {
      await axios.post('/api/settings/test-mqtt');
      toast.success('MQTT connection successful');
    } catch (error) {
      toast.error('MQTT connection failed');
      console.error('MQTT test failed:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your system settings</p>
      </div>

      {/* Database Settings */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <Database className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold">Database Configuration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label>Database Type</label>
            <select
              value={config.database.type}
              onChange={(e) => handleChange('database', 'type', e.target.value)}
              className="form-select"
            >
              <option value="mariadb">MariaDB</option>
              <option value="postgresql">PostgreSQL</option>
            </select>
          </div>

          <div className="form-group">
            <label>Host</label>
            <input
              type="text"
              value={config.database.host}
              onChange={(e) => handleChange('database', 'host', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Port</label>
            <input
              type="number"
              value={config.database.port}
              onChange={(e) => handleChange('database', 'port', parseInt(e.target.value))}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Database Name</label>
            <input
              type="text"
              value={config.database.name}
              onChange={(e) => handleChange('database', 'name', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={config.database.user}
              onChange={(e) => handleChange('database', 'user', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={config.database.password}
              onChange={(e) => handleChange('database', 'password', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <button
          onClick={testDatabaseConnection}
          disabled={testingConnection}
          className="btn btn-secondary mt-4"
        >
          {testingConnection ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {/* MQTT Settings */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <Radio className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold">MQTT Configuration</h2>
        </div>

        <div className="form-group mb-4">
          <label>MQTT Mode</label>
          <select
            value={config.mqtt.mode}
            onChange={(e) => handleChange('mqtt', 'mode', e.target.value)}
            className="form-select"
          >
            <option value="built-in">Built-in Broker</option>
            <option value="external">External Broker</option>
          </select>
        </div>

        {config.mqtt.mode === 'built-in' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label>Port</label>
              <input
                type="number"
                value={config.mqtt.built_in.port}
                onChange={(e) => handleNestedChange('mqtt', 'built_in', 'port', parseInt(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Enable Persistence</label>
              <input
                type="checkbox"
                checked={config.mqtt.built_in.persistence}
                onChange={(e) => handleNestedChange('mqtt', 'built_in', 'persistence', e.target.checked)}
                className="form-checkbox"
              />
              <span className="text-sm text-gray-500 block mt-1">
                When enabled, MQTT messages and subscriptions will be saved to disk and restored after server restart. This ensures no messages are lost if the server goes down.
              </span>
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={config.mqtt.built_in.username || ''}
                onChange={(e) => handleNestedChange('mqtt', 'built_in', 'username', e.target.value)}
                className="form-input"
                placeholder="Leave empty for no authentication"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={config.mqtt.built_in.password || ''}
                onChange={(e) => handleNestedChange('mqtt', 'built_in', 'password', e.target.value)}
                className="form-input"
                placeholder="Leave empty for no authentication"
              />
            </div>

            <div className="form-group">
              <label>Allow Anonymous</label>
              <input
                type="checkbox"
                checked={config.mqtt.built_in.allow_anonymous !== false}
                onChange={(e) => handleNestedChange('mqtt', 'built_in', 'allow_anonymous', e.target.checked)}
                className="form-checkbox"
              />
              <span className="text-sm text-gray-500 ml-2">Allow connections without authentication</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label>External Broker Host</label>
              <input
                type="text"
                value={config.mqtt.external.host}
                onChange={(e) => handleNestedChange('mqtt', 'external', 'host', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>External Broker Port</label>
              <input
                type="number"
                value={config.mqtt.external.port}
                onChange={(e) => handleNestedChange('mqtt', 'external', 'port', parseInt(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={config.mqtt.external.username}
                onChange={(e) => handleNestedChange('mqtt', 'external', 'username', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={config.mqtt.external.password}
                onChange={(e) => handleNestedChange('mqtt', 'external', 'password', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Client ID</label>
              <input
                type="text"
                value={config.mqtt.external.client_id}
                onChange={(e) => handleNestedChange('mqtt', 'external', 'client_id', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        )}

        <button
          onClick={testMqttConnection}
          disabled={testingConnection}
          className="btn btn-secondary mt-4"
        >
          {testingConnection ? 'Testing...' : 'Test Connection'}
        </button>
      </div>

      {/* MQTT Listeners */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <Antenna className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold">MQTT Listeners</h2>
        </div>

                <div className="space-y-4">
          {/* Always show subscription summary section */}
          <div className="bg-dashboard-700 rounded p-3 mb-4">
            <h4 className="text-sm font-medium text-black mb-2">
              Currently Subscribed To ({activeSubscriptions ? activeSubscriptions.length : 0})
            </h4>
            {activeSubscriptions && activeSubscriptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeSubscriptions.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-600 text-white"
                  >
                    {topic}
                    <button
                      onClick={() => handleUnsubscribe(topic)}
                      className="ml-1 text-white hover:text-red-300"
                      title={`Unsubscribe from ${topic}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No active subscriptions</p>
            )}
          </div>

          {/* Subscribe Form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={mqttTopic}
              onChange={(e) => setMqttTopic(e.target.value)}
              placeholder="Enter MQTT topic (e.g., # for all, test/connection)"
              className="form-input flex-1"
            />
            <button
              onClick={() => {
                if (mqttTopic.trim()) {
                  const topic = mqttTopic.trim();
                  
                  // Update UI immediately
                  setActiveSubscriptions(prev => {
                    if (!prev.includes(topic)) {
                      return [...prev, topic];
                    }
                    return prev;
                  });
                  setMqttTopic('');
                  
                  // Call API in background
                  axios.post('/api/mqtt/subscribe', { topic })
                    .then(() => {
                      setConnectionStatus(prev => ({ ...prev, [topic]: 'connected' }));
                      toast.success(`Subscribed to ${topic}`);
                    })
                    .catch((error) => {
                      setConnectionStatus(prev => ({ ...prev, [topic]: 'failed' }));
                      toast.error('Failed to subscribe to topic');
                    });
                }
              }}
              className="btn btn-primary"
            >
              Subscribe
            </button>

          </div>

          {/* Active Subscriptions */}
          <div className="space-y-4">
            {activeSubscriptions.map((topic, index) => (
              <div key={index} className="bg-dashboard-800 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-black">{topic}</span>
                    <div className={`px-2 py-1 rounded text-xs ${
                      connectionStatus[topic] === 'connected' ? 'bg-green-600 text-white' :
                      connectionStatus[topic] === 'testing' ? 'bg-yellow-600 text-white' :
                      connectionStatus[topic] === 'failed' ? 'bg-red-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {connectionStatus[topic] === 'connected' ? 'Connected' :
                       connectionStatus[topic] === 'testing' ? 'Testing...' :
                       connectionStatus[topic] === 'failed' ? 'Failed' :
                       'Unknown'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnsubscribe(topic)}
                    className="btn btn-danger btn-sm"
                  >
                    Stop
                  </button>
                </div>
                
                {/* Live Messages */}
                {liveMessages[topic] && liveMessages[topic].length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-medium text-black mb-2">Live Messages ({liveMessages[topic].length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {liveMessages[topic].map((msg, msgIndex) => (
                        <div key={msgIndex} className="bg-dashboard-700 rounded p-2 text-xs">
                          <p className="text-black">{msg.message}</p>
                          <p className="text-gray-600">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Test Messages */}
          {testMessages.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-black mb-2">Recent Test Messages</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {testMessages.slice(-5).map((msg, index) => (
                  <div key={index} className="bg-green-100 border border-green-300 rounded p-3">
                    <p className="text-sm text-green-800 font-semibold">{msg.topic}</p>
                    <p className="text-sm text-black mt-1">{msg.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Settings */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <SettingsIcon className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold">System Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label>Auto Refresh Interval (seconds)</label>
            <input
              type="number"
              value={config.system.auto_refresh}
              onChange={(e) => handleChange('system', 'auto_refresh', parseInt(e.target.value))}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Data Retention (days)</label>
            <input
              type="number"
              value={config.system.data_retention_days}
              onChange={(e) => handleChange('system', 'data_retention_days', parseInt(e.target.value))}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Enable Automatic Backups</label>
            <input
              type="checkbox"
              checked={config.system.backup_enabled}
              onChange={(e) => handleChange('system', 'backup_enabled', e.target.checked)}
              className="form-checkbox"
            />
          </div>

          <div className="form-group">
            <label>Debug Mode</label>
            <input
              type="checkbox"
              checked={config.system.debug_mode}
              onChange={(e) => handleChange('system', 'debug_mode', e.target.checked)}
              className="form-checkbox"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;