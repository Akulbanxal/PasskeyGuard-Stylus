import {
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";

import {
  SingleTxLimitSet,
  DailyLimitSet,
  TrustedRecipientSet,
  SpendRecorded,
  PolicyBlocked,
  PolicyApproved,
  OwnershipTransferred,
} from "../../generated/PolicyManager/PolicyManager";

import {
  PasskeyRegistered,
  TransactionExecuted,
} from "../../generated/PasskeyAccount/PasskeyAccount";

import {
  Policy,
  TrustedRecipient,
  PolicyEvent,
  SpendRecord,
  DailyStats,
  PasskeyAccount,
  Transaction,
} from "../../generated/schema";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDayString(timestamp: BigInt): string {
  // Simple UNIX day -> date string
  const daySeconds = BigInt.fromI32(86400);
  const dayNumber = timestamp.div(daySeconds).toI32();
  // Approximate: day 0 = 1970-01-01
  return "day-" + dayNumber.toString();
}

function getOrCreatePolicy(): Policy {
  let policy = Policy.load("global");
  if (!policy) {
    policy = new Policy("global");
    policy.singleTxLimit = BigInt.fromI32(0);
    policy.dailyLimit = BigInt.fromI32(0);
    policy.updatedAt = BigInt.fromI32(0);
    policy.updatedAtBlock = BigInt.fromI32(0);
  }
  return policy;
}

function getOrCreateDailyStats(event: ethereum.Event): DailyStats {
  const id = getDayString(event.block.timestamp);
  let stats = DailyStats.load(id);
  if (!stats) {
    stats = new DailyStats(id);
    stats.date = id;
    stats.txCount = BigInt.fromI32(0);
    stats.blockedCount = BigInt.fromI32(0);
    stats.totalVolume = BigInt.fromI32(0);
  }
  return stats;
}

// ─── PolicyManager Handlers ──────────────────────────────────────────────

export function handleSingleTxLimitSet(event: SingleTxLimitSet): void {
  const policy = getOrCreatePolicy();
  policy.singleTxLimit = event.params.newLimit;
  policy.updatedAt = event.block.timestamp;
  policy.updatedAtBlock = event.block.number;
  policy.save();
}

export function handleDailyLimitSet(event: DailyLimitSet): void {
  const policy = getOrCreatePolicy();
  policy.dailyLimit = event.params.newLimit;
  policy.updatedAt = event.block.timestamp;
  policy.updatedAtBlock = event.block.number;
  policy.save();
}

export function handleTrustedRecipientSet(event: TrustedRecipientSet): void {
  const id = event.params.recipient.toHexString();
  let recipient = TrustedRecipient.load(id);
  if (!recipient) {
    recipient = new TrustedRecipient(id);
  }
  recipient.trusted = event.params.trusted;
  recipient.setAt = event.block.timestamp;
  recipient.setAtBlock = event.block.number;
  recipient.save();
}

export function handleSpendRecorded(event: SpendRecorded): void {
  const id = event.transaction.hash.concatI32(event.logIndex.toI32());
  const record = new SpendRecord(id);
  record.account = event.params.account;
  record.amount = event.params.amount;
  record.dayBucket = event.params.dayBucket;
  record.totalDailySpent = event.params.totalDailySpent;
  record.blockNumber = event.block.number;
  record.blockTimestamp = event.block.timestamp;
  record.transactionHash = event.transaction.hash;
  record.save();
}

export function handlePolicyBlocked(event: PolicyBlocked): void {
  const id = event.transaction.hash.concatI32(event.logIndex.toI32());
  const policyEvent = new PolicyEvent(id);
  policyEvent.type = "BLOCKED";
  policyEvent.account = event.params.account;
  policyEvent.recipient = event.params.recipient;
  policyEvent.amount = event.params.amount;
  policyEvent.reason = event.params.reason;
  policyEvent.blockNumber = event.block.number;
  policyEvent.blockTimestamp = event.block.timestamp;
  policyEvent.transactionHash = event.transaction.hash;
  policyEvent.save();

  // Update daily stats
  const stats = getOrCreateDailyStats(event);
  stats.blockedCount = stats.blockedCount.plus(BigInt.fromI32(1));
  stats.save();
}

export function handlePolicyApproved(event: PolicyApproved): void {
  const id = event.transaction.hash.concatI32(event.logIndex.toI32());
  const policyEvent = new PolicyEvent(id);
  policyEvent.type = "APPROVED";
  policyEvent.account = event.params.account;
  policyEvent.recipient = event.params.recipient;
  policyEvent.amount = event.params.amount;
  policyEvent.reason = null;
  policyEvent.blockNumber = event.block.number;
  policyEvent.blockTimestamp = event.block.timestamp;
  policyEvent.transactionHash = event.transaction.hash;
  policyEvent.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  // Re-use policy entity to track current owner if needed
  const policy = getOrCreatePolicy();
  policy.updatedAt = event.block.timestamp;
  policy.updatedAtBlock = event.block.number;
  policy.save();
}

// ─── PasskeyAccount Handlers ─────────────────────────────────────────────

export function handlePasskeyRegistered(event: PasskeyRegistered): void {
  const id = event.params.account.toHexString();
  let account = PasskeyAccount.load(id);
  if (!account) {
    account = new PasskeyAccount(id);
    account.totalTransactions = BigInt.fromI32(0);
    account.totalBlocked = BigInt.fromI32(0);
  }
  account.pubKeyX = event.params.x;
  account.pubKeyY = event.params.y;
  account.registeredAt = event.block.timestamp;
  account.registeredAtBlock = event.block.number;
  account.save();
}

export function handleTransactionExecuted(event: TransactionExecuted): void {
  // Load or lazy-create account
  const accountId = event.address.toHexString();
  let account = PasskeyAccount.load(accountId);
  if (!account) {
    account = new PasskeyAccount(accountId);
    account.pubKeyX = Bytes.empty();
    account.pubKeyY = Bytes.empty();
    account.registeredAt = event.block.timestamp;
    account.registeredAtBlock = event.block.number;
    account.totalTransactions = BigInt.fromI32(0);
    account.totalBlocked = BigInt.fromI32(0);
  }
  account.totalTransactions = account.totalTransactions.plus(BigInt.fromI32(1));
  account.save();

  // Create transaction record
  const txId = event.transaction.hash.concatI32(event.logIndex.toI32());
  const tx = new Transaction(txId);
  tx.account = accountId;
  tx.recipient = event.params.recipient;
  tx.amount = event.params.amount;
  tx.nonce = event.params.nonce;
  tx.executor = event.params.executor;
  tx.blockNumber = event.block.number;
  tx.blockTimestamp = event.block.timestamp;
  tx.transactionHash = event.transaction.hash;
  tx.save();

  // Update daily stats
  const stats = getOrCreateDailyStats(event);
  stats.txCount = stats.txCount.plus(BigInt.fromI32(1));
  stats.totalVolume = stats.totalVolume.plus(event.params.amount);
  stats.save();
}
