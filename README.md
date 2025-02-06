# LMS Integration SDK Documentation

## Overview
This SDK provides a unified interface for integrating with various Learning Management Systems (LMS) such as Moodle, Canvas, and Blackboard. It follows a provider pattern that allows easy extension to support additional LMS platforms while maintaining a consistent API.

## Architecture

### Core Components
1. **Main LMS Class**: Central orchestrator that manages providers and exposes a unified API
2. **Provider Interface**: Common contract that all LMS providers must implement
3. **Configuration System**: Environment-based configuration management
4. **Type Definitions**: Shared data models across providers

### Provider Pattern
The SDK uses a provider pattern where each LMS integration is implemented as a separate provider class that implements the `LMSProvider` interface. This approach offers:
- **Isolation**: Each provider's implementation is isolated from others
- **Consistency**: Common interface ensures consistent behavior across providers
- **Extensibility**: New providers can be added without modifying existing code
- **Maintainability**: Changes to one provider don't affect others

## Extending the SDK

### Adding New Providers
1. Create a new provider class in `src/providers/`
2. Implement the `LMSProvider` interface
3. Add provider configuration in `src/types/index.ts`
4. Update configuration loading in `src/config/index.ts`
5. Add environment variables for the new provider on .env 
6. Register the provider in the main LMS class

Example of adding a new provider:
```typescript
// src/providers/newlms.ts
export class NewLMSProvider implements LMSProvider {
  constructor(config: LMSConfig) {
    // Initialize provider
  }

  async getCourses(): Promise<Course[]> {
    // Implement method
  }
  // Implement other required methods
}
```

### Adding New Features
1. **Update Interface**: Add new methods to the `LMSProvider` interface
2. **Implement in Providers**: Add the new functionality to each provider
3. **Update Main Class**: Add the new method to the main LMS class

Example of adding a new feature:
```typescript
// In src/types/index.ts
export interface LMSProvider {
  // Existing methods
  newFeature(): Promise<Result>;
}

// In main LMS class
public newFeature(providerName: string) {
  return this.getProvider(providerName).newFeature();
}
```

## Code Organization Best Practices

### Maintainability Patterns
1. **Single Responsibility**: Each provider handles only its specific LMS integration
2. **Interface Segregation**: Split large interfaces into smaller, focused ones
3. **Dependency Injection**: Configuration passed to providers
4. **Error Handling**: Consistent error handling across providers
5. **Type Safety**: Strong typing for all interfaces and methods

## Integration Guide

### Installation
```bash
npm install @your-org/lms-sdk
```

### Configuration
1. Create environment variables for your LMS:
```env
# Moodle Configuration
MOODLE_API_URL=https://your-moodle-instance.com
MOODLE_API_KEY=your-api-key
MOODLE_TOKEN_SERVICE=your-token-service

# Add other LMS configurations as needed
```

2. Initialize the SDK:
```typescript
import { LMS } from '@your-org/lms-sdk';

const lms = new LMS();

const moodleProvider = lms.getProvider("moodle");
// Use specific provider
const courses = await moodleProvider.getCourses();
```

### Server Integration
1. **Express.js Example**:
```typescript
import express from 'express';
import { LMS } from '@your-org/lms-sdk';

const app = express();
const lms = new LMS();

app.get('/courses/:provider', async (req, res) => {
  try {
    const moodleProvider = lms.getProvider("moodle");
	const courses = await moodleProvider.getCourses();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. **Environment Configuration**:
- Use `.env` files for development
- Use environment variables in production
- Consider using a configuration management service
