#!/usr/bin/env node
// reset-conversation.js - Reset conversation history
import { ConversationManager } from './conversation.js';

class ConversationReset {
  constructor() {
    this.conversation = new ConversationManager();
  }

  async resetConversation() {
    try {
      console.log('🔄 Checking for existing conversation...');

      const exists = await this.conversation.conversationExists();

      if (!exists) {
        console.log('ℹ️  No conversation history found. Nothing to reset.');
        return;
      }

      // Load current conversation to show stats
      const currentConversation = await this.conversation.loadConversation();
      console.log(`📊 Found conversation with ${currentConversation.totalExchanges} exchanges`);
      console.log(`📅 Created: ${currentConversation.created}`);
      console.log(`📅 Last updated: ${currentConversation.lastUpdated}`);

      // Reset conversation (creates backup)
      console.log('\n💾 Creating backup and resetting...');
      await this.conversation.resetConversation();

      console.log('✅ Conversation reset complete!');
      console.log('📦 Previous conversation backed up');
      console.log('🆕 Ready for fresh conversation');

    } catch (error) {
      console.error('❌ Reset failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute reset
const reset = new ConversationReset();
reset.resetConversation();
