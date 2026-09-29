# Social Media Engagement Agent

An AI-powered continuous learning application that personalizes social media strategy for brands. Unlike generic social-media chatbots, this agent learns from a brand's historical social-media posts, engagement metrics, audience reactions, and previous conversations, then explains and generates recommendations grounded strictly in empirical data.

---

## 🚀 Key Problem & Core Solution

### The Problem
Generic social media advice fails because every brand has a distinct audience. Prescribing "short videos perform well" or "post 3 times a day" ignores what a specific brand's followers actually interact with and bookmark.

### The Solution: Persistent Memory Agent
1. **Persistent Memory Bank**: Retains historical posts, exact engagement metrics (likes, comments, shares, saves, reach), calculated engagement rate $((Likes+Comments+Shares+Saves)/Reach \times 100)$, audience reactions, and previous recommendations.
2. **Data-Grounded Reasoning**: Never gives generic advice. Explains recommendations using the brand's own empirical metrics (e.g. *"Your audience interacted significantly more with short AI tutorial videos. Your 9 short video posts averaged 7.04% ER vs 1.70% for single image posts"*).
3. **Closed-Loop Feedback**: Recommendation → Post Published → Metrics Added → Agent Evaluates Outcome vs Baseline → Memory Bank Refined.
4. **Hybrid RAG Retrieval**: Queries memories using vector embeddings (`gemini-embedding-2-preview`) and multi-factor relevance scoring (topic, format, timing, and normalized engagement) rather than dumping raw tables into LLM context.
5. **Clear Badging**: Visually distinguishes **`[HISTORICAL DATA]`**, **`[AI INSIGHT]`**, and **`[RECOMMENDATION]`**.

---

## 📐 Architecture Pipeline

```text
User / Brand Owner
       ↓
Dashboard / Chat Agent / Recommender / Post Analyzer
       ↓
Memory Retrieval (Hybrid Semantic Embeddings + Empirical Filters)
       ↓
Historical Posts & Audience Memory Rules
       ↓
Gemini 3.8 Flash Reasoning & Content Synthesis
       ↓
Personalized Recommendation & Platform Copy
       ↓
User Publishes Post
       ↓
Actual Performance Data Logged (Likes, Comments, Shares, Saves, Reach)
       ↓
Continuous Learning Feedback Loop (Evaluates Delta vs Baseline)
       ↓
Memory Bank Refined for Future Generations
```

---

## 📂 Project Structure

```text
.
├── .data/                           # Persistent file-backed JSON database store
├── server/
│   ├── db/
│   │   ├── schema.ts                # MongoDB-compatible schemas & interfaces
│   │   ├── store.ts                 # Collection-based CRUD store with persistence
│   │   └── seed.ts                  # 24 realistic historical posts for Synthetix AI
│   ├── services/
│   │   ├── gemini.ts                # @google/genai SDK integration (gemini-3.8-flash)
│   │   ├── memoryEngine.ts          # RAG, vector similarity, empirical analytics
│   │   └── agent.ts                 # Chat reasoning, recommendations, post diagnosis
│   └── routes/
│       └── api.ts                   # Express REST API endpoints
├── src/
│   ├── components/
│   │   ├── Header.tsx               # Brand context & navigation bar
│   │   ├── BadgeTag.tsx             # Visual badges (Historical Data / AI Insight / Rec)
│   │   ├── DashboardView.tsx        # Overview cards, charts, timeline, post table
│   │   ├── RecommenderView.tsx      # AI Content Recommender & proof breakdowns
│   │   ├── ContentGeneratorView.tsx # Hook, caption, hashtag, & platform copy generator
│   │   ├── PostAnalyzerView.tsx     # Add/Upload post, live ER calculator, diagnostics
│   │   ├── AudienceMemoryView.tsx   # Visual Audience Memory Bank with supporting post citations
│   │   ├── ChatAgentView.tsx        # RAG-powered conversation agent with memory drawers
│   │   ├── FeedbackLoopView.tsx     # Closed-loop tracking & outcome validations
│   │   ├── FeedbackLoopModal.tsx    # Modal to log actual post metrics
│   │   └── MemorySearchRAGView.tsx  # Dedicated RAG & semantic retrieval explorer
│   ├── App.tsx                      # Root component with state management
│   ├── types.ts                     # TypeScript data contracts
│   └── index.css                    # Tailwind CSS 4 setup & styling
├── server.ts                        # Full-stack server (Express + Vite middlewares)
├── package.json
├── metadata.json
└── README.md
```

---

## 🗄️ Database Schemas (MongoDB Collections)

The application models 7 core document collections:

