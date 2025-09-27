-- CreateEnum
CREATE TYPE "public"."VideoProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."video_files" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size_in_bytes" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "status" "public"."VideoProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."processing_results" (
    "id" TEXT NOT NULL,
    "video_file_id" TEXT NOT NULL,
    "zip_path" TEXT NOT NULL,
    "frame_count" INTEGER NOT NULL,
    "frame_names" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_video_files_user_id" ON "public"."video_files"("user_id");

-- CreateIndex
CREATE INDEX "idx_video_files_status" ON "public"."video_files"("status");

-- CreateIndex
CREATE INDEX "idx_processing_results_video_file_id" ON "public"."processing_results"("video_file_id");

-- AddForeignKey
ALTER TABLE "public"."processing_results" ADD CONSTRAINT "processing_results_video_file_id_fkey" FOREIGN KEY ("video_file_id") REFERENCES "public"."video_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
