export const analysisErrorCodes = {
  fetchError: 'ANALYSIS_FETCH_ERROR',
  notFound: 'ANALYSIS_NOT_FOUND',
  deleteError: 'ANALYSIS_DELETE_ERROR',
  validationError: 'ANALYSIS_VALIDATION_ERROR',
} as const;

export type AnalysisServiceError =
  (typeof analysisErrorCodes)[keyof typeof analysisErrorCodes];
