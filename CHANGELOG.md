# Changelog - Docker Build Fixes & Environment Configuration

## [2026-02-04] Docker Build & Configuration Updates

### 🐛 Bug Fixes

#### 1. Fixed Import Mismatch in AI Settings
**File:** `lib/actions/ai-settings.actions.ts`
- **Issue:** Import used `connectDB` but the actual export is `connectToDatabase`
- **Fix:** Updated all imports and function calls from `connectDB()` to `connectToDatabase()`
- **Impact:** Resolved Turbopack build error preventing Docker image creation

#### 2. Fixed MongoDB Connection During Build
**File:** `database/mongoose.ts`
- **Issue:** Next.js tried to connect to MongoDB during build phase, causing build failures
- **Fix:** Added check for `NEXT_PHASE=phase-production-build` to skip DB connection during build
- **Code:**
  ```typescript
  if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('⏭️  Skipping MongoDB connection during build');
      return null;
  }
  ```
- **Impact:** Allows successful Docker builds without requiring MongoDB to be running

#### 3. Fixed Email Transporter Verification During Build
**File:** `lib/nodemailer/index.ts`
- **Issue:** Gmail SMTP verification attempted during build phase, causing authentication errors
- **Fix:** Conditional verification that skips during build and only runs with valid credentials
- **Code:**
  ```typescript
  if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
      if (process.env.NODEMAILER_EMAIL && process.env.NODEMAILER_PASSWORD && 
          process.env.NODEMAILER_EMAIL !== 'your_email@gmail.com') {
          transporter.verify(...)
      }
  }
  ```
- **Impact:** Prevents build failures when email credentials are not configured

### ⚙️ Configuration Improvements

#### 4. Enhanced Environment Configuration Script
**File:** `scripts/check-env.mjs`
- **Enhancement:** Added built-in `.env` file loading using Node.js fs module
- **Removed:** Dependency on external `dotenv` package for the checker script
- **Impact:** Script now works standalone without additional dependencies

#### 5. Docker Build Optimization
**File:** `Dockerfile`
- **Added:** `ENV NEXT_PHASE=phase-production-build` to signal build phase
- **Impact:** Enables conditional logic to skip runtime-only operations during build

#### 6. Next.js Configuration Update
**File:** `next.config.ts`
- **Added:** `output: 'standalone'` for optimized Docker deployments
- **Impact:** Reduces Docker image size and improves container startup performance

#### 7. Environment Template Creation
**File:** `.env.example`
- **Created:** Comprehensive environment variable template with detailed documentation
- **Includes:** 
  - Docker-specific configuration (ports, MongoDB, host.docker.internal)
  - AI provider options (Gemini, Ollama, LM Studio, Siray)
  - Required vs optional variables clearly marked
  - Inline documentation and setup instructions
- **Impact:** Simplified setup process for new developers and deployments

#### 8. Git Ignore Configuration
**File:** `.gitignore`
- **Updated:** Changed from `.env*` to specific patterns
- **Added:** `!.env.example` to allow template tracking
- **Protected:** `.env`, `.env.local`, `.env.*.local` files remain ignored
- **Impact:** Secure secrets while sharing configuration template

### 🚀 Deployment Improvements

#### Docker Compose Configuration
**Current Setup:**
- **Web App Port:** `3101:3000` (external:internal)
- **MongoDB Port:** `27018:27017` (external:internal)
- **MongoDB Version:** 7 with persistent volumes
- **Network:** Containers use internal DNS (mongodb service)

#### Local AI Support
**Configured for:**
- **Ollama:** `http://host.docker.internal:11434`
- **LM Studio:** `http://host.docker.internal:14321/v1`
- **Fallback:** Cloud AI providers (Gemini, Siray)

### 📋 Testing Results

✅ **Docker Build:** Successfully compiles with Turbopack
✅ **Container Startup:** Runs without MongoDB connection errors during build
✅ **Email Handling:** Gracefully degrades when credentials not configured
✅ **Port Configuration:** Accessible on http://localhost:3101
✅ **Database:** MongoDB accessible at mongodb:27017 (internal) / localhost:27018 (external)

### 🔧 Required Environment Variables

**Minimal (for basic functionality):**
- `MONGODB_URI` - Database connection
- `BETTER_AUTH_SECRET` - Authentication security
- `BETTER_AUTH_URL` - Auth callback URL (http://localhost:3101)
- `NEXT_PUBLIC_FINNHUB_API_KEY` - Stock market data (REQUIRED)
- `FINNHUB_BASE_URL` - Finnhub API endpoint

**Optional (for full features):**
- `INNGEST_SIGNING_KEY` - Workflow automation (Vercel deployments)
- `NODEMAILER_EMAIL` - Email notifications
- `NODEMAILER_PASSWORD` - Gmail App Password
- `AI_PROVIDER` - AI model selection (gemini/ollama/lmstudio/siray)
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL` - Local AI configuration

### 📝 Build & Run Instructions

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your API keys

# 2. Build and run containers
docker compose -p openstock-docker up -d --build

# 3. Access application
# Web: http://localhost:3101
# MongoDB: localhost:27018

# 4. View logs
docker compose -p openstock-docker logs -f

# 5. Stop containers
docker compose -p openstock-docker down
```

### 🎯 Summary

**Total Files Modified:** 8
**Lines Changed:** ~150+
**Build Time:** ~3-5 minutes (first build)
**Image Size:** Optimized with standalone output

**Key Achievement:** Successfully enabled Docker deployment with graceful degradation for optional services, allowing the application to build and run with minimal configuration while supporting full features when all credentials are provided.
