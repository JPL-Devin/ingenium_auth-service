
# Testing

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [auth_service/test/api/client/login-test.js](auth_service/test/api/client/login-test.js)
- [auth_service/test/api/controllers/hello_world.js](auth_service/test/api/controllers/hello_world.js)
- [tests/auth_unit_test.py](tests/auth_unit_test.py)
- [tests/requirements.txt](tests/requirements.txt)

</details>



This page provides a high-level overview of the testing strategies and suites used to validate the Ingenium Auth Service (IAS). Testing is divided into two primary domains: comprehensive Python-based integration tests that verify functional requirements and Node.js client-side tests that validate individual API endpoints and schema compliance.

### Test Suite Architecture

The testing ecosystem ensures that the service adheres to the formal IAS requirements (IAS-1 through IAS-9) while maintaining API contract stability.

| Suite | Technology | Location | Primary Focus |
|:---|:---|:---|:---|
| **Integration Suite** | Python 3 / Unittest | `tests/` | Requirement traceability (IAS-X), end-to-end flows, and security constraints. |
| **Client API Suite** | Node.js / Supertest | `auth_service/test/api/client/` | Per-endpoint validation, schema compliance, and controller logic. |

#### Test Suite System Context
This diagram illustrates how the test suites interact with the system components and verify specific code entities.

```mermaid
graph TD
    subgraph "Testing Frameworks"
        ["Python Unittest (auth_unit_test.py)"] -- "HTTP/REST" --> ["Apache/Nginx Proxy"]
        ["Node Supertest (login-test.js)"] -- "Internal Call" --> ["Express App (app.js)"]
    end

    subgraph "Ingenium Auth Service"
        ["Apache/Nginx Proxy"] --> ["Express App (app.js)"]
        ["Express App (app.js)"] --> ["MySQL DB"]
        ["Express App (app.js)"] --> ["Redis Blacklist"]
        ["Express App (app.js)"] --> ["LDAP Server"]
    end

    ["Python Unittest (auth_unit_test.py)"] -. "Verifies" .-> ["IAS Requirements (IAS-1 to IAS-9)"]
    ["Node Supertest (login-test.js)"] -. "Verifies" .-> ["Swagger Contract (swagger.yaml)"]
```
Sources: [tests/auth_unit_test.py:1-32](), [auth_service/test/api/client/login-test.js:49-55]()

---

### Python Integration Test Suite

The Python suite serves as the primary validation tool for CI/CD pipelines and formal requirement verification. It uses the `unittest` framework and `xmlrunner` to perform black-box testing against a running instance of the service.

*   **Requirement Traceability**: Tests are explicitly mapped to requirements such as `IAS-1` (LDAP Authentication), `IAS-2` (JWT Issuance), and `IAS-7` (Token Blacklisting) [tests/auth_unit_test.py:5-15]().
*   **Environment Setup**: The suite can pull credentials from `INGENIUM_TESTUSER` and `INGENIUM_TESTPASS` environment variables or prompt for them manually [tests/auth_unit_test.py:156-161]().
*   **Cleanup Mechanism**: Includes a `cleanup_for_test()` function that purges transient test data, such as roles defined in the `test_roles` list (e.g., `TESTROLE`, `ROLE_MGMT_TEST`), to ensure a clean state for subsequent runs [tests/auth_unit_test.py:163-189]().
*   **Endpoint Mapping**: Global variables like `auth_endpoint_login`, `auth_endpoint_logout`, and `auth_endpoint_roles` map directly to the service's API paths [tests/auth_unit_test.py:59-68]().

For details on test classes and requirement mapping, see [Python Integration Test Suite](#7.1).

Sources: [tests/auth_unit_test.py:1-189](), [tests/requirements.txt:1-5]()

---

### Node.js Client Test Suite

The Node.js suite focuses on the internal consistency of the Express application and adherence to the Swagger specification. These tests are located within the `auth_service` directory and utilize `supertest` and `z-schema` for validation.

*   **Schema Validation**: Uses `ZSchema` to register custom formats (e.g., `int32`, `dateTime`, `password`) and validate that API responses match the expected JSON schemas [auth_service/test/api/client/login-test.js:1-48]().
*   **Endpoint Coverage**: Individual test files validate specific status codes. For example, `login-test.js` verifies `200` (Successful), `401` (Unauthorized), and `404` (Not Found) responses for the `/login` endpoint [auth_service/test/api/client/login-test.js:55-134]().
*   **Stubs and Controllers**: Includes controller tests like `hello_world.js` to verify basic routing and parameter handling [auth_service/test/api/controllers/hello_world.js:1-48]().

For details on endpoint test patterns and the Node.js test runner, see [Node.js Client Test Suite](#7.2).

Sources: [auth_service/test/api/client/login-test.js:1-164](), [auth_service/test/api/controllers/hello_world.js:1-48]()

---

### Testing Entity Mapping

The following diagram maps high-level testing concepts to specific variables and functions within the test code.

**Testing Entity Mapping**
```mermaid
graph LR
    subgraph "Requirement Space"
        ["IAS-1: LDAP Bind"]
        ["IAS-7: Logout/Blacklist"]
        ["IAS-2: JWT Timeout"]
    end

    subgraph "Test Implementation"
        ["auth_unit_test.py"] --> ["IAS-1: LDAP Bind"]
        ["auth_unit_test.py"] --> ["IAS-7: Logout/Blacklist"]
        ["auth_unit_test.py"] --> ["IAS-2: JWT Timeout"]
        
        ["auth_endpoint_login"] -- "targets" --> ["/api/v2/login"]
        ["auth_endpoint_logout"] -- "targets" --> ["/api/v2/logout"]
        ["cleanup_for_test()"] -- "purges" --> ["test_roles"]
    end

    subgraph "Configuration"
        ["valid_user"]
        ["valid_password"]
        ["auth_server"]
    end

    ["auth_unit_test.py"] --> ["valid_user"]
    ["auth_unit_test.py"] --> ["auth_server"]
    ["login-test.js"] --> ["process.env.BASIC_AUTH"]
```
Sources: [tests/auth_unit_test.py:54-72](), [tests/auth_unit_test.py:155-182](), [auth_service/test/api/client/login-test.js:73-75]()

---

