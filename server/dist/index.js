// Bootstrap: load TypeScript source directly via tsx (tsx is in dependencies).
// This file is committed so the start command always finds it even if the
// esbuild compilation step is skipped or cached away by Railway.
require('tsx/cjs');
require('../index.ts');
