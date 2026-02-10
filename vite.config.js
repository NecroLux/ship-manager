import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
// Get current git commit hash
var getCommitHash = function () {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    }
    catch (e) {
        return 'unknown';
    }
};
// https://vite.dev/config/
export default defineConfig({
    base: '/ship-manager/',
    plugins: [react()],
    define: {
        __COMMIT_HASH__: JSON.stringify(getCommitHash()),
    }
});
