Feature: Video Processing
  As a user
  I want to upload video files
  So that I can extract frames and download them as a ZIP file

  Scenario: Successfully upload and process a video file
    Given I have a valid MP4 video file
    When I upload the video file to the API
    Then the video should be processed successfully
    And I should receive a success response with frame information
    And the frames should be available for download as a ZIP file

  Scenario: Upload an unsupported video format
    Given I have an unsupported file format
    When I upload the file to the API
    Then I should receive a 400 error
    And the error message should indicate invalid file format

  Scenario: Upload a file that exceeds size limit
    Given I have a video file that exceeds the maximum size limit
    When I upload the file to the API
    Then I should receive a 400 error
    And the error message should indicate file size exceeded

  Scenario: Get processing status
    Given there are processed video files
    When I request the processing status
    Then I should receive a list of all processed files
    And each file should include filename, size, creation date, and download URL

  Scenario: Download processed frames
    Given there is a processed video file
    When I request to download the frames ZIP file
    Then I should receive the ZIP file
    And the file should contain all extracted frames