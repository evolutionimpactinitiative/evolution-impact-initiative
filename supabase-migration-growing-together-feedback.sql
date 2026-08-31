-- ============================================
-- Growing Together — baseline instrument + post-session feedback
-- ============================================
-- Slice 5 wires impact measurement into the programme:
--
-- 1. New outcome_instrument "GT_BASELINE" — 6 statements from spec §14,
--    each 1-5 Likert. Scored as an average (higher = better). Sent to
--    each new GT parent 24h after their FIRST attended session, then
--    again at the 3-month checkpoint using timepoint='midpoint'.
--
-- 2. New survey "Growing Together Post-Session Feedback" — 5 questions
--    from spec §27. Sent 24h after each attended session. Reuses the
--    existing surveys / survey_responses infrastructure.
--
-- 3. registrations.feedback_email_sent_at — set by the feedback cron
--    so we don't spam families with the same request. Nullable so
--    anonymous / non-GT registrations remain untouched.


ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS feedback_email_sent_at TIMESTAMPTZ;

-- Cron hot path: "attended GT registrations that still need a feedback email"
CREATE INDEX IF NOT EXISTS idx_registrations_gt_feedback_pending
  ON registrations (event_id)
  WHERE family_id IS NOT NULL
    AND attended = 'yes'
    AND feedback_email_sent_at IS NULL;


-- ============================================
-- SEED: Growing Together Baseline instrument
-- ============================================
INSERT INTO outcome_instruments (code, name, short_description, source, items, scoring, display_order)
VALUES
  ('GT_BASELINE',
   'Growing Together — Baseline',
   'Six family-facing statements covering the three programme differences: confidence, connection, belonging. 1-5 scale.',
   'Evolution Impact Initiative CIC — Growing Together programme, funded by BBC Children in Need We Move Fwd: Foundations.',
   '[
     { "id": "gt_child_confidence",       "text": "My child feels confident joining activities with other children.",                     "scale": "1-5", "scale_labels": {"1": "Strongly disagree", "2": "Disagree", "3": "Neutral", "4": "Agree", "5": "Strongly agree"} },
     { "id": "gt_child_wellbeing",        "text": "My child is comfortable expressing how they feel.",                                    "scale": "1-5", "scale_labels": {"1": "Strongly disagree", "2": "Disagree", "3": "Neutral", "4": "Agree", "5": "Strongly agree"} },
     { "id": "gt_parent_confidence",      "text": "I feel confident supporting my child''s emotional wellbeing.",                         "scale": "1-5", "scale_labels": {"1": "Strongly disagree", "2": "Disagree", "3": "Neutral", "4": "Agree", "5": "Strongly agree"} },
     { "id": "gt_parent_child_bond",      "text": "I feel confident playing and learning with my child.",                                 "scale": "1-5", "scale_labels": {"1": "Strongly disagree", "2": "Disagree", "3": "Neutral", "4": "Agree", "5": "Strongly agree"} },
     { "id": "gt_belonging",              "text": "I feel welcomed and comfortable in local Early Years spaces.",                         "scale": "1-5", "scale_labels": {"1": "Strongly disagree", "2": "Disagree", "3": "Neutral", "4": "Agree", "5": "Strongly agree"} },
     { "id": "gt_cultural_inclusion",     "text": "I feel that my child''s culture and identity are respected and represented.",          "scale": "1-5", "scale_labels": {"1": "Strongly disagree", "2": "Disagree", "3": "Neutral", "4": "Agree", "5": "Strongly agree"} }
   ]'::jsonb,
   '{
     "method": "average",
     "item_ids": ["gt_child_confidence", "gt_child_wellbeing", "gt_parent_confidence", "gt_parent_child_bond", "gt_belonging", "gt_cultural_inclusion"]
   }'::jsonb,
   30)
ON CONFLICT (code) DO NOTHING;


-- ============================================
-- SEED: Growing Together Post-Session Feedback survey
-- ============================================
-- The survey is created once (no event_id — reused across every GT
-- session). The cron emails a link per attended registration.
--
-- Titled with a leading marker so admin can find it in /admin/surveys
-- and know it's the programme-scoped one.
--
-- Uses ON CONFLICT via a WHERE NOT EXISTS since surveys.title has no
-- unique constraint (we intentionally keep it text). Idempotent.
INSERT INTO surveys (title, description, survey_type, questions, is_active)
SELECT
  'Growing Together — Post-session feedback',
  'A quick 2-minute check-in after your Growing Together session. Your answers help us shape future sessions.',
  'event_feedback',
  '[
    { "id": "gt_rating",               "type": "rating",          "text": "How was today''s session?",                                              "required": true, "min": 1, "max": 5 },
    { "id": "gt_child_enjoyment",      "type": "text",            "text": "What did your child enjoy most?",                                        "required": false },
    { "id": "gt_child_comfortable",    "type": "multiple_choice", "text": "Did your child feel comfortable taking part?",                            "required": false, "options": ["Yes", "Somewhat", "No"] },
    { "id": "gt_parent_learning",      "type": "multiple_choice", "text": "Did you learn anything useful?",                                          "required": false, "options": ["Yes", "Somewhat", "No"] },
    { "id": "gt_next_session_ideas",   "type": "text",            "text": "What would you like to see next?",                                        "required": false }
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM surveys WHERE title = 'Growing Together — Post-session feedback'
);
