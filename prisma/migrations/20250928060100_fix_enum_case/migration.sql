-- Create a new enum with lowercase values
CREATE TYPE "VideoProcessingStatus_new" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Drop the default temporarily
ALTER TABLE "video_files" ALTER COLUMN "status" DROP DEFAULT;

-- Update the table to use the new enum with proper value mapping
ALTER TABLE "video_files" ALTER COLUMN "status" TYPE "VideoProcessingStatus_new" 
USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'pending'::"VideoProcessingStatus_new"
    WHEN 'PROCESSING' THEN 'processing'::"VideoProcessingStatus_new"
    WHEN 'COMPLETED' THEN 'completed'::"VideoProcessingStatus_new"
    WHEN 'FAILED' THEN 'failed'::"VideoProcessingStatus_new"
    ELSE 'pending'::"VideoProcessingStatus_new"
  END
);

-- Drop the old enum and rename the new one
DROP TYPE "VideoProcessingStatus";
ALTER TYPE "VideoProcessingStatus_new" RENAME TO "VideoProcessingStatus";

-- Restore the default value with the new enum
ALTER TABLE "video_files" ALTER COLUMN "status" SET DEFAULT 'pending'::"VideoProcessingStatus";