import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import * as SecureStore from 'expo-secure-store';

export interface Device {
  id: string;
  name: string;
  type: 'iOS' | 'Android' | 'Web';
  lastActive: string;
  isCurrent: boolean;
  deviceId: string;
}

export interface DeviceResponse {
  devices: Device[];
  success: boolean;
}

export interface RemoveDeviceResponse {
  success: boolean;
  message: string;
}

class DeviceService {
  private async getAuthHeaders() {
    const email = await SecureStore.getItemAsync('linkedEmail');
    const deviceId = await SecureStore.getItemAsync('deviceId');
    
    return {
      'Content-Type': 'application/json',
      'X-Email': email || '',
      'X-Device-ID': deviceId || '',
    };
  }

  async getDevices(): Promise<Device[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get<DeviceResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.getDevices}`,
        { headers }
      );
      
      if (response.data.success && response.data.devices) {
        return response.data.devices;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  }

  async removeDevice(deviceId: string): Promise<RemoveDeviceResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const currentDeviceId = await SecureStore.getItemAsync('deviceId');
      
      if (deviceId === currentDeviceId) {
        return {
          success: false,
          message: 'Cannot remove the current device',
        };
      }

      const response = await axios.post<RemoveDeviceResponse>(
        `${API_BASE_URL}${API_ENDPOINTS.removeDevice}`,
        { device_id: deviceId },
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error removing device:', error);
      return {
        success: false,
        message: 'Failed to remove device',
      };
    }
  }

  async getCurrentDeviceInfo(): Promise<{ name: string; type: 'iOS' | 'Android' | 'Web' }> {
    // Get device info from the device
    const userAgent = navigator.userAgent;
    let deviceType: 'iOS' | 'Android' | 'Web' = 'Web';
    let deviceName = 'Unknown Device';

    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      deviceType = 'iOS';
      deviceName = userAgent.includes('iPhone') ? 'iPhone' : 'iPad';
    } else if (userAgent.includes('Android')) {
      deviceType = 'Android';
      deviceName = 'Android Device';
    } else {
      deviceName = 'Web Browser';
    }

    return { name: deviceName, type: deviceType };
  }
}

export const deviceService = new DeviceService();