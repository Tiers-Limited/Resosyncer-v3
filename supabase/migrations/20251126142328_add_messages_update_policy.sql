/*
  # Add Messages Update Policy

  1. Changes
    - Add UPDATE policy to messages table
    - Allow users to update `is_read` field for messages they received
  
  2. Security
    - Users can only update messages where they are the receiver
    - Only allows updating the `is_read` field (enforced at application level)
*/

-- Allow users to update messages they received (for marking as read)
CREATE POLICY "Users can update received messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());