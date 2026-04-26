/*
  # Expand Message Read Status Visibility

  Problem:
  - "Seen by" in channels can appear empty for senders because
    `message_read_status` SELECT policy only allows `user_id = auth.uid()`.

  Fix:
  - Keep self-read visibility.
  - Allow a message sender to see read-status rows for their own messages.
*/

DROP POLICY IF EXISTS "Users can view own read status" ON public.message_read_status;

CREATE POLICY "Users can view own and sent message read status"
  ON public.message_read_status
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.id = message_read_status.message_id
        AND m.sender_id = auth.uid()
    )
  );
