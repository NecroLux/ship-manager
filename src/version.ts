// Version info - updated automatically during deployment
const getCommitHash = (): string => {
  // In production, this would be injected via build process
  // For now, use a placeholder that can be replaced
  return (import.meta as any).env?.VITE_COMMIT_HASH || 'dev-build';
};

export const VERSION_COMMIT = getCommitHash();
export const VERSION_BUILD_DATE = new Date().toISOString().split('T')[0];

