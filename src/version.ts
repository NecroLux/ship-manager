// Version info - injected at build time from git
declare const __COMMIT_HASH__: string;

export const VERSION_COMMIT = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev-build';
export const VERSION_SHORT = VERSION_COMMIT;
export const VERSION_BUILD_DATE = new Date().toISOString().split('T')[0];



