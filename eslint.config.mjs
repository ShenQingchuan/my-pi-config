import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      // 第三方 vendored 代码，保持上游原样便于对比更新
      'extensions/pi-claude-code-ui/**',
      'npm/**',
    ],
  },
  {
    rules: {
      // Bun/Node 脚本里 process 就是全局变量，无需 require
      'node/prefer-global/process': 'off',
    },
  },
)
