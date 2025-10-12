const isProd = false
const isLocal = true

export const baseUrl = isProd 
  ? "http://localhost:3000" 
  : isLocal 
    ? "http://localhost:9009" 
    : ""
