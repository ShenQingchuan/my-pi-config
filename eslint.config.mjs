import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'extensions/**',
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