1. **`brands`**: Brand identity, target audience, primary platforms, tone of voice.
2. **`social_posts`**: Historical and published posts (platform, format, topic, caption, hook, hashtags, day of week, time of day, metrics, audience feedback).
3. **`engagement_metrics`**: Granular engagement records (likes, comments, shares, saves, reach, impressions, engagementRate).
4. **`audience_memory`**: High-confidence learned rules (category, title, insight, confidenceScore, supportingPostIds, supportingMetricsProof).
5. **`recommendations`**: Forward-looking recommendations (topic, format, platform, timing, reason, supportingHistoricalData, expectedEngagementTrend, suggestedCopy, feedbackResult).
6. **`conversations`**: Chat sessions with agent including retrieved memory IDs and citation proof quotes.
7. **`users`**: Brand owner account profile.

---

## 🌐 API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/dashboard` | `GET` | Fetches brand statistics, format/topic benchmarks, and performance timeline |
| `/api/posts` | `GET` | Retrieves historical posts with filtering by format, topic, and sort order |
| `/api/posts` | `POST` | Ingests a new post, runs diagnostic, computes ER, updates memory |
| `/api/posts/:id` | `DELETE` | Removes a post from memory |
| `/api/recommendations` | `GET` | Retrieves all pending and published recommendations |
| `/api/recommendations/generate` | `POST` | Generates a new personalized recommendation backed by historical data |
| `/api/recommendations/:id/feedback` | `POST` | Records actual engagement metrics, evaluates outcome, refines memory |
| `/api/generate-content` | `POST` | Generates platform-specific copy applying learned preferences |
| `/api/memory` | `GET` | Retrieves active Audience Memory rules with supporting post citations |
| `/api/memory/consolidate` | `POST` | Re-evaluates all memory rules across the full post dataset |
| `/api/memory/search` | `POST` | Semantic & keyword RAG explorer returning relevance scores and matches |
| `/api/chat` | `POST` | Interactive conversational agent powered by RAG context |
| `/api/chat/history` | `GET` | Retrieves conversation history |
| `/api/chat/clear` | `POST` | Clears conversation history |
| `/api/forecast` | `POST` | **Kaggle Engine**: Simulates pre-publish performance, viral score, feature attribution |
| `/api/kaggle/export` | `GET` | Exports brand posts to Kaggle Competition-compliant CSV dataset |
| `/api/kaggle/import` | `POST` | Parses and imports external Kaggle CSV training datasets into brand memory |
| `/api/kaggle/benchmark-load` | `POST` | Ingests pre-built Kaggle benchmark competition posts into store |
| `/api/engagement-hub` | `GET` | **Engagement Hub**: Multi-channel comparison, sentiment radar, heatmaps, & queue |
| `/api/schedule` | `POST` | Queues draft posts with predictive ER scoring into publishing calendar |
| `/api/schedule/:id` | `DELETE` | Removes post from scheduling queue |
| `/api/schedule/:id/publish` | `POST` | Immediately publishes scheduled post & integrates into memory bank |
| `/api/executive-report` | `GET` | Generates strategic executive KPI report with cross-channel benchmarks |
| `/api/datasets` | `GET` | **Dataset Hub**: Lists available active, preset, and custom datasets |
| `/api/datasets/browse` | `GET` | Paginated, filterable, and searchable in-app post dataset explorer |
| `/api/datasets/upload` | `POST` | Ingests user CSV/JSON dataset, appends or replaces, consolidates memory |
| `/api/datasets/load-preset` | `POST` | Switches brand profile to Synthetix AI, Luminary DTC, or Kaggle benchmark |
| `/api/datasets/export` | `GET` | Downloads active dataset as standardized CSV or JSON |
| `/api/posts/:id` | `PUT` | Edits post content/metrics inline from the dataset browser |
| `/api/reset-demo` | `POST` | Resets database to the 24-post realistic demo dataset for testing |

---

## 🗄️ Dataset Hub & In-App Dataset Browser
Allows users to upload their own datasets and interactively explore, search, filter, and inspect data records:
1. **Interactive In-App Browser**:
   - Filter by **Platform** (LinkedIn, Twitter/X, Instagram, YouTube, TikTok), **Format** (Short Video, Carousel, Image, Thread, Text), and **Topic**.
   - Search across captions, hooks, topics, and hashtags.
   - Sort by Date, Engagement Rate, Reach, Likes, Comments, Shares, and Saves.
   - Virality toggle to instantly isolate top-performing posts ($\ge 7.0\%$ ER).
   - Detailed row inspection drawer showing full metric breakdowns, audience praise, and sentiment scores.
   - Inline post editor (`PUT /api/posts/:id`) allowing direct metric updates and automatic ER recomputation.
