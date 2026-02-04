// conversation.js - Conversation History Manager
import { promises as fs } from 'fs';
import path from 'path';

export class ConversationManager {
  constructor(conversationFile = '.hustle-conversation.json') {
    this.conversationFile = conversationFile;
    this.maxHistoryLength = 50; // Prevent unlimited growth
  }

  async loadConversation() {
    try {
      const data = await fs.readFile(this.conversationFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is corrupted, return fresh conversation
      return {
        messages: [],
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalExchanges: 0
      };
    }
  }

  async saveConversation(conversation) {
    conversation.lastUpdated = new Date().toISOString();

    // Trim conversation if too long
    if (conversation.messages.length > this.maxHistoryLength) {
      conversation.messages = conversation.messages.slice(-this.maxHistoryLength);
    }

    await fs.writeFile(
      this.conversationFile,
      JSON.stringify(conversation, null, 2),
      'utf8'
    );
  }

  addUserMessage(conversation, message) {
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    return conversation;
  }

  addAssistantMessage(conversation, content) {
    conversation.messages.push({
      role: 'assistant',
      content: content,
      timestamp: new Date().toISOString()
    });
    conversation.totalExchanges++;
    return conversation;
  }

  async resetConversation() {
    if (await this.conversationExists()) {
      // Backup current conversation
      const backup = `conversation-backup-${Date.now()}.json`;
      await fs.copyFile(this.conversationFile, backup);
    }

    // Delete current conversation
    try {
      await fs.unlink(this.conversationFile);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  }

  async conversationExists() {
    try {
      await fs.access(this.conversationFile);
      return true;
    } catch {
      return false;
    }
  }
}
