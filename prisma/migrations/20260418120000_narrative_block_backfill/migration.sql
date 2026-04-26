-- ─────────────────────────────────────────────────────────────────────────────
-- narrative_block_backfill
--
-- Sessões em andamento criadas ANTES do refactor v4 não têm 'NARRATIVE' em
-- pending_blocks. Esta migration:
--   1) Injeta 'NARRATIVE' antes de 'LEAD' em pending_blocks (idempotente).
--   2) Reroteia sessões cujo current_question_id aponta para Q105 (chain
--      removido em v4) para Q099 (último opcional do bloco NARRATIVE).
--
-- Idempotência: ambas as operações usam guards (NOT 'NARRATIVE' = ANY(...))
-- e podem ser reexecutadas sem efeito colateral.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Inject NARRATIVE before LEAD in pending_blocks for in-progress sessions.
UPDATE sessions s
SET pending_blocks = (
  SELECT array_agg(block ORDER BY ord)
  FROM (
    SELECT block, ord
    FROM unnest(s.pending_blocks) WITH ORDINALITY AS u(block, ord)
    WHERE block <> 'LEAD'
    UNION ALL
    SELECT 'NARRATIVE'::text, (
      SELECT MIN(u2.ord) - 0.5
      FROM unnest(s.pending_blocks) WITH ORDINALITY AS u2(block, ord)
      WHERE block = 'LEAD'
    )
    UNION ALL
    SELECT 'LEAD'::text, (
      SELECT MIN(u3.ord)
      FROM unnest(s.pending_blocks) WITH ORDINALITY AS u3(block, ord)
      WHERE block = 'LEAD'
    )
  ) sub
)
WHERE 'LEAD' = ANY(s.pending_blocks)
  AND NOT 'NARRATIVE' = ANY(s.pending_blocks);

-- 2) Reroute sessions stuck on Q105 → Q099 (Q105 is no longer reachable).
UPDATE sessions
SET current_question_id = (SELECT id FROM questions WHERE code = 'Q099')
WHERE current_question_id = (SELECT id FROM questions WHERE code = 'Q105')
  AND EXISTS (SELECT 1 FROM questions WHERE code = 'Q099');

-- 3) For sessions whose current_block is still LEAD/NARRATIVE-incompatible
--    after step 1, recompute current_block to match pending_blocks[0].
UPDATE sessions
SET current_block = pending_blocks[1]
WHERE current_block IS DISTINCT FROM pending_blocks[1]
  AND array_length(pending_blocks, 1) > 0
  AND status = 'IN_PROGRESS';
