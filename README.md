# Healthcare DevSecOps Lab — Securing the MediTrack Pipeline

A hands-on DevSecOps lab that embeds security into every stage of a CI/CD pipeline. Students take the MediTrack patient appointment API from the [Healthcare CI/CD Lab](https://github.com/anmutetech/healthcare-cicd-lab) and layer on 6 security gates using industry-standard tools.

## Scenario

You are a DevOps engineer at **MediTrack Health**. The development team shipped a working CI/CD pipeline (from the previous lab), but the security team has flagged it -- the pipeline has no security checks. In healthcare, this is a compliance risk. Patient data is involved, and regulators expect evidence that code and infrastructure are scanned before reaching production.

Your job is to transform the basic CI/CD pipeline into a **DevSecOps pipeline** by adding:

1. **Dependency auditing** -- are there known vulnerabilities in our packages?
2. **Secret detection** -- has anyone accidentally committed credentials?
3. **Static analysis (SAST)** -- does the source code contain insecure patterns?
4. **Container scanning** -- does the Docker image have OS or library CVEs?
5. **SBOM generation** -- can we produce a full inventory of every component in the image?
6. **Kubernetes policy enforcement** -- do our manifests follow security best practices?

If any check fails, deployment is blocked.

## What Gets Created

- **DevSecOps Pipeline** -- 9-stage GitHub Actions workflow with 7 security gates that must pass before deployment
- **OPA Policies** -- Rego policies enforcing non-root containers, resource limits, health probes, and no `:latest` tags
- **Vulnerability Examples** -- Intentionally insecure code (SQL injection, hardcoded secrets, insecure randomness) alongside secure fixes
- **SBOM Artifact** -- SPDX-format Software Bill of Materials generated on every build
- **Hardened Kubernetes Manifests** -- Deployment with `securityContext`, dropped capabilities, and read-only filesystem

## Architecture

```
 ┌─── DevSecOps Pipeline (GitHub Actions) ─────────────────────────────────────────────┐
 │                                                                                      │
 │   ┌──────────────────────────────────────────────────────────────────────────────┐   │
 │   │  Parallel Security Gates (all must pass)                                     │   │
 │   │                                                                              │   │
 │   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │   │
 │   │  │ 1. Unit      │ │ 2. Dependency│ │ 3. Secret    │ │ 4. Static Analysis │  │   │
 │   │  │    Tests     │ │    Audit     │ │    Detection │ │    (SAST)          │  │   │
 │   │  │              │ │              │ │              │ │                    │  │   │
 │   │  │  Jest        │ │  npm audit   │ │  Gitleaks    │ │  CodeQL            │  │   │
 │   │  │  ESLint      │ │  (HIGH+)     │ │  (full repo  │ │  (JavaScript)      │  │   │
 │   │  │  Coverage    │ │              │ │   history)   │ │                    │  │   │
 │   │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────────┬───────────┘  │   │
 │   │         │                │                │                  │              │   │
 │   └─────────┼────────────────┼────────────────┼──────────────────┼──────────────┘   │
 │             │                │                │                  │                   │
 │             ▼                ▼                ▼                  ▼                   │
 │   ┌──────────────────────────────────────────────────────────────────────────────┐   │
 │   │  Sequential Security Gates                                                   │   │
 │   │                                                                              │   │
 │   │  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────────────┐  │   │
 │   │  │ 5. Container     │    │ 6. SBOM          │    │ 7. K8s Policy Check   │  │   │
 │   │  │    Scan          │───▶│    Generation     │    │                       │  │   │
 │   │  │                  │    │                  │    │    OPA/Conftest        │  │   │
 │   │  │  Trivy           │    │  Syft            │    │    (Rego policies)     │  │   │
 │   │  │  (CRITICAL/HIGH  │    │  (SPDX format)   │    │    - runAsNonRoot     │  │   │
 │   │  │   blocks deploy) │    │  Uploaded as      │    │    - resource limits  │  │   │
 │   │  │                  │    │  build artifact   │    │    - health probes    │  │   │
 │   │  └──────────────────┘    └──────────────────┘    │    - no :latest tag   │  │   │
 │   │                                                   │    - no privileged    │  │   │
 │   │                                                   └────────────────────────┘  │   │
 │   └──────────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                      │
 │             All 7 gates pass                                                        │
 │                    │                                                                 │
 │                    ▼                                                                 │
 │   ┌──────────────────────┐         ┌──────────────────────┐                         │
 │   │  8. Build & Push     │────────▶│  9. Deploy to EKS    │                         │
 │   │  Docker image        │         │  kubectl apply       │                         │
 │   │  :latest + :sha      │         │  rollout status      │                         │
 │   └──────────────────────┘         └──────────────────────┘                         │
 │                                                                                      │
 └──────────────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Complete the Healthcare CI/CD Lab

This lab builds on the [Healthcare CI/CD Lab](https://github.com/anmutetech/healthcare-cicd-lab). Complete that lab first to understand the base application and CI/CD pipeline.

### 2. EKS Cluster

This project deploys to the `migration-eks-cluster` provisioned by the [Cloud Migration Infrastructure](https://github.com/anmutetech/cloud-migration-infra) setup.

Verify your cluster is running:

```bash
kubectl get nodes
```

### 3. DockerHub Account

You need a [DockerHub](https://hub.docker.com/) account to store the container image.

### 4. Tools

```bash
aws --version
kubectl version --client
```

## Setup Guide

### Step 1 — Fork and Clone the Repository

1. Fork this repository to your own GitHub account
2. Clone your fork:

```bash
git clone https://github.com/<your-username>/healthcare-devsecops-lab.git
cd healthcare-devsecops-lab
```

### Step 2 — Update the Docker Image Reference

Edit `kubernetes/deployment.yaml` and replace the image placeholder with your DockerHub username:

```yaml
image: <your-dockerhub-username>/meditrack-api:latest
```

Commit and push:

```bash
git add kubernetes/deployment.yaml
git commit -m "Update Docker image to use my DockerHub account"
git push origin main
```

### Step 3 — Configure GitHub Secrets

In your forked repository, go to **Settings** > **Secrets and variables** > **Actions** and add:

| Secret Name | Value |
|---|---|
| `DOCKER_USERNAME` | Your DockerHub username |
| `DOCKER_PASSWORD` | Your DockerHub password |
| `AWS_ACCESS_KEY_ID` | Your IAM user access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM user secret access key |

> **Note:** `GITLEAKS_LICENSE` is optional. Gitleaks works without a license key on public repositories. For private repos, get a free license at [gitleaks.io](https://gitleaks.io).

### Step 4 — Watch the Pipeline Run

The push in Step 2 triggers the pipeline. Go to the **Actions** tab and watch all 9 stages:

1. **Unit Tests** -- Jest runs the test suite and reports coverage
2. **Dependency Audit** -- `npm audit` checks for known CVEs in packages
3. **Secret Detection** -- Gitleaks scans the full git history for leaked credentials
4. **Static Analysis** -- CodeQL scans JavaScript source for security anti-patterns
5. **Container Scan** -- Trivy scans the Docker image for OS and library vulnerabilities
6. **SBOM Generation** -- Syft produces a Software Bill of Materials in SPDX format
7. **K8s Policy Check** -- Conftest validates manifests against OPA security policies
8. **Build & Push** -- Docker image is built and pushed to DockerHub
9. **Deploy** -- Application is deployed to EKS

> **Note:** The first run takes approximately 8-12 minutes due to CodeQL analysis.

### Step 5 — Explore the Security Results

After the pipeline completes:

**CodeQL findings:**
1. Go to the **Security** tab in your repository
2. Click **Code scanning alerts**
3. Review the findings -- CodeQL will flag issues in `app/vulnerabilities/insecure-example.js`

**SBOM artifact:**
1. Go to the **Actions** tab
2. Click the completed workflow run
3. Scroll to **Artifacts** and download `sbom`
4. Open `sbom.spdx.json` to see every package in the container image

**Trivy scan results:**
1. In the workflow run, click the **Container Scan (Trivy)** job
2. Review the vulnerability table showing CVE IDs, severity, and affected packages

### Step 6 — Understand the Vulnerability Examples

Review the two files in `app/vulnerabilities/`:

| File | Purpose |
|---|---|
| `insecure-example.js` | **5 intentional vulnerabilities** -- hardcoded credentials, SQL injection, ReDoS, PII in logs, insecure randomness |
| `secure-example.js` | **The fixed versions** -- environment variables, parameterized queries, safe validation, redacted logs, crypto.randomBytes |

These files demonstrate common security mistakes that CodeQL and code review should catch. In a real healthcare application, any of these could lead to a data breach or HIPAA violation.

### Step 7 — Understand the OPA Policies

Review the files in `policies/`:

**`deployment-policy.rego`** enforces:

| Policy | Why It Matters |
|---|---|
| `runAsNonRoot: true` | Prevents container breakout via root privileges |
| Resource limits defined | Prevents a single pod from consuming all node resources |
| Readiness and liveness probes | Ensures unhealthy pods are removed from service |
| No `:latest` image tag | Ensures deployments are reproducible and auditable |
| No privileged mode | Prevents containers from accessing the host kernel |
| No privilege escalation | Prevents processes from gaining more privileges than their parent |

**`namespace-policy.rego`** enforces:

| Policy | Why It Matters |
|---|---|
| Namespaces must have labels | Required for network policies and RBAC scoping |
| No deployments in `default` namespace | Prevents accidental exposure and simplifies RBAC |

Try breaking a policy to see it fail:

```bash
# Install conftest locally
brew install conftest  # macOS
# or: go install github.com/open-policy-agent/conftest@latest

# Run the policy check
conftest test kubernetes/deployment.yaml -p policies/

# Edit deployment.yaml — remove the readinessProbe, then re-run
conftest test kubernetes/deployment.yaml -p policies/
# Output: FAIL - Container 'meditrack-api' must define a readinessProbe
```

### Step 8 — Verify the Deployment

```bash
kubectl get pods -n meditrack
kubectl get svc -n meditrack
```

Copy the `EXTERNAL-IP` and open it in your browser. You should see the MediTrack dashboard.

Test the API:

```bash
# List patients
curl http://<EXTERNAL-IP>/api/patients

# Check Prometheus metrics
curl http://<EXTERNAL-IP>/metrics
```

### Step 9 — Break and Fix the Pipeline (Challenge)

Try introducing a security issue and watch the pipeline catch it:

1. **Add a hardcoded secret to a route file:**

```javascript
// Add this to app/routes/patients.js
const DB_PASSWORD = 'patient-db-secret-123';
```

2. Commit and push -- watch CodeQL flag the hardcoded credential

3. **Remove resource limits from the deployment:**

```yaml
# Remove the resources: block from kubernetes/deployment.yaml
```

4. Commit and push -- watch OPA/Conftest block the deployment

5. Fix both issues and push again -- the pipeline should pass and deploy successfully

## Security Tools Reference

| Tool | Stage | What It Detects | Industry Adoption |
|---|---|---|---|
| **npm audit** | Dependency Audit | Known CVEs in Node.js packages | Built into npm, used universally |
| **Gitleaks** | Secret Detection | API keys, passwords, tokens in git history | 17k+ GitHub stars, used by GitLab, Uber, Shopify |
| **CodeQL** | SAST | SQL injection, XSS, hardcoded secrets, insecure crypto | GitHub-native, used by 100k+ repositories |
| **Trivy** | Container Scan | OS and library CVEs in Docker images | Most popular container scanner, CNCF project |
| **Syft** | SBOM | Generates full package inventory (SPDX/CycloneDX) | Anchore project, adopted by US federal agencies |
| **OPA/Conftest** | Policy Enforcement | Validates configs against custom Rego policies | CNCF graduated project, used by Netflix, Goldman Sachs |

## Cleanup

Remove the application from your EKS cluster:

```bash
kubectl delete -f kubernetes/servicemonitor.yaml
kubectl delete -f kubernetes/service.yaml
kubectl delete -f kubernetes/deployment.yaml
kubectl delete -f kubernetes/configmap.yaml
kubectl delete -f kubernetes/namespace.yaml
```

> **Note:** To destroy the underlying EKS cluster, follow the cleanup steps in the [Cloud Migration Infrastructure README](https://github.com/anmutetech/cloud-migration-infra).

## Project Structure

```
healthcare-devsecops-lab/
├── .github/workflows/
│   └── devsecops.yml              # 9-stage DevSecOps pipeline
├── .gitleaks.toml                  # Gitleaks configuration (allowlisted paths)
├── app/
│   ├── package.json               # Dependencies (express, helmet, prom-client, winston)
│   ├── server.js                  # Express server with security middleware
│   ├── logger.js                  # Winston JSON logger
│   ├── .eslintrc.json             # ESLint configuration
│   ├── routes/
│   │   ├── patients.js            # Patient CRUD endpoints
│   │   └── appointments.js        # Appointment scheduling endpoints
│   ├── vulnerabilities/
│   │   ├── insecure-example.js    # 5 intentional vulnerabilities (for learning)
│   │   └── secure-example.js      # Fixed versions of each vulnerability
│   ├── __tests__/
│   │   └── patients.test.js       # Jest test suite (health, patients, appointments)
│   └── public/
│       └── index.html             # MediTrack dashboard UI
├── docker/
│   └── Dockerfile                 # Multi-stage build, non-root user, health check
├── kubernetes/
│   ├── namespace.yaml             # meditrack namespace with labels
│   ├── configmap.yaml             # Environment configuration
│   ├── deployment.yaml            # Hardened: securityContext, dropped capabilities, RO filesystem
│   ├── service.yaml               # LoadBalancer service (port 80 → 3000)
│   └── servicemonitor.yaml        # Prometheus ServiceMonitor
├── monitoring/
│   └── metrics.js                 # Prometheus metrics (requests, duration, appointments)
└── policies/
    ├── deployment-policy.rego     # OPA: non-root, limits, probes, no :latest, no privileged
    └── namespace-policy.rego      # OPA: labels required, no default namespace
```
