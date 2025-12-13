/*
  # Make messages.message column nullable

  1. Modifications
    - Change `message` column in messages table from NOT NULL to nullable
    - This allows sending files without accompanying text messages
  
  2. Rationale
    - File attachments should be able to stand alone without requiring a text message
    - Improves user experience when sharing files via chat
*/

-- Make message column nullable
ALTER TABLE messages ALTER COLUMN message DROP NOT NULL;
