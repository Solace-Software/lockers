import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Bell, 
  Settings as SettingsIcon, 
  Save, 
  TestTube, 
  Play, 
  Square, 
  Trash2, 
  Copy, 
  MessageCircle 
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import DashboardHeader from '../components/DashboardHeader';
import DashboardCard from '../components/DashboardCard';
import Input from '../components/Input';
import Button from '../components/Button';

const Settings = () => {
  const { socket, isConnected } = useSocket();
  
  const [mqttConfig, setMqttConfig] = useState({
    host: 'localhost',
    port: 1883,
    username: '',
    password: '',
    clientId: 'gym-admin',
    // Broker-specific settings
    allowAnonymous: true,
    maxConnections: 100,
    maxMessageSize: 1024,
    websocketPort: 9001
  });
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    usageReports: false,
    realTimeUpdates: true
  });
  
  const [systemSettings, setSystemSettings] = useState({
    autoRefresh: 30,
    dataRetention: 90,
    backupEnabled: true,
    debugMode: false
  });

  // MQTT Listener state
  const [mqttListener, setMqttListener] = useState({
    topic: '#',
    isListening: false,
    messages: [],
    maxMessages: 100
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from API
    const loadSettings = async () => {
      try {
        const response = await axios.get('/api/settings');
        const settings = response.data;
        
        if (settings.mqttConfig) {
          setMqttConfig(settings.mqttConfig);
        }
        if (settings.notifications) {
          setNotifications(settings.notifications);
        }
        if (settings.systemSettings) {
          setSystemSettings(settings.systemSettings);
        }
        
        console.log('⚙️ Settings loaded from API:', settings);
      } catch (error) {
        console.error('❌ Failed to load settings from API:', error);
        
        // Fallback to localStorage if API fails
        const savedMqtt = localStorage.getItem('mqttConfig');
        const savedNotifications = localStorage.getItem('notifications');
        const savedSystem = localStorage.getItem('systemSettings');
        const savedMqttListener = localStorage.getItem('mqttListener');

        if (savedMqtt) setMqttConfig(JSON.parse(savedMqtt));
        if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
        if (savedSystem) setSystemSettings(JSON.parse(savedSystem));
        if (savedMqttListener) setMqttListener(prev => ({ ...prev, ...JSON.parse(savedMqttListener), messages: [], isListening: false }));
      }
    };

    loadSettings();
  }, []);

  // MQTT message listener
  useEffect(() => {
    if (!socket) {
      console.log('🔌 Socket not available for MQTT listener');
      return;
    }

    console.log('🎧 Setting up MQTT listener...', { 
      isListening: mqttListener.isListening, 
      topic: mqttListener.topic,
      socketConnected: socket.connected 
    });

    const handleMqttMessage = (data) => {
      console.log('📨 Received MQTT message:', data);
      
      // Check if the message topic matches the listener topic pattern
      const topicMatches = (pattern, topic) => {
        if (pattern === '#') return true;
        if (pattern === topic) return true;
        
        // Handle wildcards
        const patternParts = pattern.split('/');
        const topicParts = topic.split('/');
        
        for (let i = 0; i < patternParts.length; i++) {
          if (patternParts[i] === '#') return true;
          if (patternParts[i] === '+') continue;
          if (patternParts[i] !== topicParts[i]) return false;
        }
        
        return patternParts.length === topicParts.length;
      };

      const matches = topicMatches(mqttListener.topic, data.topic);
      console.log('🔍 Topic match check:', { 
        pattern: mqttListener.topic, 
        topic: data.topic, 
        matches 
      });

      if (matches) {
        const newMessage = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          topic: data.topic,
          payload: data.payload,
          rawPayload: JSON.stringify(data.payload, null, 2)
        };

        console.log('✅ Adding message to list:', newMessage);

        // Only add message if currently listening
        setMqttListener(prev => {
          if (!prev.isListening) {
            console.log('🚫 Not listening, ignoring message');
            return prev;
          }
          
          return {
            ...prev,
            messages: [newMessage, ...prev.messages].slice(0, prev.maxMessages)
          };
        });
      }
    };

    const handleTestResponse = (data) => {
      console.log('🧪 Received test response:', data);
      alert(`✅ Socket.IO test successful!\nServer response: ${data.message}\nClient ID: ${data.clientId}`);
    };

    socket.on('mqtt-message', handleMqttMessage);
    socket.on('test-response', handleTestResponse);
    console.log('🔗 MQTT message listener registered');

    return () => {
      console.log('🔌 Cleaning up MQTT message listener');
      socket.off('mqtt-message', handleMqttMessage);
      socket.off('test-response', handleTestResponse);
    };
  }, [socket, mqttListener.topic, mqttListener.maxMessages, mqttListener.isListening]); // Include necessary dependencies

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to API
      const response = await axios.post('/api/settings', { mqttConfig, notifications, systemSettings, mqttListener });
      
      if (response.data.success) {
        console.log('✅ Settings saved to API:', response.data);
        
        // Also save to localStorage as backup
        localStorage.setItem('mqttConfig', JSON.stringify(mqttConfig));
        localStorage.setItem('notifications', JSON.stringify(notifications));
        localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
        localStorage.setItem('mqttListener', JSON.stringify({
          topic: mqttListener.topic,
          maxMessages: mqttListener.maxMessages
        }));
        
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('❌ Error saving settings to API:', error);
      
      // Fallback to localStorage only
      try {
        localStorage.setItem('mqttConfig', JSON.stringify(mqttConfig));
        localStorage.setItem('notifications', JSON.stringify(notifications));
        localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
        localStorage.setItem('mqttListener', JSON.stringify({
          topic: mqttListener.topic,
          maxMessages: mqttListener.maxMessages
        }));
        
        alert('⚠️ Settings saved to local storage only. Server connection failed.');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (localError) {
        console.error('❌ Failed to save to localStorage:', localError);
        alert('❌ Failed to save settings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startMqttListener = () => {
    console.log('🚀 Starting MQTT listener...', { 
      topic: mqttListener.topic, 
      maxMessages: mqttListener.maxMessages,
      socketConnected: isConnected 
    });
    setMqttListener(prev => ({ ...prev, isListening: true, messages: [] }));
  };

  const stopMqttListener = () => {
    console.log('🛑 Stopping MQTT listener...');
    setMqttListener(prev => ({ ...prev, isListening: false }));
  };

  const clearMqttMessages = () => {
    console.log('🗑️ Clearing MQTT messages...');
    setMqttListener(prev => ({ ...prev, messages: [] }));
  };

  const copyMessageToClipboard = (message) => {
    const text = `Topic: ${message.topic}\nTimestamp: ${message.timestamp}\nPayload:\n${message.rawPayload}`;
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  };

  const testMqttConnection = async () => {
    try {
      await axios.post('/api/test-mqtt', mqttConfig);
      alert('MQTT connection test successful!');
    } catch (error) {
      alert('MQTT connection test failed. Please check your configuration.');
    }
  };

  const testMqttMessage = async () => {
    try {
      await axios.post('/api/test-mqtt-message');
      alert('Test MQTT message sent! Check the message listener.');
    } catch (error) {
      alert('Failed to send test MQTT message. Make sure MQTT is connected.');
    }
  };

  return (
    <div className="p-6">
      <DashboardHeader title="Settings" subtitle="Configure system preferences and MQTT connection" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MQTT Broker Configuration */}
        <DashboardCard>
          <div className="flex items-center space-x-3 mb-6">
            <Wifi className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">MQTT Broker Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Broker Host
              </label>
              <Input
                type="text"
                value={mqttConfig.host}
                onChange={(e) => setMqttConfig({ ...mqttConfig, host: e.target.value })}
                placeholder="localhost"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                MQTT Port
              </label>
              <Input
                type="number"
                value={mqttConfig.port}
                onChange={(e) => setMqttConfig({ ...mqttConfig, port: parseInt(e.target.value) })}
                placeholder="1883"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                WebSocket Port
              </label>
              <Input
                type="number"
                value={mqttConfig.websocketPort}
                onChange={(e) => setMqttConfig({ ...mqttConfig, websocketPort: parseInt(e.target.value) })}
                placeholder="9001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Max Connections
              </label>
              <Input
                type="number"
                value={mqttConfig.maxConnections}
                onChange={(e) => setMqttConfig({ ...mqttConfig, maxConnections: parseInt(e.target.value) })}
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Max Message Size (bytes)
              </label>
              <Input
                type="number"
                value={mqttConfig.maxMessageSize}
                onChange={(e) => setMqttConfig({ ...mqttConfig, maxMessageSize: parseInt(e.target.value) })}
                placeholder="1024"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowAnonymous"
                checked={mqttConfig.allowAnonymous}
                onChange={(e) => setMqttConfig({ ...mqttConfig, allowAnonymous: e.target.checked })}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="allowAnonymous" className="text-sm font-medium text-cyan-200">
                Allow Anonymous Connections
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Admin Username (optional)
              </label>
              <Input
                type="text"
                value={mqttConfig.username}
                onChange={(e) => setMqttConfig({ ...mqttConfig, username: e.target.value })}
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Admin Password (optional)
              </label>
              <Input
                type="password"
                value={mqttConfig.password}
                onChange={(e) => setMqttConfig({ ...mqttConfig, password: e.target.value })}
                placeholder="admin_password"
              />
            </div>

            <Button variant="secondary" className="w-full flex items-center justify-center space-x-2" onClick={testMqttConnection}>
              <TestTube className="w-4 h-4" />
              <span>Test Broker Connection</span>
            </Button>
          </div>
        </DashboardCard>

        {/* MQTT Listener */}
        <DashboardCard className="lg:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <MessageCircle className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">MQTT Message Listener</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-1">
                  Topic to Monitor
                </label>
                <Input
                  type="text"
                  value={mqttListener.topic}
                  onChange={(e) => setMqttListener(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="# (all topics)"
                  disabled={mqttListener.isListening}
                />
                <p className="text-xs text-cyan-200 mt-1">
                  Use # for all topics, + for single level wildcard, or specific topic
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-1">
                  Max Messages
                </label>
                <select
                  value={mqttListener.maxMessages}
                  onChange={(e) => setMqttListener(prev => ({ ...prev, maxMessages: parseInt(e.target.value) }))}
                  className="input"
                  disabled={mqttListener.isListening}
                >
                  <option value={50}>50 messages</option>
                  <option value={100}>100 messages</option>
                  <option value={200}>200 messages</option>
                  <option value={500}>500 messages</option>
                </select>
              </div>

              <div className="flex space-x-2">
                {!mqttListener.isListening ? (
                  <Button
                    variant="primary"
                    className="flex items-center space-x-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={startMqttListener}
                    disabled={!isConnected}
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Listening</span>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="flex items-center space-x-2 flex-1"
                    onClick={stopMqttListener}
                  >
                    <Square className="w-4 h-4" />
                    <span>Stop Listening</span>
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={clearMqttMessages}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 text-sm"
                  onClick={testMqttMessage}
                >
                  <TestTube className="w-4 h-4" />
                  <span>Send Test MQTT Message</span>
                </Button>
              </div>

              {/* Connection Status */}
              <div className="pt-2">
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Message Display */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 border rounded-lg h-96 overflow-hidden">
                <div className="p-3 border-b bg-gray-100">
                  <h4 className="text-sm font-medium text-gray-700">Received Messages</h4>
                </div>
                <div className="h-full overflow-y-auto p-3 space-y-2">
                  {mqttListener.messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No messages received yet</p>
                      <p className="text-xs">Start listening to see MQTT messages</p>
                    </div>
                  ) : (
                    mqttListener.messages.map((message) => (
                      <div key={message.id} className="bg-white border rounded p-3 text-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{message.topic}</p>
                            <p className="text-xs text-gray-500">{message.timestamp}</p>
                          </div>
                          <button
                            onClick={() => copyMessageToClipboard(message)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded p-2 overflow-x-auto">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                            {message.rawPayload}
                          </pre>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Notifications */}
        <DashboardCard>
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Email Alerts</p>
                <p className="text-xs text-cyan-200">Receive email notifications for important events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Usage Reports</p>
                <p className="text-xs text-cyan-200">Weekly usage summary reports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.usageReports}
                  onChange={(e) => setNotifications({ ...notifications, usageReports: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Real-time Updates</p>
                <p className="text-xs text-cyan-200">Live updates via WebSocket</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.realTimeUpdates}
                  onChange={(e) => setNotifications({ ...notifications, realTimeUpdates: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </DashboardCard>

        {/* System Settings */}
        <DashboardCard>
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">System Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Auto Refresh Interval (seconds)
              </label>
              <select
                value={systemSettings.autoRefresh}
                onChange={(e) => setSystemSettings({ ...systemSettings, autoRefresh: parseInt(e.target.value) })}
                className="input"
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Data Retention (days)
              </label>
              <select
                value={systemSettings.dataRetention}
                onChange={(e) => setSystemSettings({ ...systemSettings, dataRetention: parseInt(e.target.value) })}
                className="input"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Automatic Backups</p>
                <p className="text-xs text-cyan-200">Daily backup of system data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.backupEnabled}
                  onChange={(e) => setSystemSettings({ ...systemSettings, backupEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Debug Mode</p>
                <p className="text-xs text-cyan-200">Enable detailed logging</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.debugMode}
                  onChange={(e) => setSystemSettings({ ...systemSettings, debugMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </DashboardCard>

        {/* Security */}
        <DashboardCard>
          <div className="flex items-center space-x-3 mb-6">
            <MessageCircle className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Security</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Session Timeout (minutes)
              </label>
              <select className="input">
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={480}>8 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Password Policy
              </label>
              <select className="input">
                <option value="standard">Standard (8+ characters)</option>
                <option value="strong">Strong (12+ characters, symbols)</option>
                <option value="enterprise">Enterprise (16+ characters, complex)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                <p className="text-xs text-cyan-200">Require 2FA for admin access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Audit Logging</p>
                <p className="text-xs text-cyan-200">Log all admin actions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <TestTube className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}</span>
        </Button>
      </div>
    </div>
  );
};

export default Settings; 