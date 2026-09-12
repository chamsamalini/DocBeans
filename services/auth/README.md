# Authentication service

Public consumers import from `services/auth/client`, `services/auth/server`, or `services/auth/contracts`. Provider SDK imports must remain inside `services/auth/adapters/<provider>`.

To add Auth0 later, implement the browser and server contract using an `adapters/auth0` directory, register it in the two factories, and add provider-specific runtime configuration here. Do not modify frontend pages or backend generation services.
