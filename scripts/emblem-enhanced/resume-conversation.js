#!/usr/bin/env node
// resume-conversation.js - Resume conversation from last state
import { program } from 'commander';
import fetch from 'node-fetch';
import { EmblemAuth } from './auth.js';
import { ConversationManager } from './conversation.js';

class ResumeHustle {
  constructor() {
    this.auth = new EmblemAuth();
    this.conversation = new ConversationManager();
    this.chatEndpoint = 'https://agenthustle.ai/api/chat';
  }

  async resumeConversation(password, message) {
    try {
      console.log('🔄 Resuming conversation...');

      // Load existing conversation
      const conversationData = await this.conversation.loadConversation();

      if (conversationData.messages.length === 0) {
        console.log('⚠️  No existing conversation found. Starting fresh.');
      } else {
        console.log(`📚 Found ${conversationData.totalExchanges} previous exchanges`);
        console.log(`📅 Last updated: ${conversationData.lastUpdated}`);

        // Show last few exchanges for context
        const recentMessages = conversationData.messages.slice(-4);
        console.log('\n🔍 Recent conversation context:');
        console.log('─'.repeat(50));

        for (const msg of recentMessages) {
          const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
          const preview = msg.content.length > 100
            ? msg.content.substring(0, 100) + '...'
            : msg.content;
          console.log(`${role}: ${preview}`);
        }
        console.log('─'.repeat(50));
      }

      // Continue conversation with new message
      console.log('\n🔐 Authenticating...');
      const authData = await this.auth.authenticate(password);

      console.log(`📱 VaultId: ${authData.vaultId}`);

      // Add new user message
      const updatedConversation = this.conversation.addUserMessage(conversationData, message);

      console.log('🚀 Sending to Hustle AI...');
      const response = await fetch(this.chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.authToken}`
        },
        body: JSON.stringify({
          messages: updatedConversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          vaultId: authData.vaultId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('📡 Processing response...');
      const responseText = await response.text();

      // Parse SSE response
      const contentChunks = [];
      const lines = responseText.split('\n');

      for (const line of lines) {
        if (line.startsWith('0:"')) {
          let content = line.slice(3, -1);
          content = content.replace(/\\"/g, '"').replace(/\\n/g, '\n');
          contentChunks.push(content);
        }
      }

      const fullResponse = contentChunks.join('');

      if (fullResponse.trim()) {
        // Add assistant response
        const finalConversation = this.conversation.addAssistantMessage(updatedConversation, fullResponse);

        // Save updated conversation
        await this.conversation.saveConversation(finalConversation);

        console.log('\n🤖 Hustle AI Response:');
        console.log('─'.repeat(50));
        console.log(fullResponse);
        console.log('─'.repeat(50));
        console.log(`💬 Total exchanges: ${finalConversation.totalExchanges}`);
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
  .name('resume-conversation')
  .description('Resume conversation with EmblemVault Hustle AI')
  .version('1.0.0')
  .requiredOption('-p, --password <password>', 'EmblemVault password')
  .requiredOption('-m, --message <message>', 'New message to continue conversation')
  .parse();

const options = program.opts();
const resumeHustle = new ResumeHustle();

resumeHustle.resumeConversation(options.password, options.message);
