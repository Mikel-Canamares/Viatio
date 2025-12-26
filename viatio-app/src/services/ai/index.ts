export * from './assistantPrompt';
export * from './assistantService';

// Context Pack Builder
export {
  buildContextPack,
  compressContextPack,
  contextPackToPromptString,
  type BuildContextPackOptions,
} from './contextPackBuilder';

// Action Executor
export {
  executeAction,
  executeActions,
  validateAction,
  type ActionResult,
  type ActionExecutorContext,
} from './actionExecutor';

// Copilot Service (comunicación con backend)
export {
  sendMessageToCopilot,
  sendMessageToAssistantLegacy,
  checkCopilotAvailability,
  formatAgentResponseForDisplay,
  type CopilotServiceOptions,
} from './copilotService';

// Copilot Places Service
export {
  suggestNearbyActivities,
  suggestRestaurants,
  getPointsOfInterest,
  searchPlacesForCopilot,
  getPlaceDetailsForCopilot,
  formatSuggestionsForPrompt,
  buildPlaceActions,
  clearExpiredCache,
  type PlaceSuggestion,
  type PlaceSuggestionCategory,
  type SuggestOptions,
} from './copilotPlacesService';
