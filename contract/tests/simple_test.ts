import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BulwarkStorage } from "../target/types/bulwark_storage";
import { expect } from "chai";

describe("BulwarkStorage - Simple Test", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .BulwarkStorage as Program<BulwarkStorage>;

  it("Program loads successfully", async () => {
    // Just test that the program loads without errors
    expect(program).to.not.be.undefined;
    expect(program.programId).to.not.be.undefined;
    console.log("✅ Program loaded successfully");
    console.log("Program ID:", program.programId.toString());
  });

  it("Has required methods", async () => {
    // Test that our methods exist
    expect(program.methods.storeAuditResults).to.not.be.undefined;
    expect(program.methods.retrieveByCommit).to.not.be.undefined;
    expect(program.methods.initAuditStorageCompDefs).to.not.be.undefined;
    console.log("✅ All required methods are available");
  });
});
