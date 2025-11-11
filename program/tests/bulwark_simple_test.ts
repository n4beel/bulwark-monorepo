import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BulwarkStorage } from "../target/types/bulwark_storage";
import { randomBytes } from "crypto";
import {
  RescueCipher,
  x25519,
  getMXEPublicKey,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";
import { expect } from "chai";

describe("BulwarkStorage - Simple Storage Test (Arcium Encryption)", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .BulwarkStorage as Program<BulwarkStorage>;
  const provider = anchor.getProvider();

  it("can store audit data with Arcium-encrypted commit hash on devnet!", async () => {
    const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

    console.log("\n" + "═".repeat(70));
    console.log("🔐 BULWARK AUDIT STORAGE - Powered by Arcium Encryption");
    console.log("═".repeat(70));
    console.log("User wallet:", owner.publicKey.toString());

    // ═══════════════════════════════════════════════════════════════════
    // Step 1: Get MXE Public Key (Proves Arcium Integration)
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n🔑 Step 1: Fetching Arcium MXE public key...");
    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );
    console.log("✅ MXE x25519 pubkey:", Buffer.from(mxePublicKey).toString('hex').slice(0, 32) + "...");

    // ═══════════════════════════════════════════════════════════════════
    // Step 2: Generate Encryption Keys (Using Arcium's x25519)
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n🔐 Step 2: Setting up Arcium encryption...");
    const senderPrivateKey = x25519.utils.randomSecretKey();
    const senderPublicKey = x25519.getPublicKey(senderPrivateKey);
    const sharedSecret = x25519.getSharedSecret(senderPrivateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);
    console.log("✅ Arcium RescueCipher initialized");

    // ═══════════════════════════════════════════════════════════════════
    // Step 3: Prepare Audit Data (Plaintext - Will be Public)
    // ═══════════════════════════════════════════════════════════════════

    const auditData = {
      report_id: BigInt(Math.floor(Date.now() / 1000)), // Unique report ID based on timestamp
      min_days: 7,
      max_days: 14,
      min_resources: 2,
      max_resources: 4,
      min_cost_usd: BigInt(500), // Minimum cost in USD
      max_cost_usd: BigInt(1000), // Maximum cost in USD
      score: 85, // Audit score 0-100
    };

    console.log("\n📊 Step 3: PUBLIC Audit Data (will be visible on Solscan):");
    console.log("  Report ID:", auditData.report_id.toString());
    console.log("  Effort Estimate:", auditData.min_days, "-", auditData.max_days, "days");
    console.log("  Team Size:", auditData.min_resources, "-", auditData.max_resources, "auditors");
    console.log("  Cost Range: $" + Number(auditData.min_cost_usd) + " - $" + Number(auditData.max_cost_usd) + " USD");
    console.log("  Audit Score:", auditData.score + "/100");

    // ═══════════════════════════════════════════════════════════════════
    // Step 4: Encrypt Commit Hash (Using Arcium RescueCipher)
    // ═══════════════════════════════════════════════════════════════════

    const commitHash = "abc123def456789";  // Shorter hash for Arcium encryption limits
    console.log("\n🔒 Step 4: PRIVATE Data (encrypting with Arcium):");
    console.log("  Original commit hash:", commitHash);

    // Convert commit hash to BigInt for Arcium encryption (must fit in field element)
    const commitHashBigInt = BigInt("0x" + commitHash);
    const nonce = randomBytes(16);

    // Encrypt using Arcium's RescueCipher
    const encryptedCommitHash = cipher.encrypt([commitHashBigInt], nonce)[0];

    console.log("  Encrypted with Arcium RescueCipher:");
    console.log("    " + Buffer.from(encryptedCommitHash).toString('hex').slice(0, 64) + "...");
    console.log("  ✓ Protected by Arcium encryption!");

    // ═══════════════════════════════════════════════════════════════════
    // Step 5: Store on Solana (Devnet)
    // ═══════════════════════════════════════════════════════════════════

    console.log("\n📝 Step 5: Storing audit data on Solana devnet...");

    const auditRecordPDA = PublicKey.findProgramAddressSync(
      [
        Buffer.from("audit_record"),
        new anchor.BN(auditData.report_id.toString()).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    )[0];

    console.log("  Audit Record PDA:", auditRecordPDA.toString());

    try {
      const storeSig = await program.methods
        .storeAuditResults(
          new anchor.BN(auditData.report_id.toString()),
          auditData.min_days,
          auditData.max_days,
          auditData.min_resources,
          auditData.max_resources,
          new anchor.BN(auditData.min_cost_usd.toString()),
          new anchor.BN(auditData.max_cost_usd.toString()),
          auditData.score,
          Array.from(encryptedCommitHash) // Arcium-encrypted commit hash
        )
        .accounts({
          payer: owner.publicKey,
          auditRecord: auditRecordPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc({ commitment: "confirmed" });

      console.log("  ✅ Transaction confirmed!");

      console.log("\n" + "═".repeat(70));
      console.log("🎉 SUCCESS! Audit data stored on devnet with Arcium encryption!");
      console.log("═".repeat(70));

      console.log("\n🔗 BLOCKCHAIN EXPLORER LINKS:");
      console.log("-".repeat(70));
      console.log("\n📄 Transaction (Solana Explorer):");
      console.log(`   https://explorer.solana.com/tx/${storeSig}?cluster=devnet`);

      console.log("\n📦 Audit Record Account (Solana Explorer):");
      console.log(`   https://explorer.solana.com/address/${auditRecordPDA.toString()}?cluster=devnet`);

      console.log("\n🏛️  Bulwark Storage Program:");
      console.log(`   https://explorer.solana.com/address/${program.programId.toString()}?cluster=devnet`);
      console.log("-".repeat(70));

      // ═══════════════════════════════════════════════════════════════════
      // Step 6: Retrieve and Verify Data
      // ═══════════════════════════════════════════════════════════════════

      console.log("\n📖 Step 6: Retrieving stored data from blockchain...");
      const storedRecord = await program.account.auditRecord.fetch(auditRecordPDA);

      console.log("\n✅ PUBLIC Data Retrieved (anyone can see this on Solscan):");
      console.log("  Report ID:", storedRecord.reportId.toString());
      console.log("  Effort:", storedRecord.minDays, "-", storedRecord.maxDays, "days");
      console.log("  Resources:", storedRecord.minResources, "-", storedRecord.maxResources, "auditors");
      console.log("  Cost Range: $" + storedRecord.minCostUsd.toNumber() + " - $" + storedRecord.maxCostUsd.toNumber() + " USD");
      console.log("  Audit Score:", storedRecord.score + "/100");

      // Verify plaintext data
      expect(storedRecord.reportId.toString()).to.equal(auditData.report_id.toString());
      expect(storedRecord.minDays).to.equal(auditData.min_days);
      expect(storedRecord.maxDays).to.equal(auditData.max_days);
      expect(storedRecord.minResources).to.equal(auditData.min_resources);
      expect(storedRecord.maxResources).to.equal(auditData.max_resources);
      expect(storedRecord.minCostUsd.toString()).to.equal(auditData.min_cost_usd.toString());
      expect(storedRecord.maxCostUsd.toString()).to.equal(auditData.max_cost_usd.toString());
      expect(storedRecord.score).to.equal(auditData.score);

      console.log("\n🔒 PRIVATE Data (encrypted on-chain with Arcium):");
      const encryptedHex = Buffer.from(storedRecord.encryptedCommitHash).toString('hex');
      console.log("  Encrypted commit hash:", encryptedHex.slice(0, 64) + "...");

      // Decrypt the commit hash (only possible with private key)
      console.log("\n🔓 Step 7: Decrypting commit hash (with private key)...");
      const decryptedCommitHashBigInt = cipher.decrypt(
        [new Uint8Array(storedRecord.encryptedCommitHash)],
        nonce
      )[0];

      const decryptedCommitHash = decryptedCommitHashBigInt.toString(16);
      console.log("  Decrypted commit hash:", decryptedCommitHash);
      console.log("  ✓ Matches original:", decryptedCommitHash === commitHash ? "YES ✅" : "NO ❌");

      expect(decryptedCommitHash).to.equal(commitHash);

      console.log("\n" + "═".repeat(70));
      console.log("🎉 ALL TESTS PASSED!");
      console.log("═".repeat(70));

      console.log("\n📋 SUMMARY - What This Demonstrates:");
      console.log("-".repeat(70));
      console.log("✅ Arcium Integration:");
      console.log("   • Used Arcium's x25519 key exchange");
      console.log("   • Used Arcium's RescueCipher for encryption");
      console.log("   • Retrieved MXE public key from Arcium network");
      console.log("\n✅ Transparency:");
      console.log("   • Audit pricing visible to all on Solscan");
      console.log("   • Clients can verify costs and effort estimates");
      console.log("   • Professional, verifiable audit records");
      console.log("\n✅ Privacy:");
      console.log("   • Commit hash encrypted with Arcium");
      console.log("   • Project identity stays confidential");
      console.log("   • Only key holder can decrypt");
      console.log("\n✅ On-Chain Storage:");
      console.log("   • Data stored directly on Solana");
      console.log("   • Permanent, immutable records");
      console.log("   • Queryable via RPC or Solscan");
      console.log("═".repeat(70));

    } catch (error) {
      console.error("\n❌ Error storing audit data:");
      console.error(error);
      throw error;
    }
  });
});

async function getMXEPublicKeyWithRetry(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
  maxRetries: number = 10,
  retryDelayMs: number = 500
): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const mxePublicKey = await getMXEPublicKey(provider, programId);
      if (mxePublicKey) {
        return mxePublicKey;
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch MXE public key after ${maxRetries} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
  throw new Error(`Failed to fetch MXE public key after ${maxRetries} attempts`);
}

function readKpJson(keypairPath: string): anchor.web3.Keypair {
  const kp = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  return anchor.web3.Keypair.fromSecretKey(new Uint8Array(kp));
}

