class MemoryStore {
  constructor() {
    this.data = {
      users: new Map(),
      lockers: new Map(),
      groups: new Map(),
      settings: new Map(),
      activities: new Map(),
      mqtt_messages: new Map()
    };
    this.counters = {
      users: 0,
      lockers: 0,
      groups: 0,
      activities: 0,
      mqtt_messages: 0
    };
    this.isConnected = true;
  }

  async connect() {
    console.log('Using in-memory storage');
    return true;
  }

  async disconnect() {
    this.isConnected = false;
    console.log('In-memory storage disconnected');
  }

  async close() {
    await this.disconnect();
  }

  // Helper methods
  generateId(type) {
    this.counters[type]++;
    return this.counters[type];
  }

  // User methods
  async createUser(userData) {
    const id = this.generateId('users');
    const user = { id, ...userData, created_at: new Date(), updated_at: new Date() };
    this.data.users.set(id, user);
    return user;
  }

  async getAllUsers() {
    return Array.from(this.data.users.values());
  }

  async getUserById(id) {
    return this.data.users.get(parseInt(id));
  }

  async updateUser(id, updates) {
    const user = this.data.users.get(parseInt(id));
    if (!user) return null;
    const updatedUser = { ...user, ...updates, updated_at: new Date() };
    this.data.users.set(parseInt(id), updatedUser);
    return updatedUser;
  }

  async deleteUser(id) {
    const user = this.data.users.get(parseInt(id));
    if (!user) return null;
    this.data.users.delete(parseInt(id));
    return user;
  }

  // Locker methods
  async createLocker(lockerData) {
    const id = this.generateId('lockers');
    const locker = { id, ...lockerData, created_at: new Date(), updated_at: new Date() };
    this.data.lockers.set(id, locker);
    return locker;
  }

  async getAllLockers() {
    return Array.from(this.data.lockers.values());
  }

  async getLockerById(id) {
    return this.data.lockers.get(parseInt(id));
  }

  async updateLocker(id, updates) {
    const locker = this.data.lockers.get(parseInt(id));
    if (!locker) return null;
    const updatedLocker = { ...locker, ...updates, updated_at: new Date() };
    this.data.lockers.set(parseInt(id), updatedLocker);
    return updatedLocker;
  }

  async deleteLocker(id) {
    const locker = this.data.lockers.get(parseInt(id));
    if (!locker) return null;
    this.data.lockers.delete(parseInt(id));
    return locker;
  }

  // Group methods
  async createGroup(groupData) {
    const id = this.generateId('groups');
    const group = { id, ...groupData, created_at: new Date(), updated_at: new Date() };
    this.data.groups.set(id, group);
    return group;
  }

  async getAllGroups() {
    return Array.from(this.data.groups.values());
  }

  async getGroupById(id) {
    return this.data.groups.get(parseInt(id));
  }

  async updateGroup(id, updates) {
    const group = this.data.groups.get(parseInt(id));
    if (!group) return null;
    const updatedGroup = { ...group, ...updates, updated_at: new Date() };
    this.data.groups.set(parseInt(id), updatedGroup);
    return updatedGroup;
  }

  async deleteGroup(id) {
    const group = this.data.groups.get(parseInt(id));
    if (!group) return null;
    this.data.groups.delete(parseInt(id));
    return group;
  }

  // Settings methods
  async getAllSettings() {
    return Array.from(this.data.settings.values());
  }

  async getSetting(key) {
    return this.data.settings.get(key);
  }

  async setSetting(key, value, description = null) {
    const setting = {
      key,
      value,
      description,
      updated_at: new Date()
    };
    this.data.settings.set(key, setting);
    return setting;
  }

  // Activity logging
  async logActivity(activityData) {
    const id = this.generateId('activities');
    const activity = {
      id,
      ...activityData,
      created_at: new Date()
    };
    this.data.activities.set(id, activity);
    return activity;
  }

  // MQTT message storage
  async saveMqttMessage(messageData) {
    const id = this.generateId('mqtt_messages');
    const message = {
      id,
      ...messageData,
      created_at: new Date()
    };
    this.data.mqtt_messages.set(id, message);
    return message;
  }

  // Transaction support (no-op for memory store)
  async transaction(callback) {
    return await callback(this);
  }
}

module.exports = MemoryStore;