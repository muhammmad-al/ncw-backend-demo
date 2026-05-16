// FOR SECURITY RESEARCH ONLY — NOT FOR PRODUCTION USE
//
// This service records key-migration intent and outcomes for demo/audit purposes.
// It deliberately never accepts or returns private-key material. The actual
// Full Key Takeover is performed client-side by the NCW JS SDK (which runs the
// MPC reconstruction in the browser), so the server is only an audit witness.
import { randomUUID } from "crypto";

export interface MigrationStartRecord {
  migrationId: string;
  sub: string;
  walletId: string;
  assetId: string;
  startedAt: string;
}

export interface MigrationCompleteRecord {
  migrationId: string;
  completedAt: string;
  fireblocksAddress: string;
  dynamicAddress: string;
  addressesMatch: boolean;
}

export class MigrationService {
  private readonly active = new Map<string, MigrationStartRecord>();
  private readonly completed: MigrationCompleteRecord[] = [];

  start(sub: string, walletId: string, assetId: string): MigrationStartRecord {
    const record: MigrationStartRecord = {
      migrationId: randomUUID(),
      sub,
      walletId,
      assetId,
      startedAt: new Date().toISOString(),
    };
    this.active.set(record.migrationId, record);
    console.log(
      "[migration] start",
      JSON.stringify({
        migrationId: record.migrationId,
        sub,
        walletId,
        assetId,
      }),
    );
    return record;
  }

  complete(
    sub: string,
    migrationId: string,
    fireblocksAddress: string,
    dynamicAddress: string,
  ): MigrationCompleteRecord {
    const start = this.active.get(migrationId);
    if (!start) {
      throw new Error("migration not found or already completed");
    }
    if (start.sub !== sub) {
      throw new Error("migration does not belong to caller");
    }
    const addressesMatch =
      fireblocksAddress.toLowerCase() === dynamicAddress.toLowerCase();
    const record: MigrationCompleteRecord = {
      migrationId,
      completedAt: new Date().toISOString(),
      fireblocksAddress,
      dynamicAddress,
      addressesMatch,
    };
    this.active.delete(migrationId);
    this.completed.push(record);
    console.log(
      "[migration] complete",
      JSON.stringify({
        migrationId,
        sub,
        walletId: start.walletId,
        assetId: start.assetId,
        addressesMatch,
      }),
    );
    return record;
  }
}
