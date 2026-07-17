/**
 * Visual-only heatmap tuning. Source buckets and tooltip values remain untouched.
 * Sigma/radius are measured in source buckets; transition width is the fraction
 * of the distance between adjacent bucket centres that is allowed to blend.
 */
export const TRANSACTION_DENSITY_HEATMAP_TUNING = {
  horizontalBlurSigma: 0.65,
  horizontalBlurRadius: 2,
  verticalBlurSigma: 0.2,
  verticalBlurRadius: 1,
  horizontalTransitionWidth: 1,
  verticalTransitionWidth: 1,
  preserveValueRange: true,
  wrapHours: true,
  wrapWeekdays: false,
} as const;
