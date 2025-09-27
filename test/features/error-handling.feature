Feature: Error Handling in Video Processing System
  As a system administrator
  I want the video processing system to handle errors gracefully
  So that users receive appropriate feedback and the system remains stable

  Background:
    Given the video processing system is running with queue support
    And the system uses mock services for testing

  Scenario Outline: File validation errors
    Given I have a file with "<file_type>" format
    When I upload the file to the queue endpoint
    Then I should receive a 400 error
    And the error message should contain relevant information

    Examples:
      | file_type |
      | text      |
      | image     |
      | audio     |
      | document  |

  Scenario: Empty request validation
    Given I prepare an empty upload request
    When I send the upload request
    Then I should receive a 400 error
    And the error should indicate that files are required

  Scenario: Oversized file handling
    Given I have a video file that exceeds size limits
    When I upload the oversized file
    Then the error should mention file size restrictions

  Scenario: System resource limitations
    Given the system is under heavy load
    When I attempt to upload a video file
    Then the system should handle the load gracefully
    And I should receive an appropriate response
    And the system should remain responsive

  Scenario: Queue system resilience
    Given the queue system experiences temporary issues
    When I upload a video file
    Then the system should handle the queue error
    And I should receive an informative error message
    And the system should not crash

  Scenario: Invalid endpoint access
    Given I access an invalid API endpoint
    When I make the request
    Then I should receive a 404 error
    And the error should indicate the endpoint was not found

  Scenario: Method not allowed errors
    Given I use an incorrect HTTP method
    When I make the request to a valid endpoint
    Then the error should indicate the method is not allowed

  Scenario: Concurrent request handling
    Given multiple users upload files simultaneously
    When all requests are processed
    Then each request should be handled independently
    And no request should interfere with others
    And all responses should be appropriate

  Scenario: Database connectivity issues
    Given the database becomes temporarily unavailable
    When I upload a video file
    Then the system should handle the database error
    And I should receive a 500 error with appropriate message
    And the system should attempt to recover

  Scenario: File system errors
    Given the file storage system has issues
    When I try to upload a video file
    Then the system should detect the storage issue
    And I should receive an appropriate error response
    And the error should be logged for investigation