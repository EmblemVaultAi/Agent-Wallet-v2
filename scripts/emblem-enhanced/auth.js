// auth.js - EmblemVault Authentication Module
import fetch from 'node-fetch';

export class EmblemAuth {
  constructor() {
    this.authEndpoint = 'https://auth.emblemvault.ai/api/auth/password/verify';
    this.appId = 'emblem-agent-wallet';
  }

  async authenticate(password) {
    try {
      const response = await fetch(this.authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: this.appId,
          password: password
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error('Authentication failed');
      }

      return {
        vaultId: data.session.user.vaultId,
        authToken: data.session.authToken,
        expiresAt: data.session.expiresAt
      };
    } catch (error) {
      throw new Error(`Auth error: ${error.message}`);
    }
  }
}
