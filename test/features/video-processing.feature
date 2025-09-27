Feature: Video Processing with Queue System
  As a user
  I want to upload video files for background processing
  So that I can handle peak loads efficiently without losing requests

  Background:
    Given the video processing system is running with queue support
    And the RabbitMQ message broker is available

  Scenario: Successfully upload single video for queue processing
    Given I have a valid MP4 video file
    When I upload the video file to the queue endpoint
    Then the video should be queued successfully
    And I should receive a 202 accepted response
    And I should get queue position information
    And I should get estimated processing time

  Scenario: Successfully upload multiple videos for queue processing
    Given I have 2 valid MP4 video files
    When I upload the video files to the queue endpoint
    Then the videos should be queued successfully
    And I should receive a 202 accepted response
    And I should get queue position information for all videos
    And I should get estimated processing time for the batch

  Scenario: Upload more than maximum allowed videos
    Given I have 4 video files
    When I upload the video files to the queue endpoint
    Then I should receive a 400 error
    And the error message should indicate maximum files exceeded

  Scenario: Upload an unsupported video format
    Given I have an unsupported file format
    When I upload the file to the queue endpoint
    Then I should receive a 400 error
    And the error message should indicate invalid file format

  Scenario: Upload without any files
    Given I have no files to upload
    When I upload to the queue endpoint
    Then I should receive a 400 error
    And the error message should indicate files are required

  Scenario: Process single video synchronously (backward compatibility)
    Given I have a valid MP4 video file
    When I upload the video file to the single video endpoint
    Then the video should be processed immediately
    And I should receive processing result or error response
    And the response should include frame information if successful

  Scenario: Get processing status and queue statistics
    Given there are videos in the processing queue
    When I request the processing status
    Then I should receive a list of all processed files
    And I should receive queue statistics
    And queue statistics should include message count and consumer count
    And queue statistics should include connection status

  Scenario: Get detailed queue statistics
    Given the queue system is operational
    When I request detailed queue statistics
    Then I should receive current queue metrics
    And I should receive estimated wait time
    And metrics should include message count and consumer count
    And metrics should include connection status

  Scenario: Download processed frames
    Given there is a processed video file available
    When I request to download the frames ZIP file
    Then I should receive the ZIP file or appropriate error
    And if successful the file should be properly formatted for download

  Scenario: Handle queue system errors gracefully
    Given the queue system encounters an error
    When I upload a video file
    Then the system should handle the error gracefully
    And I should receive an appropriate error response
    And the error should be logged for debugging

  Scenario: Monitor queue health and connectivity
    Given the video processing system is running
    When I check the system status
    Then I should see queue connectivity information
    And I should see processing statistics
    And the information should be current and accurate