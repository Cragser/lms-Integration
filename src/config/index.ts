import { LMSConfig } from '../types';

export function loadConfig(): Record<string, LMSConfig> {
  const configs: Record<string, LMSConfig> = {};

  // Load Moodle configuration if available
  if (process.env.MOODLE_API_URL) {
    configs.moodle = {
      type: 'moodle',
      baseUrl: process.env.MOODLE_API_URL,
      apiKey: process.env.MOODLE_API_KEY,
      providerConfig: {
        tokenService: process.env.MOODLE_TOKEN_SERVICE,
        restFormat: process.env.MOODLE_REST_FORMAT || 'json'
      }
    };
  }

  // Load Canvas configuration if available
  if (process.env.CANVAS_API_URL) {
    configs.canvas = {
      type: 'canvas',
      baseUrl: process.env.CANVAS_API_URL,
      apiKey: process.env.CANVAS_TOKEN,
      providerConfig: {
        apiVersion: process.env.CANVAS_API_VERSION || 'v1',
        accountId: process.env.CANVAS_ACCOUNT_ID
      }
    };
  }

  // Load Blackboard configuration if available
  if (process.env.BLACKBOARD_API_URL) {
    configs.blackboard = {
      type: 'blackboard',
      baseUrl: process.env.BLACKBOARD_API_URL,
      apiKey: process.env.BLACKBOARD_APP_KEY,
      providerConfig: {
        apiVersion: process.env.BLACKBOARD_API_VERSION || 'v1',
        domain: process.env.BLACKBOARD_DOMAIN,
        appKey: process.env.BLACKBOARD_APP_KEY,
        appSecret: process.env.BLACKBOARD_APP_SECRET
      }
    };
  }

  if (Object.keys(configs).length === 0) {
    throw new Error('No LMS configuration found. Please configure at least one LMS provider.');
  }

  return configs;
}