2. **Custom Dataset Ingestion (CSV / JSON)**:
   - File picker or drag-and-drop support for `.csv` and `.json` datasets.
   - Direct text paste box with column auto-detection (`Platform`, `Format`, `Topic`, `Caption`, `Likes`, `Comments`, `Shares`, `Saves`, `Reach`).
   - Import Modes: **Append** (augments current memory bank) or **Replace** (boots a fresh brand with new industry profile).
   - Automatic re-consolidation of audience memory upon upload.
3. **Preset Brand Switching**:
   - **Synthetix AI** (Tech / Developer Tools • 24 posts • 5.21% ER)
   - **Luminary Apparel** (Direct-to-Consumer Sustainable Fashion • 10 posts • 9.35% ER)
   - **Kaggle Benchmark Suite** (Post Performance Forecasting records • 12 posts • 6.45% ER)
4. **Dataset Export**:
   - One-click export to standardized CSV or formatted JSON.

---

## 📈 Multi-Platform Operations & Engagement Hub (`abhishek07ma/Social_Media_Engagement_Dashboard`)
Incorporating the centralized multi-account architecture and social listening workflows inspired by `abhishek07ma/Social_Media_Engagement_Dashboard`:
1. **Multi-Channel Platform Standings**:
   - Compare performance across LinkedIn, Twitter/X, Instagram, and YouTube.
   - Monitors followers velocity, audience reach, impressions, average engagement rates, top content format, and positive sentiment ratios.
2. **7-Day × 24-Hour Engagement Intensity Heatmap**:
   - High-resolution visual grid showing historical engagement performance across hours (08:00–21:00) for every day of the week.
   - Highlights optimal publishing windows (e.g. Tuesday & Thursday afternoons) with 1-click scheduling.
3. **Audience Sentiment & Social Listening Radar**:
   - Sentiment health meter (Positive, Neutral, Inquiries/Critical distribution).
   - Recurring community feedback extraction and recurring questions radar.
   - Trending hashtag & keyword momentum tracker (`#AIDevelopment`, `JSON Schema Validation`, `#TypeScript`, `Streaming Agents`) showing real-time engagement rate lifts.
4. **Publishing Calendar & Scheduling Queue**:
   - Manage upcoming queued content planned around optimal AI time slots.
   - "Publish Now" action converts scheduled drafts into verified live posts and updates the memory bank.
5. **Executive KPI Performance Report**:
   - Instant printable summary report with high-level directives, channel rankings, and content efficiency metrics.

---

## 📊 Kaggle Competition Integration: Social Media Post Performance Forecasting
The agent implements the schema, forecasting methodology, and dataset structure from the Kaggle **Social Media Post Performance Forecasting** competition:
- **Competition Features Modeled**:
  - `Content_Type` / `Format`: Video, Carousel, Single Image, Text
  - `Temporal Dynamics`: `Day_Of_Week`, `Hour_Of_Day`, `Is_Weekend`
  - `Content Attributes`: `Caption_Length`, `Hashtags_Count`, `Hook_Strength` (1-10), `Video_Duration_Sec`, `Has_Media`
  - `Audience & Creator`: `Follower_Tier`, historical brand affinity multipliers
- **Forecasting Outputs**:
  - Predicted Engagement Rate with 95% Confidence Intervals
  - Viral Probability Score & Potential Virality Rating
  - Feature Attribution Breakdown (SHAP-style positive & negative impact drivers)
  - Pre-computed Validation Metrics on Brand History: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and $R^2$ determination score
  - Historical precedent matching comparing draft features to past top performers
- **Kaggle CSV Interoperability**:
  - Download brand history as `kaggle_social_media_posts.csv`
  - Upload external Kaggle challenge CSVs directly via the **Forecasting** tab
  - One-click benchmark dataset loader adding verified competition post samples into the live memory bank

---

## 🧪 Realistic Demo Scenario: "Synthetix AI"

The database comes pre-seeded with **24 realistic historical posts** for `@synthetix_ai` (a developer-first AI engineering brand) spanning 45 days:
- **AI Tutorials** (Average **6.89% ER**, 4,500+ saves)
- **Short Technical Videos** (Average **7.04% ER**, outperforming images by +314%)
- **Educational Carousels** (Average **6.53% ER**, peak saves on Friday mornings)
- **Product Announcements** (Average **4.63% ER**)
- **Promotional Posts** (Average **1.63% ER**, demonstrating clear audience fatigue)

Judges can click **"Reset Demo Data"** in the top navigation at any time to return to this clean baseline.

---

## 🛠️ Setup & Running

### Environment Variables
Configure `.env` (or set via AI Studio Secrets):
```bash
GEMINI_API_KEY="your-gemini-api-key"
```

### Installation & Execution
```bash
npm install
npm run dev
```
The server will start on `http://localhost:3000` with both API endpoints and the React frontend.
