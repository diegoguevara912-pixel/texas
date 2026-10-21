import { toJson } from '../db/index.js';
import { ipHash } from './security.js';

export async function audit(db, req, action, entity, entityId, meta, userId = req.user?.id) {
  try {
    await db('audit_log').insert({
      user_id: userId ?? null,
      action,
      entity,
      entity_id: entityId == null ? null : String(entityId),
      meta: meta ? toJson(meta) : null,
      ip_hash: ipHash(req),
    });
  } catch (e) {
    console.error('[audit] no se pudo registrar', action, e.message);
  }
}
