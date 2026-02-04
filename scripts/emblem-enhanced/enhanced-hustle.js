#!/usr/bin/env node
// enhanced-hustle.js - Main Application
import { program } from 'commander';
import fetch from 'node-fetch';
import { EmblemAuth } from './auth.js';
import { ConversationManager } from './conversation.js';

class EnhancedHustle {
  constructor() {
    this.auth = new EmblemAuth();
    this.conversation = new ConversationManager();
    this.chatEndpoint = 'https://agenthustle.ai/api/chat';
  }

  async queryHustle(password, message) {
    try {
      console.log('🔐 Authenticating...');
      const authData = await this.auth.authenticate(password);

      console.log(`📱 VaultId: ${authData.vaultId}`);

      console.log('💾 Loading conversation history...');
      let conversation = await this.conversation.loadConversation();

      // Add user message to history
      conversation = this.conversation.addUserMessage(conversation, message);

      console.log('🚀 Querying Hustle AI...');
      const response = await fetch(this.chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.authToken}`
        },
        body: JSON.stringify({
          messages: conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          vaultId: authData.vaultId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('📡 Processing response stream...');
      const responseText = await response.text();

      // Parse SSE response - extract content from 0: lines
      const contentChunks = [];
      const lines = responseText.split('\n');

      for (const line of lines) {
        if (line.startsWith('0:"')) {
          // Remove 0:" prefix and trailing "
          let content = line.slice(3, -1);
          // Handle escaped characters
          content = content.replace(/\\"/g, '"').replace(/\\n/g, '\n');
          contentChunks.push(content);
        }
      }

      const fullResponse = contentChunks.join('');

      if (fullResponse.trim()) {
        // Add assistant response to history
        conversation = this.conversation.addAssistantMessage(conversation, fullResponse);

        // Save updated conversation
        await this.conversation.saveConversation(conversation);

        console.log('\n🤖 Hustle AI Response:');
        console.log('─'.repeat(50));
        console.log(fullResponse);
        console.log('─'.repeat(50));
        console.log(`💬 Total exchanges: ${conversation.totalExchanges}`);
      } else {
        console.log('⚠️  Empty response received');
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// CLI Setup
program
  .name('enhanced-hustle')
  .description('Stateful conversation with EmblemVault Hustle AI')
  .version('1.1.1')
  .requiredOption('-p, --password <password>', 'EmblemVault password')
  .requiredOption('-m, --message <message>', 'Message to send to Hustle AI')
  .parse();

const options = program.opts();
const hustle = new EnhancedHustle();

hustle.queryHustle(options.password, options.message);
