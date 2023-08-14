# Tracking

The following table shows what we are tracking on our landing page and through
our API.

| Event Name                 | Triggered when                                                                                                                           | Additional properties                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Sign Up Clicked            | a user clicks the Signup Button on the landing page                                                                                      | None                                                                                |
| Plan Selected              | a user tries to register for a plan on the landing page                                                                                  | Plan: The plan the user has chosen                                                  |
| Plan Upgrade Clicked       | a user tries to upgrade their plan on the dashboard                                                                                      | Plan: The plan the user is trying to upgrade to                                     |
| Project Created            | a user creates a new project on the dashboard                                                                                            | None                                                                                |
| AB-Test Created            | a user creates a new AB-Test on the dashboard                                                                                            | Amount Of Variants: The amount of variants associated with the new AB-Test          |
| Environment Created        | a user creates a new environment on the dashboard                                                                                        | None                                                                                |
| Feature Flag Created       | a user creates a new feature flag on the dashboard                                                                                       | Feature Flag Type: The type of feature flag created (Boolean, String, Number, Json) |
| Devtools Opened            | a user tries the devtools for the first time                                                                                             | None                                                                                |
| API Project Data Retrieved | an API call to the endpoint for retrieving the Abby settings for a project, has been sent (We do not track the User-Agent, in this case) |                                                                                     |
