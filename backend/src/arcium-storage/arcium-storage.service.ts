import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import {
    getMXEPublicKey,
    RescueCipher,
    x25519,
} from '@arcium-hq/client';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Program ID from deployment on devnet
const PROGRAM_ID = 'SGn4NkCwTLFZ46HsKzNaPxobdzXFJ7LHNCea68kiL2u';

// IDL type definition
interface BulwarkStorage {
    address: string;
    instructions: any[];
}

/**
 * Audit storage data that will be stored on Solana devnet.
 * Most fields are PUBLIC and visible on Solscan - only commit hash is encrypted.
 */
export interface AuditStorageData {
    // Time estimate for audit
    minDays: number;        // Minimum days needed
    maxDays: number;        // Maximum days needed

    // Resource estimate
    minResources: number;   // Minimum auditors needed (0-255)
    maxResources: number;   // Maximum auditors needed (0-255)

    // Cost range in USD (e.g., 500 = $500, 1000 = $1000)
    minCostUsd: number;     // Minimum cost in USD
    maxCostUsd: number;     // Maximum cost in USD

    // Overall audit quality score (0-100)
    score: number;

    // Git commit hash (will be encrypted before storage)
    // Can be any length - will be converted to BigInt for Arcium encryption
    commitHash: string;
}

export interface StorageResult {
    success: boolean;
    reportId?: string;      // The unique report ID (u64 as string)
    transactionSignature?: string;
    explorerUrl?: string;   // Link to Solana Explorer
    message: string;
}

@Injectable()
export class ArciumStorageService implements OnModuleInit {
    private readonly logger = new Logger(ArciumStorageService.name);
    private program: Program<anchor.Idl> | null = null;
    private provider: anchor.AnchorProvider | null = null;
    private owner: Keypair | null = null;
    private mxePublicKey: Uint8Array | null = null;
    private connection: Connection | null = null;
    private isEnabled: boolean = false;

    constructor(private configService: ConfigService) {
        try {
            // Initialize Solana connection to devnet
            const rpcUrl =
                this.configService.get<string>('SOLANA_RPC_URL') ||
                'https://api.devnet.solana.com';
            this.connection = new Connection(rpcUrl, 'confirmed');

            // Load owner keypair from environment
            const privateKeyPath =
                this.configService.get<string>('SOLANA_KEYPAIR_PATH') ||
                `${os.homedir()}/.config/solana/id.json`;

            try {
                const keypairData = fs.readFileSync(privateKeyPath);
                this.owner = Keypair.fromSecretKey(
                    new Uint8Array(JSON.parse(keypairData.toString())),
                );
                this.logger.log(`Loaded keypair from ${privateKeyPath}`);
            } catch (error) {
                // Try reading from SOLANA_PRIVATE_KEY env var as JSON array
                const privateKeyEnv = this.configService.get<string>('SOLANA_PRIVATE_KEY');
                if (privateKeyEnv) {
                    try {
                        const keyArray = JSON.parse(privateKeyEnv);
                        this.owner = Keypair.fromSecretKey(new Uint8Array(keyArray));
                        this.logger.log('Loaded keypair from SOLANA_PRIVATE_KEY env var');
                    } catch (parseError) {
                        this.logger.warn(
                            'Failed to parse SOLANA_PRIVATE_KEY. Arcium Storage Service will be disabled.',
                        );
                        this.logger.warn(
                            'To enable Arcium Storage, provide either SOLANA_KEYPAIR_PATH or SOLANA_PRIVATE_KEY as JSON array.',
                        );
                        return; // Service disabled, but don't crash
                    }
                } else {
                    this.logger.warn(
                        'No Solana keypair found. Arcium Storage Service will be disabled.',
                    );
                    this.logger.warn(
                        'To enable Arcium Storage, set SOLANA_KEYPAIR_PATH or SOLANA_PRIVATE_KEY.',
                    );
                    return; // Service disabled, but don't crash
                }
            }

            // Initialize Anchor provider
            if (!this.owner) {
                return; // Should not happen, but safety check
            }

            const wallet = new anchor.Wallet(this.owner);
            this.provider = new anchor.AnchorProvider(
                this.connection,
                wallet,
                {
                    commitment: 'confirmed',
                },
            );

            // Load IDL from the program directory
            const possiblePaths = [
                this.configService.get<string>('ARCIUM_IDL_PATH'), // Custom path from env
                path.resolve(process.cwd(), '../../program/target/idl/bulwark_storage.json'), // From backend to program
                path.resolve(process.cwd(), '../program/target/idl/bulwark_storage.json'), // Alternative
                path.resolve(__dirname, '../../../program/target/idl/bulwark_storage.json'), // From dist
            ].filter(Boolean) as string[];

            let idl: anchor.Idl | null = null;
            let idlPath: string | null = null;

            for (const tryPath of possiblePaths) {
                try {
                    const idlContent = fs.readFileSync(tryPath, 'utf-8');
                    idl = JSON.parse(idlContent) as anchor.Idl;
                    idlPath = tryPath;
                    this.logger.log(`IDL loaded successfully from ${idlPath}`);
                    break;
                } catch (error) {
                    continue;
                }
            }

            if (!idlPath || !idl) {
                this.logger.warn(
                    `Could not load IDL from any of the attempted paths. Service will be disabled.`,
                );
                return;
            }

            // Initialize program
            const programId = new PublicKey(PROGRAM_ID);
            // @ts-ignore - Program constructor accepts (idl, provider) in newer versions
            this.program = new Program(idl, this.provider) as Program<anchor.Idl>;

            // Mark service as enabled if we got this far
            this.isEnabled = true;
            this.logger.log(`Arcium Storage Service initialized successfully`);
            this.logger.log(`Program ID: ${PROGRAM_ID}`);
            this.logger.log(`Wallet: ${this.owner.publicKey.toString()}`);
            this.logger.log(`Network: devnet`);
        } catch (error: any) {
            this.logger.warn(
                `Failed to initialize Arcium Storage Service: ${error.message}. Service will be disabled.`,
            );
            this.logger.warn(
                'To enable Arcium Storage, ensure SOLANA_KEYPAIR_PATH or SOLANA_PRIVATE_KEY is configured.',
            );
            // Service disabled, but don't crash - server can still start
        }
    }

