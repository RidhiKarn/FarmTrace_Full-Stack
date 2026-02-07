/**
 * FarmTrace Blockchain Implementation
 *
 * This is a custom blockchain for storing agricultural supply chain data.
 * Each transaction (batch creation, transfer, price update) is stored immutably.
 *
 * Security Features:
 * - SHA-256 cryptographic hashing
 * - Chain integrity verification
 * - Immutable records (tampering breaks the chain)
 * - Timestamped transactions
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Fix path for Next.js - use process.cwd() instead of __dirname
const BLOCKCHAIN_FILE = path.join(process.cwd(), 'blockchain', 'chain.json');
console.log('Blockchain file path:', BLOCKCHAIN_FILE);
const DIFFICULTY = 2; // Number of leading zeros required in hash

class Block {
  constructor(index, timestamp, transactions, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.nonce
      )
      .digest('hex');
  }

  // Proof of Work - mining the block
  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join('0');
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash}`);
  }
}

class FarmTraceBlockchain {
  constructor() {
    this.chain = this.loadChain();
    this.pendingTransactions = [];
  }

  // Load blockchain from file or create genesis block
  loadChain() {
    try {
      if (fs.existsSync(BLOCKCHAIN_FILE)) {
        const data = fs.readFileSync(BLOCKCHAIN_FILE, 'utf8');
        const chainData = JSON.parse(data);
        return chainData.chain || [this.createGenesisBlock()];
      }
    } catch (error) {
      console.error('Error loading blockchain:', error);
    }
    return [this.createGenesisBlock()];
  }

  // Save blockchain to file
  saveChain() {
    const data = {
      chain: this.chain,
      lastUpdated: new Date().toISOString(),
      totalBlocks: this.chain.length,
      totalTransactions: this.chain.reduce((sum, block) => sum + block.transactions.length, 0)
    };
    fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(data, null, 2));
  }

  createGenesisBlock() {
    const genesis = new Block(0, new Date().toISOString(), [{
      type: 'GENESIS',
      message: 'FarmTrace Jaipur Blockchain Genesis Block',
      createdAt: new Date().toISOString()
    }], '0');
    genesis.mineBlock(DIFFICULTY);
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Add a new transaction to pending list
  addTransaction(transaction) {
    const tx = {
      ...transaction,
      txId: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString()
    };
    this.pendingTransactions.push(tx);
    return tx;
  }

  // Mine pending transactions into a new block
  minePendingTransactions() {
    if (this.pendingTransactions.length === 0) {
      return null;
    }

    const block = new Block(
      this.chain.length,
      new Date().toISOString(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    block.mineBlock(DIFFICULTY);
    this.chain.push(block);
    this.pendingTransactions = [];
    this.saveChain();

    return block;
  }

  // Verify the integrity of the blockchain
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Recalculate hash and verify
      const recalculatedHash = crypto
        .createHash('sha256')
        .update(
          currentBlock.index +
          currentBlock.previousHash +
          currentBlock.timestamp +
          JSON.stringify(currentBlock.transactions) +
          currentBlock.nonce
        )
        .digest('hex');

      if (currentBlock.hash !== recalculatedHash) {
        console.error(`Block ${i} hash mismatch! Chain has been tampered.`);
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`Block ${i} previous hash mismatch! Chain is broken.`);
        return false;
      }
    }
    return true;
  }

  // Get all transactions of a specific type
  getTransactionsByType(type) {
    const transactions = [];
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.type === type) {
          transactions.push({
            ...tx,
            blockIndex: block.index,
            blockHash: block.hash
          });
        }
      }
    }
    return transactions;
  }

  // Get all transactions for a specific batch
  getTransactionsForBatch(batchCode) {
    const transactions = [];
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.batchCode === batchCode) {
          transactions.push({
            ...tx,
            blockIndex: block.index,
            blockHash: block.hash,
            blockTimestamp: block.timestamp
          });
        }
      }
    }
    return transactions;
  }

  // Get blockchain statistics
  getStats() {
    return {
      totalBlocks: this.chain.length,
      totalTransactions: this.chain.reduce((sum, block) => sum + block.transactions.length, 0),
      isValid: this.isChainValid(),
      lastBlockHash: this.getLatestBlock().hash,
      pendingTransactions: this.pendingTransactions.length
    };
  }

  // Get full chain for audit
  getFullChain() {
    return this.chain;
  }
}

// Transaction types
const TX_TYPES = {
  USER_REGISTERED: 'USER_REGISTERED',
  BATCH_CREATED: 'BATCH_CREATED',
  TRANSFER_INITIATED: 'TRANSFER_INITIATED',
  TRANSFER_ACCEPTED: 'TRANSFER_ACCEPTED',
  PICKUP_CONFIRMED: 'PICKUP_CONFIRMED',
  DROPOFF_CONFIRMED: 'DROPOFF_CONFIRMED',
  AUCTION_PRICE_SET: 'AUCTION_PRICE_SET',
  RETAIL_PRICE_SET: 'RETAIL_PRICE_SET'
};

// Singleton instance
let blockchainInstance = null;

function getBlockchain() {
  if (!blockchainInstance) {
    blockchainInstance = new FarmTraceBlockchain();
  }
  return blockchainInstance;
}

module.exports = {
  FarmTraceBlockchain,
  getBlockchain,
  TX_TYPES
};
