import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Settings as SettingsIcon, 
  Database, 
  Wifi, 
  Bell, 
  Save, 
  RefreshCw,
  TestTube,
  Shield,
  Activity
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    mqttConfig: {
      useInternal: true,
      external: {
        host: '',
        port: 1883,
        username: '',
        password: '',
        ssl: false
      },
      internal: {
        port: 1883,
        websocketPort: 9001,
        allowAnonymous: true,
        maxConnections: 100,
        maxMessageSize: 1024
      }
    },
    notifications: {
      emailAlerts: true,
      usageReports: false,
      realTimeUpdates: true,
      mqttAlerts: true
    },
    systemSettings: {
      autoRefresh: 30,
      dataRetention: 90,
      backupEnabled: true,
      debugMode: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('mqtt');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to load settings');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await axios.post('/api/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const testMQTTConnection = async () => {
    try {
      setTesting(true);
      const response = await axios.post('/api/mqtt/test', {
        host: settings.mqttConfig.useInternal ? 'localhost' : settings.mqttConfig.external.host,
        port: settings.mqttConfig.useInternal ? settings.mqttConfig.internal.port : settings.mqttConfig.external.port,
        username: settings.mqttConfig.external.username,
        password: settings.mqttConfig.external.password,
        ssl: settings.mqttConfig.external.ssl
      });
      
      if (response.data.success) {
        toast.success('MQTT connection test successful!');
      } else {
        toast.error('MQTT connection test failed');
      }
    } catch (error) {
      toast.error('MQTT connection test failed');
      console.error('Error testing MQTT:', error);
    } finally {
      setTesting(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateMQTTSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      mqttConfig: {
        ...prev.mqttConfig,
        [section]: {
          ...prev.mqttConfig[section],
          [key]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <SettingsIcon className="h-8 w-8 mr-3 text-blue-500" />
          System Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure MQTT broker, notifications, and system preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'mqtt', name: 'MQTT Configuration', icon: Wifi },
            { id: 'notifications', name: 'Notifications', icon: Bell },
            { id: 'system', name: 'System Settings', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MQTT Configuration Tab */}
      {activeTab === 'mqtt' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Wifi className="h-5 w-5 mr-2 text-blue-500" />
              MQTT Broker Configuration
            </h3>
            
            {/* Broker Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Broker Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="brokerType"
                    checked={settings.mqttConfig.useInternal}
                    onChange={() => updateSetting('mqttConfig', 'useInternal', true)}
                    className="mr-2"
                  />
                  <span>Built-in MQTT Broker (Recommended)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="brokerType"
                    checked={!settings.mqttConfig.useInternal}
                    onChange={() => updateSetting('mqttConfig', 'useInternal', false)}
                    className="mr-2"
                  />
                  <span>External MQTT Broker</span>
                </label>
              </div>
            </div>

            {/* Built-in Broker Configuration */}
            {settings.mqttConfig.useInternal && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Built-in MQTT Broker Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MQTT Port
                    </label>
                    <input
                      type="number"
                      value={settings.mqttConfig.internal.port}
                      onChange={(e) => updateMQTTSetting('internal', 'port', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1024"
                      max="65535"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WebSocket Port
                    </label>
                    <input
                      type="number"
                      value={settings.mqttConfig.internal.websocketPort}
                      onChange={(e) => updateMQTTSetting('internal', 'websocketPort', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1024"
                      max="65535"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Connections
                    </label>
                    <input
                      type="number"
                      value={settings.mqttConfig.internal.maxConnections}
                      onChange={(e) => updateMQTTSetting('internal', 'maxConnections', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Message Size (bytes)
                    </label>
                    <input
                      type="number"
                      value={settings.mqttConfig.internal.maxMessageSize}
                      onChange={(e) => updateMQTTSetting('internal', 'maxMessageSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="1048576"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.mqttConfig.internal.allowAnonymous}
                      onChange={(e) => updateMQTTSetting('internal', 'allowAnonymous', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Allow anonymous connections</span>
                  </label>
                </div>
              </div>
            )}

            {/* External Broker Configuration */}
            {!settings.mqttConfig.useInternal && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
                  <Wifi className="h-4 w-4 mr-2" />
                  External MQTT Broker Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host
                    </label>
                    <input
                      type="text"
                      value={settings.mqttConfig.external.host}
                      onChange={(e) => updateMQTTSetting('external', 'host', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="mqtt.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      value={settings.mqttConfig.external.port}
                      onChange={(e) => updateMQTTSetting('external', 'port', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="65535"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={settings.mqttConfig.external.username}
                      onChange={(e) => updateMQTTSetting('external', 'username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="mqtt_user"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={settings.mqttConfig.external.password}
                      onChange={(e) => updateMQTTSetting('external', 'password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.mqttConfig.external.ssl}
                      onChange={(e) => updateMQTTSetting('external', 'ssl', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Use SSL/TLS connection</span>
                  </label>
                </div>
              </div>
            )}

            {/* Connection Test */}
            <div className="flex space-x-4">
              <button
                onClick={testMQTTConnection}
                disabled={testing}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={loadSettings}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-blue-500" />
            Notification Preferences
          </h3>
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-500" />
            System Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto Refresh (seconds)
              </label>
              <input
                type="number"
                value={settings.systemSettings.autoRefresh}
                onChange={(e) => updateSetting('systemSettings', 'autoRefresh', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                max="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Retention (days)
              </label>
              <input
                type="number"
                value={settings.systemSettings.dataRetention}
                onChange={(e) => updateSetting('systemSettings', 'dataRetention', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {Object.entries(settings.systemSettings)
              .filter(([key]) => typeof settings.systemSettings[key] === 'boolean')
              .map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => updateSetting('systemSettings', key, e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
