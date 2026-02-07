/**
 * Blockchain API for FarmTrace
 *
 * This module provides easy-to-use functions for recording
 * supply chain events on the blockchain.
 */

const { getBlockchain, TX_TYPES } = require('./blockchain');

// Record a new user registration
function recordUserRegistration(user) {
  const blockchain = getBlockchain();
  const tx = blockchain.addTransaction({
    type: TX_TYPES.USER_REGISTERED,
    userId: user.id,
    farmtraceId: user.farmtraceId,
    name: user.name,
    role: user.role,
    village: user.village,
    state: user.state
  });
  blockchain.minePendingTransactions();
  return tx;
}

// Record a new batch creation
function recordBatchCreation(batch, farmer) {
  const blockchain = getBlockchain();
  const tx = blockchain.addTransaction({
    type: TX_TYPES.BATCH_CREATED,
    batchId: batch.id,
    batchCode: batch.batchCode,
    crop: batch.crop,
    quantityKg: batch.quantityKg,
    basePricePerKg: batch.basePricePerKg,
    originVillage: batch.originVillage,
    originState: batch.originState,
    farmerId: farmer.id,
    farmerFarmtraceId: farmer.farmtraceId,
    farmerName: farmer.name
  });
  blockchain.minePendingTransactions();
  return tx;
}

// Record a transfer initiation
function recordTransferInitiated(transfer, batch, fromOwner, toOwner, transporter) {
  const blockchain = getBlockchain();
  const tx = blockchain.addTransaction({
    type: TX_TYPES.TRANSFER_INITIATED,
    transferId: transfer.id,
    batchCode: batch.batchCode,
    batchId: batch.id,
    fromOwnerId: fromOwner.farmtraceId,
    fromOwnerName: fromOwner.name,
    fromOwnerRole: fromOwner.role,
    toOwnerId: toOwner.farmtraceId,
    toOwnerName: toOwner.name,
    toOwnerRole: toOwner.role,
    transporterId: transporter?.farmtraceId || null,
    transporterName: transporter?.name || null,
    pickupLocation: transfer.pickupLocation,
    dropoffLocation: transfer.dropoffLocation,
    otpHash: require('crypto').createHash('sha256').update(transfer.otp).digest('hex') // Store hash, not actual OTP
  });
  blockchain.minePendingTransactions();
  return tx;
}

// Record transfer acceptance
function recordTransferAccepted(transfer, batch, newOwner) {
  const blockchain = getBlockchain();
  const tx = blockchain.addTransaction({
    type: TX_TYPES.TRANSFER_ACCEPTED,
    transferId: transfer.id,
    batchCode: batch.batchCode,
    newOwnerId: newOwner.farmtraceId,
    newOwnerName: newOwner.name,
    newOwnerRole: newOwner.role,
    newStatus: batch.status
  });
  blockchain.minePendingTransactions();
  return tx;
}

// Record pickup confirmation
function recordPickupConfirmed(transfer, batch, transporter) {
  const blockchain = getBlockchain();
  const tx = blockchain.addTransaction({
    type: TX_TYPES.PICKUP_CONFIRMED,
    transferId: transfer.id,
    batchCode: batch.batchCode,
    transporterId: transporter.farmtraceId,
    transporterName: transporter.name,
    pickupLocation: transfer.pickupLocation,
    pickupTime: transfer.pickupTime
  });
  blockchain.minePendingTransactions();
  return tx;
}

// Record dropoff confirmation
function recordDropoffConfirmed(transfer, batch, transporter) {
  const blockchain = getBlockchain();
  const tx = blockchain.addTransaction({
    type: TX_TYPES.DROPOFF_CONFIRMED,
    transferId: transfer.id,
    batchCode: batch.batchCode,
    transporterId: transporter.farmtraceId,
    transporterName: transporter.name,
    dropoffLocation: transfer.dropoffLocation,
    dropoffTime: transfer.dropoffTime
  });
  blockchain.minePendingTransactions();
  return tx;
}

// Record auction price set by APMC agent
function recordAuctionPriceSet(batch, apmcAgent, auctionPrice) {
  const blockchain = getBlockchain();
  const tx = blockchain.addTransaction({
    type: TX_TYPES.AUCTION_PRICE_SET,
    batchCode: batch.batchCode,
    batchId: batch.id,
    crop: batch.crop,
    basePricePerKg: batch.basePricePerKg,
    auctionPricePerKg: auctionPrice,
    priceDifference: auctionPrice - batch.basePricePerKg,
    percentageChange: (((auctionPrice - batch.basePricePerKg) / batch.basePricePerKg) * 100).toFixed(2),
    apmcAgentId: apmcAgent.farmtraceId,
    apmcAgentName: apmcAgent.name
  });
  blockchain.minePendingTransactions();
  return tx;
}

// Record retail price set
function recordRetailPriceSet(batch, retailer, retailPrice) {
  const blockchain = getBlockchain();
  const tx = blockchain.addTransaction({
    type: TX_TYPES.RETAIL_PRICE_SET,
    batchCode: batch.batchCode,
    batchId: batch.id,
    basePricePerKg: batch.basePricePerKg,
    auctionPricePerKg: batch.auctionPricePerKg,
    retailPricePerKg: retailPrice,
    retailerId: retailer.farmtraceId,
    retailerName: retailer.name
  });
  blockchain.minePendingTransactions();
  return tx;
}

// Get all blockchain transactions for a batch
function getBatchBlockchainHistory(batchCode) {
  const blockchain = getBlockchain();
  return blockchain.getTransactionsForBatch(batchCode);
}

// Get blockchain stats
function getBlockchainStats() {
  const blockchain = getBlockchain();
  return blockchain.getStats();
}

// Verify blockchain integrity
function verifyBlockchain() {
  const blockchain = getBlockchain();
  return {
    isValid: blockchain.isChainValid(),
    stats: blockchain.getStats()
  };
}

// Get full blockchain for audit
function getFullBlockchain() {
  const blockchain = getBlockchain();
  return blockchain.getFullChain();
}

module.exports = {
  recordUserRegistration,
  recordBatchCreation,
  recordTransferInitiated,
  recordTransferAccepted,
  recordPickupConfirmed,
  recordDropoffConfirmed,
  recordAuctionPriceSet,
  recordRetailPriceSet,
  getBatchBlockchainHistory,
  getBlockchainStats,
  verifyBlockchain,
  getFullBlockchain,
  TX_TYPES
};
