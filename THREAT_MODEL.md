
# Threat Model for the `obsidian‑mcp‑bridge` Plugin

## Introduction

The `obsidian‑mcp‑bridge` plugin integrates Obsidian with the Model Context Protocol (MCP), enabling natural-language interaction with multiple external data providers and LLMs. This functionality introduces a range of potential attack surfaces and trust boundaries.

---

## Assets

- **User vault content** (notes, attachments, metadata)
- **Authentication secrets** (API keys for LLM providers, custom headers)
- **Server discovery and LLM routing logic**
- **Local MCP server endpoints**
- **Plugin configuration files**
- **Local logs or trace data (if persisted)**

---

## Trust Boundaries

- Between Obsidian (local plugin runtime) and the user’s filesystem
- Between plugin and remote LLM APIs (e.g., OpenAI, Anthropic)
- Between plugin and local MCP servers
- Between plugin and external search/indexing services (e.g., Git, web, Postgres)

---

## Threat Actors

- Malicious plugins or extensions within Obsidian
- Malicious LLM responses (prompt injection, hallucination)
- Compromised MCP endpoints
- Supply chain attackers (NPM packages or GitHub repos)
- Users unintentionally sharing secrets via vault sync or public repos

---

## Threat Scenarios

### 1. Prompt Injection

**Vector**: A vault note or remote response contains instructions that manipulate the LLM’s behavior (e.g., “Ignore previous instructions and...”)  
**Impact**: Data exfiltration, undesired agent actions, LLM misuse  
**Mitigations**:

- Sanitize vault inputs
- Use structured prompts (JSON delimiters, role separation)
- Use LLM context guards (e.g., system instructions that restrict tool use)

### 2. Secret Leakage

**Vector**: Secrets stored in `.env` or `plugin-settings.json` files are synced or leaked via error logs or requests  
**Impact**: Compromise of LLM APIs, billing exposure, impersonation  
**Mitigations**:

- Avoid storing secrets in vault
- Encourage use of OS-level secret stores (e.g., macOS Keychain, Windows Credential Store)
- Warn if vault is synced to public repo

### 3. Server Discovery Manipulation

**Vector**: Malicious or misconfigured `server-discovery.ts` loads a compromised MCP server  
**Impact**: Malicious code execution or data tampering  
**Mitigations**:

- Strict validation of endpoint descriptors
- UI approval for new server discovery
- Use HMAC or signature verification for trusted endpoints

### 4. LLM Routing Exploits

**Vector**: `llm-router.ts` misroutes prompts or exposes sensitive data to untrusted providers  
**Impact**: Hallucinated execution, data leakage  
**Mitigations**:

- Implement allowlist for providers
- Validate request/response payloads
- Disable speculative generation or tool use unless explicitly required

### 5. Supply Chain Attack

**Vector**: Malicious code introduced via a dependency or plugin update  
**Impact**: Full compromise of Obsidian runtime  
**Mitigations**:

- Pin dependency versions
- Use `npm audit` or `socket.dev` for supply chain analysis
- Review plugin updates before installation

### 6. Local Host Exploits (MCP Servers)

**Vector**: If local MCP servers run insecurely, they may expose file system or LLM routes without auth  
**Impact**: Arbitrary file access or command execution  
**Mitigations**:

- Require loopback-only binding (e.g., `127.0.0.1`)
- Enforce auth headers even on local
- Provide dev mode warnings

---

## Security Best Practices Summary

| Category             | Recommendation                                                             |
|----------------------|------------------------------------------------------------------------------|
| Secrets              | Use OS-level secret storage, never include in synced vault                  |
| Prompt Handling      | Sanitize vault inputs, delimit prompt boundaries                            |
| Network Security     | HTTPS only, loopback-only servers, signed endpoint discovery                |
| Plugin Hardening     | Enable Obsidian's Restricted Mode, no dynamic code eval                     |
| LLM Usage            | Use safe system prompts, require user confirmation for outbound actions     |
| Update Hygiene       | Pin dependencies, verify updates, conduct code review before install        |

---

## References

- [Obsidian Plugin Security Guide](https://help.obsidian.md/Extending+Obsidian/Plugin+security)
- [OWASP LLM Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
- [ProtectAI MCP Security 101](https://protectai.com/blog/mcp-security-101)
