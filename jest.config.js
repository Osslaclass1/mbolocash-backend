module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!axios|twilio)/' // Allow transformation of axios and twilio
  ],
  testEnvironment: 'node'
};