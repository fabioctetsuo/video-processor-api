Feature: Queue Management and Monitoring
  As a system operator
  I want to monitor and manage the video processing queue
  So that I can ensure optimal system performance and reliability

  Background:
    Given the video processing system is running
    And the queue management system is operational
    And mock services are configured for testing

  Scenario: Queue statistics monitoring
    Given there are videos in the processing queue
    When I request queue statistics
    Then I should receive current queue metrics
    And the metrics should include message count
    And the metrics should include consumer count
    And the metrics should include connection status
    And the metrics should include estimated processing time

  Scenario: Empty queue status
    Given the processing queue is empty
    When I request queue statistics
    Then I should receive zero message count
    And I should receive consumer information
    And the connection status should be healthy

  Scenario: Queue health monitoring
    Given the queue system is operational
    When I check the system health status
    Then I should see queue connectivity information
    And I should see processing statistics
    And all health indicators should show system status

  Scenario: Processing status tracking
    Given videos have been uploaded for processing
    When I request the processing status
    Then I should see a list of all processed files
    And each file should have complete metadata
    And the total count should match the file list

  Scenario: Queue capacity management
    Given the system handles multiple video uploads
    When videos are added to the queue
    Then the queue should accept new messages
    And the message count should increase appropriately
    And the system should provide accurate position estimates

  Scenario: Consumer scaling information
    Given the queue system has multiple consumers
    When I check queue statistics
    Then I should see the current consumer count
    And the consumer count should be accurate
    And processing estimates should reflect consumer capacity

  Scenario: Queue persistence verification
    Given messages are added to the queue
    When I check queue statistics
    Then messages should be persisted properly
    And the message count should be accurate
    And no messages should be lost

  Scenario: Real-time queue monitoring
    Given I monitor queue statistics continuously
    When new videos are uploaded
    Then queue metrics should update in real-time
    And all statistics should remain consistent
    And the system should handle monitoring requests efficiently

  Scenario: Queue performance metrics
    Given the system is processing videos
    When I request detailed queue statistics
    Then I should receive processing performance data
    And the data should include throughput information
    And estimated wait times should be calculated
    And metrics should help with capacity planning

  Scenario: Queue error recovery
    Given the queue system encounters issues
    When the system attempts to recover
    Then queue functionality should be restored
    And statistics should reflect the recovery
    And no messages should be lost during recovery