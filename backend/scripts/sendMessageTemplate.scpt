-- Define placeholders for message data
set phoneNumber to "{PHONE_NUMBER}"
set messageText to "{MESSAGE_TEXT}"

-- Open the Messages application
tell application "Messages"
  activate
  
  -- Attempt to send via iMessage
  try
    set targetService to 1st service whose service type = iMessage
    set targetBuddy to buddy phoneNumber of targetService
    send messageText to targetBuddy
  end try

  -- Delay to ensure iMessage sends or fails
  delay 10

  -- Attempt to send via SMS regardless of iMessage outcome
  try
    set targetService to 1st service whose service type = SMS
    set targetBuddy to buddy phoneNumber of targetService
    send messageText to targetBuddy
  on error errMsg
    display dialog "Failed to send message via SMS."
  end try

end tell
