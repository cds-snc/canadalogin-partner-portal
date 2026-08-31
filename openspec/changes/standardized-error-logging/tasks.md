## 1. Fix StandardizedLogger

- [x] 1.1 Remove broken imports (`get_user_info`, `OAuthError`) from `standardized_logger.py`
- [x] 1.2 Set `PROJECT_NAME = "CanadaLogin"` and `APPLICATION_NAME = "PartnerPortal"`
- [x] 1.3 Rewrite `_build_user` as synchronous: read `request.session.get("user_uuid")`, hash with SHA-256, catch all `Exception`, drop `auth_methods`
- [x] 1.4 Make `_build_context` synchronous (remove `async`/`await`)
- [x] 1.5 Update `_build_request` to include `request_id` from `request.state.request_id` or `X-Request-ID` header, omitting the field when absent
- [x] 1.6 Rewrite `log()` as synchronous: early return for `status_code < 400`, simplified WARNING/ERROR branch

## 2. Wire Logger into Exception Handlers

- [x] 2.1 Import `StandardizedLogger` in `handlers.py`
- [x] 2.2 Instantiate module-level singleton: `standardized_logger = StandardizedLogger()`
- [x] 2.3 Call `standardized_logger.log(request, response)` in `validation_exception_handler`
- [x] 2.4 Call `standardized_logger.log(request, response)` in `rp_application_department_required_handler`
- [x] 2.5 Call `standardized_logger.log(request, response)` in `ibm_verify_exception_handler`
- [x] 2.6 Call `standardized_logger.log(request, response)` in `cache_exception_handler`
- [x] 2.7 Call `standardized_logger.log(request, response)` in `http_exception_handler`
- [x] 2.8 Call `standardized_logger.log(request, response)` in `unexpected_exception_handler`

## 3. Tests

- [x] 3.1 Create `tests/test_standardized_logger.py` with unit tests for `_hash_blacklisted_params` (blacklisted keys hashed, safe keys preserved, all blacklist keys covered)
- [x] 3.2 Add unit tests for `_build_user`: returns `None` with no session user, returns hashed `id` with session user, returns `None` on exception
- [x] 3.3 Add unit tests for `_build_request`: includes `request_id` from state, falls back to header, omits field when absent
- [x] 3.4 Add unit tests for `log()`: no emission for 2xx, WARNING emitted for 4xx with correct code, ERROR emitted for 5xx with correct code
- [x] 3.5 Add integration tests to `tests/test_exception_handlers.py`: logger called on 4xx handler, logger called on 5xx handler
