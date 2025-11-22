const isProd = false
const isLocal = true

export const baseUrl = isProd 
  ? "https://backend-emr.medalph.com" 
  : isLocal 
    ? "http://localhost:9009" 
    : ""
