import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BulwarkStorage } from "../target/types/bulwark_storage";
import { PublicKey } from "@solana/web3.js";
import {
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgAddress,
  getCompDefAccAddress,
  getMXEAccAddress,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";

async function main() {
  // Configure for devnet
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  
  const owner = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(`${os.homedir()}/.config/solana/id.json`).toString()))
  );
  
  const wallet = new anchor.Wallet(owner);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  
  const program = new anchor.Program<BulwarkStorage>(
    require("../target/idl/bulwark_storage.json") as anchor.Idl,
    provider
  );

  console.log("🚀 Initializing computation definitions on devnet...");
  console.log("Program ID:", program.programId.toString());

  // Initialize store_audit_results computation definition
  const baseSeedCompDefAcc = getArciumAccountBaseSeed("ComputationDefinitionAccount");
  const offset = getCompDefAccOffset("store_audit_results");
  const compDefPDA = PublicKey.findProgramAddressSync(
    [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
    getArciumProgAddress()
  )[0];

  console.log("Comp def PDA:", compDefPDA.toString());

  try {
    const sig = await program.methods
      .initAuditStorageCompDefs()
      .accounts({
        compDefAccount: compDefPDA,
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(program.programId),
      })
      .signers([owner])
      .rpc({
        commitment: "confirmed",
      });
    
    console.log("✅ Computation definitions initialized successfully!");
    console.log("Transaction signature:", sig);
  } catch (error) {
    console.error("❌ Error initializing computation definitions:", error);
  }
}

main().catch(console.error);
