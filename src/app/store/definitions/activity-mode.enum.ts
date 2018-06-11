export enum ActivityMode {
  ActiveHighPriority = 200, // Action in progress, user needs feedback right now
  Active = 1000, // User is actively looking at the page
  ActiveLowPriority = 10000, // User is looking at an unimportant page, update the model silently (refresh once every 10 seconds)
  Idle // User is not looking, stop polling
  // LazyLoading // We want to pre-load data because the user will probably need it in the future
}
