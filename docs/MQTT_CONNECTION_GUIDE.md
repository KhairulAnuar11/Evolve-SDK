# MQTT Connection Implementation Guide

## Overview

This document describes the new MQTT connection functionality added to the Evolve SDK. The implementation provides a complete backend connection system integrated with the GUI's HardwareConnection component.

## Architecture

### 1. **Backend SDK Layer** (`sdk/src/connections/MqttConnectionManager.ts`)

The `MqttConnectionManager` class provides comprehensive MQTT broker connectivity with the following features:

- **Connection Management**: Establish and maintain MQTT connections with automatic reconnection
- **Authentication**: Support for username/password authentication
- **Configuration Options**: Customizable MQTT client options (keepalive, timeout, protocol, etc.)
- **Status Monitoring**: Real-time connection status tracking
- **Message Handling**: Subscribe to and publish messages
- **Event Listeners**: Register callbacks for connection status and incoming messages

#### MqttConnectionConfig Interface

```typescript
interface MqttConnectionConfig {
  brokerUrl: string;                    // MQTT broker URL (mqtt://... or mqtts://...)
  topic: string;                        // Topic to subscribe to
  username?: string;                    // Optional authentication
  password?: string;                    // Optional authentication
  clientId?: string;                    // Optional client identifier
  keepalive?: number;                   // Keep-alive interval (default: 30)
  reconnectPeriod?: number;             // Reconnection delay in ms (default: 1000)
  connectTimeout?: number;              // Connection timeout in ms (default: 30000)
  rejectUnauthorized?: boolean;         // TLS validation (default: true)
  protocol?: 'mqtt' | 'mqtts' | 'tcp' | 'tls' | 'ws' | 'wss';
  [key: string]: any;
}
```

#### Key Methods

```typescript
// Connect to MQTT broker
async connect(config: MqttConnectionConfig): Promise<MqttConnectionStatus>

// Disconnect from broker
async disconnect(): Promise<void>

// Publish a message
async publish(payload: string | Buffer | object, topic?: string, options?: mqtt.IClientPublishOptions): Promise<void>

// Monitor connection status changes
onStatusChange(listener: (status: MqttConnectionStatus) => void): () => void

// Listen for incoming messages
onMessage(listener: (topic: string, payload: Buffer) => void): () => void

// Get current connection status
getStatus(): MqttConnectionStatus

// Check if connected
isConnected(): boolean

// Test connection without subscribing
static async testConnection(config: MqttConnectionConfig): Promise<{ success: boolean; message: string }>
```

### 2. **SDK Core Layer** (`sdk/src/Rfidsdk.ts`)

The main RFID SDK now includes:

```typescript
// Connect to MQTT broker
async connectMqtt(brokerUrl: string, topic: string, options?: any): Promise<boolean>

// Disconnect from current reader/broker
async disconnect(): Promise<void>

// Publish data to MQTT
async publish(tag: any, topic?: string): Promise<boolean>
```

### 3. **GUI Service Layer** (`gui/src/services/sdkService.ts`)

The service bridges the GUI to the backend through Electron IPC:

```typescript
// Connect to MQTT broker
connectMqtt: async (brokerUrl: string, topic: string, options?: MqttConnectionOptions) 
  => Promise<{ success: boolean }>

// Publish message to MQTT
publishMqtt: async (payload: any, topic?: string) 
  => Promise<{ success: boolean; error?: string }>

// Disconnect from current connection
disconnect: async () 
  => Promise<{ success: boolean }>
```

### 4. **GUI Component** (`gui/src/components/Sidebar/HardwareConnection.tsx`)

The HardwareConnection component now provides:

- **MQTT Mode UI**: Radio button to select MQTT connection mode
- **Configuration Inputs**:
  - Broker URL (with validation and examples)
  - Topic (with description)
  - Username (optional)
  - Password (optional)
- **Connection Management**: 
  - Connect/Disconnect button with loading state
  - Real-time connection status indicator
  - Error message display
- **TCP Mode Support**: Existing TCP/IP mode preserved with state management

#### Component State

```typescript
interface MqttConfig {
  brokerUrl: string;  // MQTT broker URL
  topic: string;      // Subscription topic
  username: string;   // Authentication username
  password: string;   // Authentication password
}

// Component also manages:
- connected: boolean      // Connection state
- loading: boolean        // Operation in progress
- error: string          // Error messages
- tcpConfig: object      // TCP configuration state
```

## Usage Flow

### 1. **User selects MQTT Mode**
```
[Radio Button] MQTT Mode selected
```

### 2. **User enters configuration**
```
Broker URL: mqtt://broker.hivemq.com
Topic: rfid/raw
Username: (optional)
Password: (optional)
```

### 3. **User clicks Connect**
```
HardwareConnection.handleMqttConnection()
  ↓
sdkService.connectMqtt(brokerUrl, topic, options)
  ↓
window.electronAPI.connectMqtt(brokerUrl, topic, options)
  ↓
sdkbridge.js: reader:connect-mqtt handler
  ↓
sdk.connectMqtt(brokerUrl, topic, options)
  ↓
MqttReader (MQTTTransport.ts)
  ↓
mqtt.connect() → broker
```

### 4. **Connection Status**
- Connection status indicator shows real-time state (green = connected, gray = disconnected)
- Error messages display any connection failures
- Loading state prevents double-clicks during connection

## Examples

### Direct SDK Usage

