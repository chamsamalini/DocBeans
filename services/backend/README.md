# Backend service

This boundary owns document generation, validation, AI-provider calls and usage calculation. Framework route files under `app/api` are intentionally thin and delegate here. Authentication is consumed only through `services/auth/server`.
