import { Injectable } from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class AuditService {
  constructor(private readonly db: DatabaseService) {}
  async record(input: { schoolId: string; actorUserId: string; action: string; entityType: string; entityId: string; metadata?: object }, client?: PoolClient) {
    const executor = client ?? this.db.pool;
    await executor.query(
      "INSERT INTO audit_logs (school_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)",
      [input.schoolId, input.actorUserId, input.action, input.entityType, input.entityId, input.metadata ?? {}],
    );
  }
}