    async onModuleInit() {
        if (!this.isEnabled) {
            this.logger.debug('Arcium Storage Service is disabled, skipping MXE public key fetch');
            return;
        }

        // Fetch MXE public key on initialization
        try {
            await this.fetchMXEPublicKey();
            this.logger.log('MXE public key fetched successfully');
        } catch (error: any) {
            this.logger.warn(
                `Failed to fetch MXE public key on init: ${error.message}. Will retry on first use.`,
            );
        }
    }

    /**
     * Fetch MXE public key with retry logic
     */
    private async fetchMXEPublicKey(maxRetries: number = 10): Promise<void> {
        if (!this.isEnabled || !this.program || !this.provider) {
            throw new Error('Arcium Storage Service is not enabled');
        }

        const programId = this.program.programId;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const mxePublicKey = await getMXEPublicKey(this.provider as any, programId);
                if (mxePublicKey) {
                    this.mxePublicKey = mxePublicKey;
                    this.logger.debug(`MXE x25519 pubkey: ${Buffer.from(mxePublicKey).toString('hex').slice(0, 32)}...`);
                    return;
                }
            } catch (error: any) {
                this.logger.debug(
                    `Attempt ${attempt}/${maxRetries} failed to fetch MXE public key: ${error.message}`,
                );
            }

            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
            }
        }

        throw new Error(
            `Failed to fetch MXE public key after ${maxRetries} attempts`,
        );
    }

    /**
     * Ensure MXE public key is available
     */
    private async ensureMXEPublicKey(): Promise<void> {
        if (!this.isEnabled) {
            throw new Error('Arcium Storage Service is not enabled');
        }

        if (!this.mxePublicKey) {
            await this.fetchMXEPublicKey();
        }
    }

    /**
     * Encrypt commit hash using Arcium's x25519 and RescueCipher
     */
    private encryptCommitHash(commitHash: string): number[] {
        if (!this.mxePublicKey) {
            throw new Error('MXE public key not available');
        }

        // Convert commit hash string to BigInt (hex string to number)
        // This matches the test pattern: BigInt("0x" + commitHash)
        const commitHashBigInt = BigInt('0x' + commitHash);

        // Generate x25519 keypair and shared secret
        const senderPrivateKey = x25519.utils.randomSecretKey();
        const senderPublicKey = x25519.getPublicKey(senderPrivateKey);
        const sharedSecret = x25519.getSharedSecret(senderPrivateKey, this.mxePublicKey);

        // Initialize RescueCipher with shared secret
        const cipher = new RescueCipher(sharedSecret);

        // Encrypt the commit hash
        const nonce = randomBytes(16);
        const encryptedResult = cipher.encrypt([commitHashBigInt], nonce);

        // Extract the ciphertext (first element of the result)
        const ciphertext = encryptedResult[0];

        // Convert to u8 array (32 bytes required by program)
        const encryptedArray: number[] = Array.from(ciphertext as any).map((x: any) => Number(x));

        this.logger.debug(`Encrypted commit hash: ${commitHash} -> ${encryptedArray.length} bytes`);

        return encryptedArray;
    }

    /**
     * Store audit analysis results to Solana devnet with Arcium encryption.
     * 
     * This creates a permanent, immutable record on Solana with:
     * - PUBLIC: pricing, effort estimates, score (visible on Solscan)
     * - ENCRYPTED: commit hash (only decryptable with private key)
     */
    async storeAuditResults(
        data: AuditStorageData,
    ): Promise<StorageResult> {
        if (!this.isEnabled) {
            this.logger.warn('Arcium Storage Service is disabled. Cannot store audit results.');
            return {
                success: false,
                message: 'Arcium Storage Service is not configured. Please set SOLANA_KEYPAIR_PATH or SOLANA_PRIVATE_KEY.',
            };
        }

        if (!this.program || !this.provider || !this.owner) {
            this.logger.warn('Arcium Storage Service is not properly initialized.');
            return {
                success: false,
                message: 'Arcium Storage Service is not properly initialized.',
            };
        }

        try {
            // Ensure MXE public key is available
            await this.ensureMXEPublicKey();

            // Validate input data
            if (data.score < 0 || data.score > 100) {
                throw new Error(`Invalid score: ${data.score}. Must be 0-100.`);
            }
            if (data.minResources < 0 || data.minResources > 255) {
                throw new Error(`Invalid minResources: ${data.minResources}. Must be 0-255.`);
            }
            if (data.maxResources < 0 || data.maxResources > 255) {
                throw new Error(`Invalid maxResources: ${data.maxResources}. Must be 0-255.`);
            }
            if (!data.commitHash || data.commitHash.length === 0) {
                throw new Error('Commit hash is required');
            }

            // Generate unique report ID based on timestamp
            const reportId = new anchor.BN(Math.floor(Date.now() / 1000));

            // Encrypt the commit hash using Arcium
            const encryptedCommitHash = this.encryptCommitHash(data.commitHash);

            // Derive the PDA for this audit record
            const auditRecordPDA = PublicKey.findProgramAddressSync(
                [
                    Buffer.from('audit_record'),
                    reportId.toArrayLike(Buffer, 'le', 8),
                ],
                this.program.programId,
            )[0];

            this.logger.log(`Storing audit results to Solana devnet...`);
            this.logger.log(`  Commit hash: ${data.commitHash} (encrypted)`);
            this.logger.log(`  Effort: ${data.minDays}-${data.maxDays} days`);
            this.logger.log(`  Team: ${data.minResources}-${data.maxResources} auditors`);
            this.logger.log(`  Cost: $${data.minCostUsd} - $${data.maxCostUsd} USD`);
            this.logger.log(`  Score: ${data.score}/100`);
            this.logger.log(`  Audit Record PDA: ${auditRecordPDA.toString()}`);

            // Call the store_audit_results instruction
            // Parameters match the test: report_id, min_days, max_days, min_resources, max_resources, min_cost, max_cost, score, encrypted_commit_hash
            const signature = await (this.program.methods as any)
                .storeAuditResults(
                    reportId,
                    data.minDays,
                    data.maxDays,
                    data.minResources,
                    data.maxResources,
                    new anchor.BN(data.minCostUsd),
                    new anchor.BN(data.maxCostUsd),
                    data.score,
                    encryptedCommitHash,
                )
                .accounts({
                    payer: this.owner.publicKey,
                    auditRecord: auditRecordPDA,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .signers([this.owner])
                .rpc({ commitment: 'confirmed' });

            const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

            this.logger.log(`✅ Audit results stored successfully!`);
            this.logger.log(`  Transaction: ${signature}`);
            this.logger.log(`  Explorer: ${explorerUrl}`);

            return {
                success: true,
                reportId: reportId.toString(),
                transactionSignature: signature,
                explorerUrl,
                message: `Successfully stored audit results for commit ${data.commitHash}`,
            };
        } catch (error: any) {
            this.logger.error(`Failed to store audit results: ${error.message}`, error.stack);
            return {
                success: false,
                message: `Failed to store audit results: ${error.message}`,
            };
        }
    }

    /**
     * Check if the service is enabled and ready to use
     */
    isServiceEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Get the current wallet address being used
     */
    getWalletAddress(): string | null {
        return this.owner ? this.owner.publicKey.toString() : null;
    }
}