```typescript
import { RfidSdk, MqttConnectionManager } from 'evolve-sdk';

// Using MqttConnectionManager directly
const manager = new MqttConnectionManager();

const config = {
  brokerUrl: 'mqtts://mqtt.example.com:8883',
  topic: 'rfid/tags',
  username: 'rfid_user',
  password: 'secure_password',
  protocol: 'mqtts'
};

try {
  const status = await manager.connect(config);
  console.log('Connected:', status.connected);
  
  // Listen for messages
  manager.onMessage((topic, payload) => {
    console.log(`Message on ${topic}:`, payload.toString());
  });
  
  // Publish data
  await manager.publish({ epc: '123456' }, 'rfid/processed');
  
  // Cleanup
  await manager.disconnect();
} catch (err) {
  console.error('Connection failed:', err);
}
```

### Using RfidSdk

```typescript
const sdk = new RfidSdk();

// MQTT connection
await sdk.connectMqtt('mqtt://broker.example.com', 'rfid/raw', {
  username: 'user',
  password: 'pass'
});

// Listen for tags
sdk.on('tag', (data) => {
  console.log('Tag received:', data);
});

// Start receiving
sdk.start();

// Publish data
await sdk.publish({ message: 'test' }, 'rfid/output');

// Disconnect
await sdk.disconnect();
```

### GUI Integration

```typescript
import { sdkService } from './services/sdkService';

// In component handler
const handleConnect = async () => {
  try {
    const result = await sdkService.connectMqtt(
      'mqtt://broker.example.com',
      'rfid/raw',
      {
        username: 'user',
        password: 'pass'
      }
    );
    
    if (result.success) {
      console.log('Connected successfully');
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
};
```

## Supported MQTT Brokers

The implementation supports any MQTT 3.1.1/5.0 broker:

- **Free/Public Brokers**:
  - http://broker.hivemq.com (unencrypted mqtt://broker.hivemq.com:1883)
  - https://mosquitto.org/ (test.mosquitto.org)
  - https://www.emqx.com/en/cloud (free tier available)

- **Secured Brokers** (mqtts protocol required):
  - Self-hosted with TLS certificates
  - Cloud MQTT brokers (AWS, Azure, Google Cloud)
  - Enterprise MQTT servers

## Protocol Support

```typescript
// Standard unencrypted MQTT
mqtt://broker.example.com:1883

// MQTT with TLS encryption
mqtts://broker.example.com:8883

// WebSocket transports
ws://broker.example.com:8080/mqtt
wss://broker.example.com:8081/mqtt
```

## Error Handling

The component provides comprehensive error handling:

```typescript
// Connection errors are displayed to user
- "Broker URL and Topic are required"
- "MQTT connection timeout"
- "Subscribe failed: [error message]"
- Connection refused / Authentication failed
- Network unreachable

// Errors are shown in red error display box
// Connection attempts can be retried

## Common Errors & Troubleshooting

- **Error: getaddrinfo ENOTFOUND <value>**
  - Cause: The SDK attempted a DNS lookup for the broker string but received an invalid hostname (often because a numeric port like `1883` was entered by itself).
  - Fix: Use a hostname or full URL. Examples: `broker.hivemq.com`, `mqtt://broker.hivemq.com:1883`, or `mqtts://mqtt.example.com:8883`.

- **Invalid broker URL format**
  - Cause: The broker string couldn't be parsed as a URL.
  - Fix: Include protocol or a valid host portion. The GUI prepends `mqtt://` when a protocol is omitted, but you must include a hostname (not just a port number).

- **Connection timeout - broker not responding**
  - Cause: Broker did not respond within the configured timeout (default UI timeout: 40s).
  - Fix: Verify broker address, network access, and that broker is listening on the port. Try a local MQTT client (e.g., mosquitto_sub) to verify connectivity.

- **Subscribe failed: [error message]**
  - Cause: Permission or topic mismatch at broker side, or broker returned an error during subscribe.
  - Fix: Verify topic exists/permissions and broker ACLs. Try subscribing using a separate MQTT client to validate.

If you encounter a persistent issue, open the Electron main logs and renderer devtools to inspect the IPC responses and SDK error messages.
```

## Configuration Files Modified

1. **sdk/src/connections/MqttConnectionManager.ts** - NEW
2. **sdk/src/index.ts** - Updated exports
3. **gui/src/components/Sidebar/HardwareConnection.tsx** - Enhanced with state and handlers
4. **gui/src/services/sdkService.ts** - Updated with types and documentation

## Connection Lifecycle

```
Initial State: Connected = false

User Input
    ↓
Validate Input → Error → Show Error Message
    ↓ (valid)
setLoading(true)
    ↓
Call connectMqtt()
    ↓
Success → setConnected(true) → Show Connected Indicator
    ↓
Error → Show Error Message → setConnected(false)
    ↓
setLoading(false)

Disconnect State:
Click Disconnect → Call disconnect() → setConnected(false)
```

## Testing the Integration

1. **Test with public broker** (no authentication):
   - Broker: `mqtt://broker.hivemq.com`
   - Topic: `evolve-sdk/test`
   - Click Connect → Should show "Connected" status

2. **Test with authenticated broker**:
   - Set username and password
   - Click Connect → Verify authentication is passed

3. **Test error handling**:
   - Invalid broker URL → Display error
   - Missing topic → Display error  
   - Network down → Display error with retry option

## Best Practices

1. **Security**:
   - Use `mqtts://` (encrypted) for production
   - Store credentials securely (not in source code)
   - Set appropriate topic permissions

2. **Configuration**:
   - Set reasonable `connectTimeout` (10000-30000ms)
   - Adjust `reconnectPeriod` based on reliability needs
   - Use unique `clientId` for tracking

3. **Performance**:
   - Subscribe to specific topics, not wildcards (#)
   - Implement message filtering at broker level
   - Monitor connection status for reliability

4. **Debugging**:
   - Check browser console for IPC errors
   - Check Electron console for SDK connection logs
   - Verify broker is accessible from your network
   - Test using MQTT client tools (MQTT.fx, Mosquitto)
