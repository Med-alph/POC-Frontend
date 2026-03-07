// Disable console logs on production domains (non-localhost)
const isLocal = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

if (!isLocal) {
    console.log = () => { };
    console.debug = () => { };
    console.info = () => { };
    console.warn = () => { };
    // console.error remains enabled for critical debugging
}
