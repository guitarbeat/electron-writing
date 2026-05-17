## 2024-05-16 - Error leakage in API routes
**Vulnerability:** Found multiple `res.status(500).json({ error: err.message })` statements in `server.ts`. This leaks error details (which could contain sensitive information) to the client.
**Learning:** Error details can inadvertently expose sensitive data like internal path structures, db internals, or logic flaws to end users.
**Prevention:** Instead of sending `err.message` in the API responses, log the error details server-side and respond with a generic error message like `"Internal Server Error"` or `"An error occurred"`.
