use arcis_imports::*;

#[encrypted]
mod circuits {
    use arcis_imports::*;

    /// Represents two encrypted commit hash bytes that will be merged
    /// into a single u16 chunk for a receiver.
    pub struct CommitHashChunk {
        pub upper_byte: u8,
        pub lower_byte: u8,
    }

    /// Re-encrypts two encrypted commit hash bytes for a receiver and
    /// combines them into a single 16-bit chunk. This is intentionally
    /// simple – in a real circuit you would operate over the entire
    /// commit hash array. The goal here is to demonstrate the Arcium
    /// wiring with domain-appropriate naming.
    #[instruction]
    pub fn share_commit_hash(
        receiver: Shared,
        input_ctxt: Enc<Shared, CommitHashChunk>,
    ) -> Enc<Shared, u16> {
        let chunk = input_ctxt.to_arcis();
        let combined = (chunk.upper_byte as u16) * 256 + chunk.lower_byte as u16;
        receiver.from_arcis(combined)
    }
}
