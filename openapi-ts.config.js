export default {
  client: 'legacy/fetch',
  input: 'http://localhost:8012/api/v2/openapi.json',
  output: './src/api',
  format: 'prettier',
  types: {
    enums: false,
  },
  schemas: false,
};
