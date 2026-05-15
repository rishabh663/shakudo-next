-- =====================================================================
-- Shakudo Stack Builder — database schema
-- =====================================================================
-- Generated from uploads/integrations.json (235 components, 38 categories).
-- Target: PostgreSQL 14+. Adapt types for other engines as needed.
--
-- Tables:
--   categories         — taxonomy that drives the left sidebar filters
--   stack_components   — the catalog cards rendered in the Stack Builder
--   stack_submissions  — one row per submitted stack request
--   stack_submission_items — join table: which components were in each request
--
-- Conventions:
--   • slug  — kebab-case, URL-safe, used as natural key everywhere
--   • timestamps default to UTC (timestamptz)
--   • Webflow CMS item IDs are kept in legacy_cms_id for traceability
-- =====================================================================

BEGIN;

DROP TABLE IF EXISTS stack_submission_items CASCADE;
DROP TABLE IF EXISTS stack_submissions      CASCADE;
DROP TABLE IF EXISTS stack_components       CASCADE;
DROP TABLE IF EXISTS categories             CASCADE;

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id           SERIAL       PRIMARY KEY,
  slug         TEXT         NOT NULL UNIQUE,
  name         TEXT         NOT NULL,
  description  TEXT,
  sort_order   INTEGER      NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_sort ON categories (sort_order, slug);

-- ---------------------------------------------------------------------
-- stack_components — the cards in the Stack Builder catalog
-- ---------------------------------------------------------------------
CREATE TABLE stack_components (
  id             SERIAL       PRIMARY KEY,
  slug           TEXT         NOT NULL UNIQUE,
  name           TEXT         NOT NULL,
  one_liner      TEXT         NOT NULL,
  logo_url       TEXT,
  category_slug  TEXT         NOT NULL
                              REFERENCES categories(slug)
                              ON UPDATE CASCADE
                              ON DELETE RESTRICT,
  kb_url         TEXT,                          -- reserved; rendered when ready
  version        TEXT,                          -- e.g. "1.4.2"; nullable
  last_synced_at TIMESTAMPTZ,                   -- last successful catalog sync
  archived       BOOLEAN      NOT NULL DEFAULT FALSE,
  legacy_cms_id  TEXT,                          -- original Webflow CMS item id
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_components_category ON stack_components (category_slug);
CREATE INDEX idx_components_archived ON stack_components (archived);
CREATE INDEX idx_components_name_trgm ON stack_components USING gin (name gin_trgm_ops);
-- ^ requires: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------
-- stack_submissions — one per "Submit stack" form submission
-- ---------------------------------------------------------------------
CREATE TABLE stack_submissions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name    TEXT         NOT NULL,
  contact_email   TEXT         NOT NULL,
  company_name    TEXT         NOT NULL,
  note            TEXT,
  status          TEXT         NOT NULL DEFAULT 'received'
                               CHECK (status IN ('received','in_review','contacted','closed')),
  submitted_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     TEXT,
  source          TEXT         NOT NULL DEFAULT 'stack-builder'
);

CREATE INDEX idx_submissions_status     ON stack_submissions (status, submitted_at DESC);
CREATE INDEX idx_submissions_email_lc   ON stack_submissions (lower(contact_email));

-- ---------------------------------------------------------------------
-- stack_submission_items — components attached to a submission
-- ---------------------------------------------------------------------
CREATE TABLE stack_submission_items (
  submission_id   UUID    NOT NULL REFERENCES stack_submissions(id) ON DELETE CASCADE,
  component_slug  TEXT    NOT NULL REFERENCES stack_components(slug) ON UPDATE CASCADE,
  position        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (submission_id, component_slug)
);

CREATE INDEX idx_submission_items_component ON stack_submission_items (component_slug);

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- Categories (38) ------------------------------------------------------
INSERT INTO categories (slug, name, sort_order) VALUES
  ('ai-agent', 'Ai Agent', 0),
  ('ai-coding', 'Ai Coding', 10),
  ('api', 'API', 20),
  ('automl', 'AutoML', 30),
  ('business-intelligence', 'Business Intelligence', 40),
  ('communication', 'Communication', 50),
  ('data-catalog', 'Data Catalog', 60),
  ('data-dashboard', 'Data Dashboard', 70),
  ('data-format', 'Data Format', 80),
  ('data-integration', 'Data Integration', 90),
  ('data-lake', 'Data Lake', 100),
  ('data-logging', 'Data Logging', 110),
  ('data-platform', 'Data Platform', 120),
  ('data-quality', 'Data Quality', 130),
  ('data-source', 'Data Source', 140),
  ('data-storage', 'Data Storage', 150),
  ('data-streaming', 'Data Streaming', 160),
  ('data-transformation', 'Data Transformation', 170),
  ('data-warehouse', 'Data Warehouse', 180),
  ('database', 'Database', 190),
  ('dbms', 'DBMS', 200),
  ('devops', 'Devops', 210),
  ('distributed-computing', 'Distributed Computing', 220),
  ('ide-development-environment', 'IDE Development Environment', 230),
  ('language', 'Language', 240),
  ('large-language-model-llm', 'Large Language Model LLM', 250),
  ('low-code-development-platform', 'Low Code Development Platform', 260),
  ('machine-learning', 'Machine Learning', 270),
  ('model-serving', 'Model Serving', 280),
  ('model-tracking', 'Model Tracking', 290),
  ('monitoring', 'Monitoring', 300),
  ('pipeline-orchestration', 'Pipeline Orchestration', 310),
  ('security', 'Security', 320),
  ('spatial-data', 'Spatial Data', 330),
  ('static-site-generator', 'Static Site Generator', 340),
  ('version-control', 'Version Control', 350),
  ('web-framework', 'Web Framework', 360),
  ('workflow-automation', 'Workflow Automation', 370);

-- Components (235) -----------------------------------------------------
INSERT INTO stack_components (slug, name, one_liner, logo_url, category_slug) VALUES
  ('activepieces', 'Activepieces', 'All-in-one enterprise automation tool', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6595749ed644eef0df19eac5_99494700.png', 'workflow-automation'),
  ('aider', 'Aider', 'AI pair programming terminal tool', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67900027d1080da9b7e9d0ef_aider%20coding%20icon.png', 'ai-coding'),
  ('airbyte', 'Airbyte', 'Move data from one system to another', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d59a019dcec77988b334a0_airbyte-logo.svg', 'data-integration'),
  ('amazon-eventbridge', 'Amazon EventBridge', 'Serverless service that uses events to connect application components', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/63bdc24d00b2cf4eaef87b61_aws-eventbridge-logo.svg', 'data-streaming'),
  ('amazon-quicksight', 'Amazon QuickSight', 'Visualize and understand your data with ease', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6442b861306689a8e4b4ebc5_amazon-quicksight-logo-svg-vector.svg', 'business-intelligence'),
  ('amazon-redshift', 'Amazon Redshift', 'Transform your data insights with parallel task execution', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e6855e26e61247127ecb_63bdba82fbba1214de98c30d_1862px-Amazon-Redshift-Logo.svg%255B1%255D.png', 'data-warehouse'),
  ('amazon-s3', 'Amazon S3', 'Cloud storage service from Amazon Web Services', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/62fe97e220d67d492d1bcc09_logo-amazons3.svg', 'data-storage'),
  ('amundsen', 'Amundsen', 'Open source data discovery and metadata engine', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e684d06f50d407f02030_6442ba90e63e6974958cfc44_default_f7df32c09fd9d8abcc75467c79d3965f2c43ec6f.png', 'data-catalog'),
  ('apache-airflow', 'Apache Airflow', 'Batch-oriented workflows platform', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d24eed8a6e2bcbced6c94d_Vector-4.svg', 'pipeline-orchestration'),
  ('apache-doris', 'Apache Doris', 'Open-source real-time data warehouse based on MPP architecture', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/64f357d82ded908796214466_63a3188333965569ef0ea2fb_apachedoris.svg', 'data-warehouse'),
  ('apache-flink', 'Apache Flink', 'Distributed processing engine for stateful computations ', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6511e685b95525e2011d6107_64c286d5722d137a0396fa6e_flink_squirrel_1000.avif', 'data-streaming'),
  ('apache-hudi', 'Apache Hudi', 'Data Lake Platform for batch and stream processing', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6511e6852e7ebc4590ccf264_63c1d181186734073100c9e2_logo-big%255B1%255D.png', 'data-lake'),
  ('apache-iceberg', 'Apache Iceberg', 'A table format for massive, slow-moving data with superior data reliability.', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6511e6852755b63d23cdd8aa_64c27c004934b6d23bc7eef6_iceberg-logo-icon.png', 'data-lake'),
  ('apache-kafka', 'Apache Kafka', 'High-throughput, low-latency, and fault-tolerant data streaming', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d5983a6f968b9a1227a0d9_kafka-logo.svg', 'data-streaming'),
  ('apache-parquet', 'Apache Parquet', 'Efficient, column-oriented data storage format for analytics.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e685fd071760ce1db3dd_64c283b48d8d6c13d3b9e98c_icon.png', 'data-format'),
  ('appsmith', 'Appsmith', 'Fast low-code application builder', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6617eed8c7a2a78137fc011f_appsmith-18-04.svg', 'low-code-development-platform'),
  ('argo-cd', 'Argo CD', 'Declarative continuous delivery tool', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67901960969589c3d9101584_argodc%20icon.png', 'devops'),
  ('atomic-agents', 'Atomic Agents', 'Modular framework for AI agent development', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67acf5c1087089355f749ed3_communityIcon_wrwmbpao4k9e1.png', 'ai-agent'),
  ('autogen', 'Autogen', 'Multi-agent AI framework', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/678ffc98f78a86377faf246d_autogen%20icon.png', 'large-language-model-llm'),
  ('autogluon', 'AutoGluon', 'Automates deep learning and machine learning for real world applications', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e685ae5798f3e4f347d2_630c6421ef12212896793b59_wTG6A_Ct_400x400.png', 'automl'),
  ('azure-blob-storage', 'Azure Blob Storage', 'Store your unstructured data with ease and scalability', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e685656f1bddbeaf4396_6442a50640e4d59707e2d719_storage-blob.png', 'data-storage'),
  ('azure-devops', 'Azure DevOps', 'Software development tools by Microsoft', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/678ffd9d9fe9441f7745c626_azure-devops-color-icon-2048x2048-140zbjrd.png', 'devops'),
  ('bigquery', 'BigQuery', 'Unlock the power of big data', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e685dabff497fd913db8_63bdc32bc2e71b045f8be52e_bigquery-icon-256x256-te1p4oc9%255B1%255D.png', 'data-warehouse'),
  ('bitbucket', 'Bitbucket', 'Manage private code changes with versioning system', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68665b1b1dc0dc680b5_63c1b9f83b30d05f40849c0d_6125001%255B1%255D.png', 'version-control'),
  ('bytebase', 'Bytebase', 'GitHub for Database DevOps', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6616fdd7e0e8ba1342be130c_Group%202879.svg', 'devops'),
  ('capacitor', 'Capacitor', 'Versatile UI for FluxCD', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790f79b7644d889d8fb3d6c_capacitor%20icon.avif', 'devops'),
  ('ceph', 'Ceph', 'Unified scalable distributed storage', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/68bf14f1785b66af52659f2f_ceph_logo_icon_170406.png', 'data-storage'),
  ('chroma', 'Chroma', 'The fastest way to build Python or JavaScript LLM apps with memory', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e686bff8cab42df915cc_6481f95677ecb95156d58c54_chroma.png', 'database'),
  ('clair', 'Clair', 'Vulnerability Static Analysis for Containers', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6675b9d221f60c58bf57e526_clair-icon%5B1%5D.svg', 'security'),
  ('clamav', 'ClamAV', 'High-performance malware detection engine', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/66c6123dc1e06e74097a0aa7_clamav-logo%20(2).svg', 'security'),
  ('claude', 'Claude', 'Safe and accurate AI Model', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67acf670430fd4299a3cf479_images.png', 'large-language-model-llm'),
  ('clickhouse', 'ClickHouse', 'Columnar DBMS optimized for speed in OLAP scenarios.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59ed8353f56c3bd75db29_clickhouse-logo.svg', 'dbms'),
  ('cline', 'Cline', 'Autonomous AI coding assistant', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67e710e5ef71313f610c2704_favicon-256x256.png', 'ai-coding'),
  ('cloudflare-r2', 'Cloudflare R2', 'Efficient and secure cloud storage made simple', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e6862755b63d23cdd915_63ed47fb3331ed644bf91122_cloudflare.png', 'data-storage'),
  ('code-server', 'Code-server', 'Collaborate and code anywhere with powerful web-based code editor', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e686b95525e2011d6259_63ed5e77967b121ad06a01cb_68747470733a2f2f692e696d6775722e636f6d2f5543714f7746432e706e67.png', 'ide-development-environment'),
  ('cohere', 'Cohere', 'Advanced Large Language Models and NLP tools via an easy-to-use API', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68683e4ecf36c13d195_649b4797d363aa79adb7c78e_cohere-logo-icon.png', 'large-language-model-llm'),
  ('command-r', 'Command R', 'LLM for long-context tasks', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6830d31fb3f694a0dda6f45e_apps.49158.5aced29e-0eea-408e-9c63-3ac0008bf2fe.c7fbce4f-85b5-4463-a38f-0355618b2b8f.png', 'large-language-model-llm'),
  ('continue', 'Continue', 'Customizable AI autopilot', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67f9351905af7e386e1e09e4_favicon.png', 'ai-coding'),
  ('copilotkit', 'CopilotKit', 'AI copilots integration framework', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/679002c969936992c4bc55cd_copilotkit%20icon.jpeg', 'ai-coding'),
  ('coraza', 'Coraza', 'Golang modsecurity compatible web app firewall library', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/665a30dd278cbb79ee3660ad_logo_shield_only.png', 'security'),
  ('crewai', 'CrewAI', 'AI agent orchestration framework', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67900241e08a521b32adb6e3_crewai%20icon.png', 'ai-agent'),
  ('cube', 'Cube', 'Access, organize, and deliver data from modern data stores to any application.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e686f35632fad09c7532_63a48e6222930cd7ec701475_1_IOQXIvUjx2xshhlxxBjytQ%255B1%255D.png', 'business-intelligence'),
  ('dagster', 'Dagster', 'Simplify your data workflows', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d59843b498b47fce53a69a_dagster-logo.svg', 'pipeline-orchestration'),
  ('dask', 'Dask', 'Flexible open-source Python library for parallel computing', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/62fe945ca7e0e8092d7d157a_dask_icon_no_pad.svg', 'distributed-computing'),
  ('databricks', 'Databricks', 'Cloud-based platform for big data analytics and machine learning.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65529875c4931bef249126a7_16002836894132567677717491881160%5B1%5D.png', 'data-platform'),
  ('datahub', 'DataHub', 'Break down data silos and accelerate innovation', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d5984f7c71f33757b1287d_datahub-logo.svg', 'data-catalog'),
  ('daytona', 'Daytona', 'Daytona: Simplifying Development Environment Management', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790f8159831b5b1a967d340_daytona-icon.png', 'ide-development-environment'),
  ('dbt', 'dbt', 'Transform, Optimize, and Test your data', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59a1cec14970b4f761a76_dbt-logo.svg', 'data-transformation'),
  ('deepseek', 'DeepSeek', 'Open-source LLM with OpenAI o1 performance', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6797b9a9733e6a5d495827a9_cdnlogo.com_deepseek-icon.svg', 'large-language-model-llm'),
  ('delta-lake', 'Delta Lake', 'Reliable, efficient data versioning and transaction control.', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d59a093e579428832982f7_deltalake-logo.svg', 'data-lake'),
  ('dify', 'Dify', 'Open-Source Assistants API and GPTs alternative', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65dcc7d474a539bf2b814c7d_dify-ai-logo.avif', 'large-language-model-llm'),
  ('django', 'Django', 'High-level Python web framework for rapid development', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e687baeafd2124c77760_630cfe152115da26b3ef5bfd_django%252Bplain-1324760528664172128.png', 'web-framework'),
  ('docling', 'Docling', 'Transform documents for AI comprehension', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/68bf149b852c4f72233e2ffd_188446108.png', 'data-transformation'),
  ('dremio', 'Dremio', 'Easy and Open Data Lakehouse', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6511e68753c9b53ddd93c207_64428f4aae22a690a67a13b5_dremio_logo_icon_168234.png', 'data-lake'),
  ('duckdb', 'DuckDB', 'Fast in-process analytical database', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d5981ec255994e09c63eb4_duckdb-logo.svg', 'dbms'),
  ('elasticsearch', 'Elasticsearch', 'Search & analytics engine, excelling in real-time, distributed search', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/64cbe56c3b962ba2928c62a1_1583389547nUU3zr9ry4.svg', 'database'),
  ('esmf', 'ESMF', 'Build coupled Earth System Models', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e6870787b80a5c595143_6442c650f42ec90b4494bfab_esmf-removebg-preview.png', 'spatial-data'),
  ('evidence', 'Evidence', 'Build polished data products with SQL', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65ca3320270ab79951a23ae6_evidence-logo-svg.svg', 'static-site-generator'),
  ('evidently', 'Evidently', 'Debug your machine learning models with ease using an interactive platform', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/63bdb740bbee640c73efed3d_evidently-logo.svg', 'monitoring'),
  ('falco', 'Falco', 'Cloud-native runtime security & threat detection', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/66c60cab9061c8d926275977_icon-falco.png', 'security'),
  ('falcon-llm', 'Falcon LLM', 'Open-source LLM with 40B parameters trained on 1T tokens', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e687bff8cab42df9168b_6499e3c02bc54154aa9b7100_falcon-llm-logo%2520(2).jpeg', 'large-language-model-llm'),
  ('fastapi', 'FastAPI', 'Fast web framework for building APIs with Python', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e687180e58c9b68d1f3b_630cfd992cd6978e17b08539_communityIcon_r5ax236rfw961.png', 'web-framework'),
  ('fastchat-t5', 'FastChat-T5', 'Open-source, fine-tuned chatbot model', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e687369c6118116b6b10_649b41833357d74ef3c46ec9_FastChat.png', 'large-language-model-llm'),
  ('feast', 'Feast', 'Consistent feature store for ML', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/679147d806527de7203bc0b9_feast%20icon.jpg', 'machine-learning'),
  ('flan-t5', 'Flan-T5', 'Enhanced T5 LLM model, finetuned on a mixture of tasks', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e687bff8cab42df916e9_649b44d2c32f1d9b52e90030_flan-t5-icon-logo.png', 'large-language-model-llm'),
  ('flan-ul2', 'flan-ul2', 'Encoder decoder model based on the T5 architecture by Google', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e687b95525e2011d6712_6438138f24a6c379efc02edb_flan-ul2.png', 'large-language-model-llm'),
  ('flask', 'Flask', 'Minimalist, small, lightweight Python web framework', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e687bff8cab42df916f0_630cfcab11ef15cdb6404be4_flask-icon.png', 'web-framework'),
  ('flyte', 'Flyte', 'Cloud-native workflow orchestration platform for scalable data workflows', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/64dfae2c7fe352abbc73fb93_icon-flyte.svg', 'pipeline-orchestration'),
  ('fugue', 'Fugue', 'Execute code across multiple distributed computing platforms', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e688756346924afe7520_63bdb7aef32769275e675cb2_logo.svg', 'distributed-computing'),
  ('gdal', 'GDAL', 'Unlock the power of geospatial data', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68870302f0d4d8b92f6_6442c3276d1a697d62b598a9_1200px-GDALLogoColor.svg.png', 'spatial-data'),
  ('gemini', 'Gemini', 'Google''s versatile AI Model', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67acf76411ca64d547e390f1_images.png', 'large-language-model-llm'),
  ('geopandas', 'GeoPandas', 'Unlock the power of geospatial data with ease', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e6889d4c59f14b7c0639_6442c2a36349acabb562167d_geopandas_icon.webp', 'spatial-data'),
  ('geyser-data', 'Geyser Data', 'Cold Data Cloud', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6849d175688a9f594ca58cd5_images.jpg', 'data-storage'),
  ('github', 'Github', 'Create, store, manage and share code', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59e92adc63c6486b9dbca_github-logo.svg', 'version-control'),
  ('gitlab', 'GitLab', 'Secure code repository and development platform', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/63c1b755704c73151a655b26_gitlab-logo-500.svg', 'version-control'),
  ('google-storage-bucket', 'Google Storage Bucket', 'Securely store and manage your data with ease', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e6888134bfd25c421a08_6442a689490d76474074a8b6_google-cloud-storage.png', 'data-storage'),
  ('goose', 'Goose', 'Extensible AI agent framework', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67e710b4690606c2d952e034_logo_light.avif', 'ai-coding'),
  ('gpt-3', 'GPT-3', 'LLM developed by OpenAI', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e688031c7ba81a905cd8_643f19aedce22047dd364341_gpt3.png', 'large-language-model-llm'),
  ('gpt-3-5', 'GPT-3.5', 'LLM by OpenAI improved on GPT-3', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e6883897dd02d4050dd0_643f17e16291ee4957449919_gpt35.png', 'large-language-model-llm'),
  ('gpt-4', 'GPT-4', 'Top Multimodal LLM developed by OpenAI', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d599afd18f3253f9623ead_openai-logo.svg', 'large-language-model-llm'),
  ('grafana', 'Grafana', 'Powerful monitoring and visualization for data', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d52cd619f5eaf89517191b_grafana-logo%20(2).svg', 'monitoring'),
  ('grafana-loki', 'Grafana Loki', 'Efficiently manage and analyze log data with an index-based system', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/63bdb9203ffb113c55f0728c_logo-loki%5B1%5D.svg', 'data-logging'),
  ('graphql', 'GraphQL', 'Retrieve the data with flexible and targeted API querying capabilities', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e6884defb5629e3962c5_630c60e657c56a98622eb171_2048px-GraphQL_Logo.svg.png', 'api'),
  ('great-expectations', 'Great Expectations', 'Achieve data integrity and reliability with this data quality solution', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59ec854b332282dc82c9c_greatexpectation-logo.svg', 'data-quality'),
  ('guardrails-ai', 'Guardrails AI', 'Adding guardrails to large language models', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67588c23310d639d9efdcc69_140440022.png', 'security'),
  ('h2o-llm-studio', 'H2O LLM Studio', 'Framework and no-code GUI for fine-tuning LLM''s', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/66180376d2671a230673024b_h2o-llmstudio-icon.svg', 'large-language-model-llm'),
  ('harbor', 'Harbor', 'Container registry that secures artifacts with policies and RBAC', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65adf79bdfcdbb93832b73f3_harbor-icon-color%5B1%5D.avif', 'devops'),
  ('hermes-2-pro-mistral-7b', 'Hermes 2 Pro - Mistral 7B', 'Flagship 7B Hermes large language model', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/665a404c8014616ed0cc1f65_Screenshot%202024-05-31%20172158.png', 'large-language-model-llm'),
  ('horovod', 'Horovod', 'Distributed deep learning training framework', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6791476ce5cdb2b3a4fd7749_horovod%20icon.png', 'distributed-computing'),
  ('hugo', 'Hugo', 'Fast framework for building websites', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65ca46505e5c452e9635c64d_hugo-logo.svg', 'static-site-generator'),
  ('hyperdx', 'HyperDX', 'Observability platform unifying logs, metrics, traces, errors, and session replays', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/665a2fbb2e1d4721e43bc5d9_hyperdx-logo.svg', 'monitoring'),
  ('janusgraph', 'JanusGraph', 'Distributed scalable graph database', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6675c07715367fc5475e8fc7_23411090%5B1%5D.png', 'database'),
  ('jax', 'JAX', 'Machine learning research with composable function transformations', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68990fe5275e8c03539_630c64b05b6cbab90d257352_jax_logo_250px.png', 'machine-learning'),
  ('jenkins', 'Jenkins', 'Continuous integration & delivery tool with extensible plugin ecosystem', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e6898134bfd25c421ac9_63c1c32d4fdd78e6f974031c_1200px-Jenkins_logo.svg%255B1%255D.png', 'pipeline-orchestration'),
  ('jupyter-notebook', 'Jupyter Notebook', 'Hosted notebooks integrated directly in your cloud environment', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59a22f0e4e3b5f9e8ca71_jupyter-logo.svg', 'ide-development-environment'),
  ('kasm-workspaces', 'Kasm Workspaces', 'Secure browser-based workspace platform', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790f79e5c174c2046096c2d_kasm%20workspace%20icon.png', 'devops'),
  ('keep', 'Keep', 'AIOps and alert management platform', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790f7cfbf7c1ac6ae0fec3b_keep%20aiops%20icon.avif', 'monitoring'),
  ('kestra', 'Kestra', 'Orchestrator for scheduled and event-driven workflows', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6617f55c548f9ffe69627f09_kestra-icon.svg', 'pipeline-orchestration'),
  ('khoj', 'Khoj', 'Open-source personal AI search engine', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/679001913a60b036519c8309_khoj%20ai%20icon.webp', 'ai-agent'),
  ('kiali', 'Kiali', 'Management console for Istio service mesh', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d520329d321bdbb50005fd_kiali-logo.svg', 'devops'),
  ('kserve', 'KServe', 'Scalable model inference on Kubernetes', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6791471f1afd39e1a4a81696_kserve%20icon.png', 'model-serving'),
  ('kubeflow', 'Kubeflow', 'Simplifying scalable AI on Kubernetes', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67910553905beaaeef4ad7df_kubeflow%20icon.png', 'machine-learning'),
  ('label-studio', 'Label Studio', 'Multi-type data labeling and annotation tool', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6659f609e3060725f4ebfcfa_labelstudio-logo.svg', 'machine-learning'),
  ('lakefs', 'lakeFS', 'Git-like version control for data lakes', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/66f1ee36a9985d98179ea0f5_channels4_profile%5B1%5D.jpg', 'version-control'),
  ('laminar', 'Laminar', 'Build custom integrations fast with AI', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/66a15367a4ff36ada554340b_logo-laminar%20run.svg', 'api'),
  ('langchain', 'LangChain', 'Powering up applications with composable large language models', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68983e4ecf36c13d35f_6481eca09f3578b8946cd47e_communityIcon_vw08a423ptxa1.png', 'large-language-model-llm'),
  ('langflow', 'Langflow', 'Low-code AI builder for developers', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790f822da890c71a6e4db2d_langflow-icon-black-transparent.svg', 'low-code-development-platform'),
  ('langfuse', 'Langfuse', 'LLM Engineering Platform', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/66a155ab2950031b4b62bc89_logo-langfuse.svg', 'large-language-model-llm'),
  ('langgraph', 'LangGraph', 'Stateful orchestration framework for agents', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67901e00e3531a66d49af3f9_langgraph%20icon%20(1).svg', 'ai-agent'),
  ('librechat', 'LibreChat', 'AIO AI chat platform', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/68bf14cd071bc039506732b8_169401942.png', 'large-language-model-llm'),
  ('liferay', 'Liferay', 'Open-source platform for building robust digital experiences.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e689ffca99019c3f7fae_64c2c60280b6269c53933d09_131436.png', 'web-framework'),
  ('lightgbm', 'LightGBM', 'Gradient boosting framework for large datasets', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e6892d6a60d915fcc146_63c1bf93c740e1bf74d3fc6f_lightGBM.png', 'machine-learning'),
  ('litellm', 'LiteLLM', 'Loadbalance, fallbacks and spend tracking across 100+ LLMs in the OpenAI format', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65ca2ab5a0df0102922ac9af_e8bc23c0dc1260735a0e055a99ab9c.avif', 'large-language-model-llm'),
  ('llama-2', 'Llama 2', 'Open source large language model developed by Meta', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6511e6898e966841878dee22_64f2042e4dd1948b864b520b_Frame%25203186%2520(1).avif', 'large-language-model-llm'),
  ('llama-3', 'Llama 3', '3rd large language model developed by Meta', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/680676627b6d59ceab45b628_llama-3-icon.jpg', 'large-language-model-llm'),
  ('llama-4', 'Llama 4', 'Meta''s flagship multimodal AI model', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6806764ddd6f4edff35d5a52_llama-4-icon.jpg', 'large-language-model-llm'),
  ('llamaindex', 'LlamaIndex', 'Data framework for your LLM applications', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65429c5f8c4d4e6dcdfe0f7f_oqVQ04b5KiGt5WOWJmYt8%5B1%5D.png', 'large-language-model-llm'),
  ('localai', 'LocalAI', 'Open Source OpenAI alternative', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d52d4aed16dd56f203f291_localai-logo%20(1).svg', 'large-language-model-llm'),
  ('longhorn', 'Longhorn', 'Distributed storage for Kubernetes', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/68c076ee2b10f32fc55ed8be_longhorn-icon-color.png', 'data-storage'),
  ('looker', 'Looker', 'Drive better outcomes through smarter data-driven experiences', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e689b0d51e3fd84b34f4_6442b8d70a7c3ae1b7dfe09c_google-looker-logo-B27BD25E4E-seeklogo.com.png', 'business-intelligence'),
  ('mage', 'Mage', 'Open-source data pipeline tool for transforming and integrating data.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68913b263a52a60cce7_64dfaadf324c01eef97962db_icon-mage.png', 'pipeline-orchestration'),
  ('mattermost', 'Mattermost ', 'Secure collaboration platform across the entire software development lifecycle', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/665a358dad6c23fabf714fc6_mattermost-logo-svgrepo-com.svg', 'communication'),
  ('meltano', 'Meltano', 'DataOps OS for the entire data lifecycle', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/66c605cf7c23a1fa14097941_meltano.73f0d34.f6f689a38b0fbf42dc9bfa55e539954a%5B1%5D.png', 'data-integration'),
  ('metabase', 'Metabase', 'Simplify your data analysis with intuitive business intelligence tool.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e689dc849173cd6c7e9b_6442b2980b1b8135359d971e_logo.png', 'business-intelligence'),
  ('metaflow', 'Metaflow', 'Framework for real-life ML, AI, and data science', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d524955e9d519456288d6c_metaflow-logo.svg', 'machine-learning'),
  ('milvus', 'Milvus', 'Vector database for AI search and analytics, excelling in similarity search.', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d599a9338ff75d2d3dcb5f_milvus-logo.svg', 'database'),
  ('minicran', 'miniCRAN', 'Create internally consistent, mini CRAN', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/66c60d0b32d64cea6ec10f1c_images%20(2).png', 'language'),
  ('minio', 'MinIO', 'Object storage for large-scale infrastructure', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65ca4d86c2cecabce3e7309a_MINIO_Bird.avif', 'data-storage'),
  ('mistral', 'Mistral', 'Decoder-based LM model for real-time applications', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d24ecd1352ce5c4f504bf2_Vector-10.svg', 'large-language-model-llm'),
  ('mlflow', 'MLflow', 'Track, manage, and deploy machine learning models', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e689031c7ba81a905dd5_63a48f78853f903fea434c78_MLflow-logo-pos-TM-1%255B1%255D.png', 'model-tracking'),
  ('modin', 'Modin', 'Pandas accelerator for faster data analysis ', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e689b5499c9efbb181b1_63bdb8e0eb0c0ed9b9bd67e3_MODIN_ver2_hrz%255B1%255D.png', 'distributed-computing'),
  ('mongodb', 'MongoDB', 'Document database designed for development and scale', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/66cf3394c88cd66c8f13cae4_MongoDB_Logomark_ForestGreen.svg', 'database'),
  ('morphllm', 'MorphLLM', 'Fast and accurate LLM code edits', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6841f092e77ea9c0d308989e_morphllm-icon.png', 'ai-coding'),
  ('motherduck', 'MotherDuck', 'Serverless Data Analytics with DuckDB', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/66c7ad19b228dfe11862a602_thumbnail_Group_22560_88dae6d7f7%5B1%5D.png', 'data-warehouse'),
  ('mpt-7b', 'MPT-7B', 'Open-source LLM model for short-form instruction following', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/649b3fc11986800721d82b9c_mosaic-ml.svg', 'large-language-model-llm'),
  ('mxnet', 'MXNet', 'Deep learning framework to deploy models fast', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68a180e58c9b68d285a_63053edb1de93d2f42dc0bb6_mxnet_logo_2.png', 'machine-learning'),
  ('n8n', 'n8n', 'Streamline complex workflows with low-code, customizable automation.', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d599c273a6b975fdfc0615_n8n-logo.svg', 'workflow-automation'),
  ('neo4j', 'Neo4j', 'Mature native graph database market leader', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6675bd5e96863e017e0fcf16_neo4j_logo_globe%5B1%5D.png', 'database'),
  ('neon', 'Neon', 'Serverless Postgres', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/669fbc4778158e8606eb3e83_favicon%5B1%5D.avif', 'database'),
  ('nextcloud', 'Nextcloud', 'On-prem content collaboration platform', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6617f84589d90592f907bbdd_Nextcloud-icon.svg', 'data-storage'),
  ('node-red', 'Node-RED', 'Low-code programming for event-driven applications', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/666fbff145cbc7d0ac72add5_200px-Node-red-icon%5B1%5D.png', 'workflow-automation'),
  ('nvidia-triton', 'NVIDIA Triton', 'Multi-model serving system for deploying models', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d5999017e849578c019173_nvidia-logo.svg', 'model-serving'),
  ('okta', 'Okta', 'Identity and access management company', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790043ac61e98eeeff62519_okta%20icon.png', 'security'),
  ('ollama', 'Ollama', 'Run open-source large language models locally', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6595a3f16ea6fac5e47d75f3_ollama.avif', 'large-language-model-llm'),
  ('open-notebook', 'Open Notebook', 'Self-hosted AI-powered knowledge management system', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/699f6ab199b095a771182563_logo.svg', 'ai-agent'),
  ('open-webui', 'Open WebUI', 'Self-hosted offline AI interface', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790050cef14b5d04e9cd083_open%20web%20ui%20icon.avif', 'large-language-model-llm'),
  ('openbb', 'OpenBB', 'Elevate your investment research', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68a5e74a933a2491f02_6442c24a0f4fca1799f9bd04_1_GsJLYcS5W2tCfHg4NDOscA%25201%2520(1).png', 'data-source'),
  ('opencode', 'OpenCode', 'Open source AI coding agent for the terminal', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6995fc6c7e316772ec6717cb_opencode-logo-dark-square.png', 'ai-coding'),
  ('opencost', 'OpenCost', 'Open source cost monitoring for Kubernetes', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6997402a0fdede261e22cbbf_Opencost_Icon_Color.svg', 'monitoring'),
  ('openhands', 'OpenHands', 'AI Coding Agent for developers', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790f80dda7b108fd0cd6a43_openhands%20icon.avif', 'ai-agent'),
  ('openllmetry', 'OpenLLMetry', 'Unified observability for LLM apps', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/68bf16623b68d009ad5ea04f_images.png', 'monitoring'),
  ('opik', 'Opik', 'LLM evaluation platform for AI apps', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/68bf16229a1e9857cac75fea_opik.png', 'large-language-model-llm'),
  ('oracle-blob-storage', 'Oracle Blob Storage', 'Securely store and manage your unstructured data', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68a0787b80a5c5952e5_6442a813abfe956dd016caa5_08ed5e21ba68fda78747257e5aa4bb70.png', 'data-storage'),
  ('pagerduty', 'PagerDuty', 'Incident response management platform', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/63bdbfdca0c7b2a9a8ad03b3_pagerduty-logo.svg', 'monitoring'),
  ('pgvector', 'pgvector', 'Vector similarity search for Postgres', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68ac15986fed5671883_64cbe8d958860538eb77d7b4_icon.webp', 'database'),
  ('pgweb', 'pgweb', 'Web-based database explorer for PostgreSQL', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/659c4a7f26af65a19f24a81a_fa_database.svg', 'database'),
  ('pinecone', 'Pinecone', 'General-purpose vector database used for multiple data types', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d598307c71f33757b11847_pinecone-logo.svg', 'database'),
  ('plotly', 'Plotly', 'Interactive data visualizations made easy', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67fd214d0ee64c0130d884b8_images.png', 'data-dashboard'),
  ('polyaxon', 'Polyaxon', 'Streamline machine learning workflows efficiently', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67914748b8449c5fe92de85b_polyaxon%20icon.png', 'machine-learning'),
  ('postgis', 'PostGIS', 'Spatial database extension for PostgreSQL', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6806b28257ff1f716350e69d_postgis-logo.png', 'spatial-data'),
  ('postgres', 'Postgres', 'Open-source RDBMS supporting SQL and JSON queries', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/659c50f7de3ae53af5c45a78_Postgresql_elephant.svg%20(1).png', 'database'),
  ('postgresml', 'PostgresML', 'Train models with SQL-based solution without leaving your database', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6511e68ab0d51e3fd84b3675_63bdb525ed0a251aa7e9d597_owl_gradient%255B1%255D.avif', 'machine-learning'),
  ('microsoft-power-bi', 'Microsoft Power BI', 'Unlock the power of your data.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68a7e4c9e3b113990da_6442b779e4e03d774e078fa6_power-bi-icon-logo-E1B451ED39-seeklogo.com.png', 'business-intelligence'),
  ('prefect', 'Prefect', 'Automate your data workflows with ease', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d4fa0b827de6cf9961c1a9_prefect-logo-black%201.svg', 'pipeline-orchestration'),
  ('project-nessie', 'Project Nessie', 'Transactional catalog for data lakes', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67902395fb40c82297715acb_nessie%20icon.png', 'data-catalog'),
  ('prometheus', 'Prometheus', 'Efficiently monitor and alert on your infrastructure', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68bffca99019c3f80fd_63bdc2fd18897a0b9b9d650e_1200px-Prometheus_software_logo.svg%255B1%255D.png', 'monitoring'),
  ('promptfoo', 'promptfoo', 'Tool for testing and evaluating LLM output quality', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/665a3b84278cbb79ee3ed539_logo%20(3).svg', 'large-language-model-llm'),
  ('purple-llama', 'Purple Llama', 'Set of tools to assess and improve LLM security.', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/675871f3a1de138a8de58cba_purple%20llama%20icon.jpg', 'security'),
  ('pyarrow', 'PyArrow', 'High-speed, arrow-based big data solution for Python', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68bb5199d822066bd08_64ac1d0eb6b54bf09666383f_pyarrow-icon.jpeg', 'data-integration'),
  ('pycharm', 'PyCharm', 'Elevate your Python development with PyCharm', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68bf0432237fbf9f9b3_63bdc280a0c7b29f1ead71f3_1_6Dhu1H4t028lOGbaZuyRCw%255B1%255D.png', 'ide-development-environment'),
  ('pypi-server', 'PyPI Server', 'Minimal PyPI server for uploading & downloading packages', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/66c611d014ea27545968f39d_9453664%5B1%5D.png', 'language'),
  ('python', 'Python', 'Code with simple syntax and efficiency with complex tasks', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6435a992d9fdcc17aa1cf86e_Python-logo-notext.svg', 'language'),
  ('pytorch', 'PyTorch', 'Build and train deep learning and tensor models', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d599a29dcec77988b30c66_pytorch-logo.svg', 'machine-learning'),
  ('qdrant', 'Qdrant', 'High-performance, massive-scale Vector Database', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d514a32b5eeee620df73ac_qdrant-logo.svg', 'database'),
  ('qwen', 'Qwen', 'Transformer-based language model by Alibaba', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67901308f78a86377fc7802e_qwen%20icon.jpeg', 'large-language-model-llm'),
  ('r', 'R', 'Statistical computing and data visualizations language', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68bdc849173cd6c7f94_630c67648bbbed5bd6bcf4e4_R_logo.svg.png', 'language'),
  ('nvidia-rapids', 'NVIDIA RAPIDS', 'Reduce training times from days to minutes on GPUs ', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68b079378fb8e586427_630c628278b484b4a6917b43_Rapids-Logo-lg.png', 'distributed-computing'),
  ('ray', 'Ray', 'Effortlessly scale your most complex AI and Python workloads', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59ea300767ed8a627a30c_ray-logo.svg', 'distributed-computing'),
  ('ray-tune', 'Ray Tune', 'Automate your hyperparameter tuning', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68b65b1b1dc0dc683ac_6442bfb229ee2931592b73a7_1_GsJLYcS5W2tCfHg4NDOscA%25201.png', 'machine-learning'),
  ('redis', 'Redis', 'Fast in-memory database', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68b6ec220751273cede_64cbe94eccc3b50addf41270_download%2520(1).png', 'database'),
  ('retool', 'Retool', 'Internal app builder with many integrations', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/669fc1aaada20ead5005724f_images%5B1%5D.png', 'data-dashboard'),
  ('rill', 'Rill', 'Tool for transforming data sets into dashboards using SQL', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/661704cb524dd17bc2244d18_rill%20logo%20blue.svg', 'business-intelligence'),
  ('rstudio', 'RStudio', 'Integrated development environment (IDE) for R', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65dcc883fe846e3ff5b7334d_rstudio-logo.svg', 'ide-development-environment'),
  ('rudderstack', 'Rudderstack', 'Warehouse native customer data platform', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d24f55a7c957c2dff419c1_Vector-12.svg', 'data-platform'),
  ('sas', 'SAS', 'Comprehensive software suite for data management and statistical analysis', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68b99528ea1336103e9_630c680b57c56ab4982f01e6_sas-logo.png', 'language'),
  ('scikit-learn', 'Scikit-Learn', 'Create machine learning models in Python with easy-to-use library', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68c05318cdd04ddbd67_630c61c478b484d82f9170b1_1200px-Scikit_learn_logo_small.svg.png', 'machine-learning'),
  ('screenshot-to-code', 'Screenshot to Code', 'Converts screenshots to functional code', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790019b9ee9e79d8e50c57a_screenshot%20to%20code%20icon.png', 'ai-coding'),
  ('semantic-kernel', 'Semantic Kernel', 'Build AI applications effortlessly with Semantic Kernel', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67acf61b278fb48e69d42f3d_Large_SK_Logo.png', 'large-language-model-llm'),
  ('semantic-router', 'Semantic Router', 'Superfast decision‑making layer for AI', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6995f5c4018520c7fd309109_semantic%20router%20logo.png', 'ai-agent'),
  ('singlestore', 'SingleStore', 'Unify your data for fast, real-time analytics and applications', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68c99528ea1336106a4_6442a39dc7147f1a28b5579a_0e76f961e3fae46fde49e8060c9f0199.png', 'data-warehouse'),
  ('slack', 'Slack', 'Find, share and act on information across your team', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59eb82a765e3c3f702667_slack-logo.svg', 'monitoring'),
  ('snowflake', 'Snowflake', 'Industry leading cloud-based data warehousing and analytics', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d599b9b34458516930a5e9_snowflake-logo.svg', 'data-warehouse'),
  ('snowplow', 'Snowplow', 'Enterprise-grade behavioral data engine', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65adfc05fe72c2b693384585_32620604%5B1%5D.png', 'data-platform'),
  ('snyk', 'Snyk', 'Developer security platform', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6716b98dce4e7ac343f8071f_snyk-icon-1253x2048-skhaw1dw%5B1%5D.avif', 'security'),
  ('sonarqube', 'SonarQube', 'Continuous code quality & security platform', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/66c609c62a8f98c71dabc0ea_SonarQube_Logo.svg', 'security'),
  ('spacy', 'spaCy', 'Industrial-strength NLP library for Python', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67acf634fe3937fd919b0bcb_images.png', 'language'),
  ('apache-spark', 'Apache Spark', 'Data processing engine for large-scale data processing and analytics.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59a34eb13830a82cbc1bb_spark-logo.svg', 'distributed-computing'),
  ('spectaql', 'SpectaQL', 'Auto-generate API docs from GraphQL schema and customizations', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68cb0d51e3fd84b3861_64cbbf988fcef0ad45b970a2_spectaql-logo.png', 'api'),
  ('stanford-alpaca', 'Stanford Alpaca', 'Strong, Replicable Instruction-Following LLM from Standford', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68c13b263a52a60cfcd_6435ccaac7909609fdb5c5ba_Screenshot_2023-03-14_at_06.29.46_wtpo3u.webp', 'large-language-model-llm'),
  ('streamlit', 'Streamlit', 'Create web apps for data science and machine learning fast', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68c71dde8ad923a2409_630c69755ada9a352dc4979c_streamlit-logo.png', 'data-dashboard'),
  ('supabase', 'Supabase', 'Open source Firebase alternative on PostgreSQL', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d52cc6aeee16b9ab6b0a0e_supabase-logo%20(1).svg', 'data-platform'),
  ('superagi', 'SuperAGI', 'Autonomous AI agent framework for developers', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67ace661925c6a5e23f3dedd_Frame-113818.png', 'ai-agent'),
  ('apache-superset', 'Apache Superset', 'Effortlessly explore and visualize your data on a lightweight, and scalable tool.', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/65d59a1202406b23ac7621b9_superset-logo.svg', 'business-intelligence'),
  ('surrealdb', 'SurrealDB', 'Real-time multi-model cloud database', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6806b2775141ae63ebc3690a_icon.png', 'database'),
  ('tensorflow', 'TensorFlow', 'Create production-grade machine learning models', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59eadf974e0a9c134e096_tensorflow-logo.svg', 'machine-learning'),
  ('tooljet', 'ToolJet', 'Rapid internal tool development platform', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/66c60b8e3c079b710fcbb0e9_tooljet-icon.png', 'low-code-development-platform'),
  ('transformers', 'Transformers', 'APIs and tools to easily download and train pre-trained models', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68dffca99019c3f84f6_63c1bf27aa744245cba36ebe_6350167a2c0590affeba7880ebeb46a115d863972d8ba%255B1%255D.png', 'machine-learning'),
  ('transformers-agent', 'Transformers Agent', 'AI tool leveraging LLMs for task automation', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/67ace6f6aa92b004fdf3fbab_avatar.jpg', 'ai-agent'),
  ('trino', 'Trino', 'Gain insights at lightning speed with powerful SQL query engine', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68d70302f0d4d8b9fe2_6442aa8a97641d51f5bfcd3c_fa27a80dfc15cab12f213c621ac9859019542095.png', 'data-transformation'),
  ('trivy', 'Trivy', 'Detect vulnerabilities in containers, Kubernetes, code, clouds', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6675899c8b6f008b85fa199e_logo%20(1).avif', 'security'),
  ('ui-bakery', 'UI Bakery', 'Fast internal app builder', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/669fbebe04f5d06849c0c289_653afbdcda78a43060d94606_UIB-nav-logo%5B1%5D.svg', 'data-dashboard'),
  ('unified-api', 'Unified API', 'One API to integrate them all', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6748ce93c473c361c6c9c2b5_unified_to_logo%5B1%5D.avif', 'api'),
  ('vaex', 'Vaex', 'Fast and memory-efficient Python library for working with large datasets.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68d8e966841878df46b_630c65497ed27f2da6fe7d20_90343543-a2e1e300-e011-11ea-8a69-9c12baf07f8e.png', 'distributed-computing'),
  ('velero', 'Velero', 'Kubernetes backup and recovery tool', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790fab421956bcc8e539b31_velero%20icon.jpg', 'devops'),
  ('verdaccio', 'Verdaccio', 'Lightweight private npm proxy registry', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/68557637afd10a1b311bbe12_verdaccio-tiny-uk-no-bg.svg', 'dbms'),
  ('vespa', 'Vespa', 'Real-time serving engine for AI-powered applications', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68d71dde8ad923a245f_64cbec10b711c416c4869003_3j8entjr_400x400.png', 'database'),
  ('vllm', 'vLLM', 'High-throughput library for LLM inference', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/68bf15235c136cf90c017a1d_vllm-color.png', 'model-serving'),
  ('vmware', 'VMware', 'Virtualization and cloud computing leader', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6791641700b15d936e9c1377_Vmware%20icon.png', 'distributed-computing'),
  ('voila', 'Voila', 'Convert Jupyter notebooks to interactive dashboards', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/630cfb672ef3f028ec538327_voila-logo.svg', 'data-dashboard'),
  ('voltagent', 'VoltAgent', 'TS framework for orchestrating AI agents', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/68bf16d68f5fbcc3ba521daa_voltagent-logo-transparent.png', 'ai-agent'),
  ('vs-code', 'VS Code', 'Code editor for modern web and cloud applications', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68e71dde8ad923a251b_630cfea6c9788732a3d5a1f1_vscode-logo.png', 'ide-development-environment'),
  ('weights-and-biases', 'Weights & Biases', 'Track and Visualize your machine learning experiments', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65d59ec0527ac5d0711eddf8_wandb-logo.svg', 'model-tracking'),
  ('wasabi', 'Wasabi', 'Safeguard your data and cut costs with fast and secure cloud storage', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6511e68de4af3f7097abc845_63ed254cd9d0224be6bf93e9_wasabi.avif', 'data-storage'),
  ('weaviate', 'Weaviate', 'AI-native vector database with semantic search', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68e369c6118116b70f9_64cbea14b711c416c4846e95_weaviate-logo.png', 'database'),
  ('whylogs', 'whylogs', 'Log and standardize your data and machine learning processes', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68e7e4c9e3b113993eb_63a48f04c33e87a8e6e278ed_logo%255B1%255D.png', 'data-logging'),
  ('windmill', 'Windmill', 'Fastest workflow engine (5x vs Airflow)', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65ca4ab5bb5af9cdf78254a7_windmill.svg', 'pipeline-orchestration'),
  ('wolfram', 'Wolfram', 'Standard for technical computation', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/685304cbde8af96777a7c53d_wolfram-logo.svg', 'language'),
  ('wren-ai', 'Wren AI', 'AI-powered data insights via chat', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/6790faa8151617d1e47bf828_wren%20ai%20icon.png', 'ai-agent'),
  ('xarray', 'Xarray', 'Library built on pandas for large spatial data arrays', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68e5e26e61247128799_630c669a3df16d7637e7abe1_xarray-logo.png', 'spatial-data'),
  ('xclim', 'xclim', 'Compute climate indices from observations or model simulations.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68e90fe5275e8c0395f_630c659396e48cbfa6ee0e06_xclim-logo.png', 'spatial-data'),
  ('xgboost', 'XGBoost', 'Achieve high performance machine learning with gradient boosting algorithm', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68e70302f0d4d8ba225_63c1c2b4348341745ad9f563_XGBoost-logo.png', 'machine-learning'),
  ('xorbits-inference', 'Xorbits Inference', 'Library for serving language, speech recognition, and multimodal models', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/66621b5eac60cdb56d6ce6ba_109655068.png', 'machine-learning'),
  ('zarr', 'ZARR', 'Simplify your data storage with fast, efficient, and open-source solution.', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/6511e68ef0432237fbf9fbe5_6442c4eebcc0576cc66e5f47_android-chrome-512x512.png', 'spatial-data'),
  ('zephyr', 'Zephyr', 'Compact LLM with advanced fine-tuning, based on Mistral', 'https://uploads-ssl.webflow.com/625447c67b621ab49bb7e3e5/65720f3668a78948dd89007b_mingcute_kite-line.svg', 'large-language-model-llm'),
  ('openhands-kb', 'OpenHands-kb', '', 'https://cdn.prod.website-files.com/625447c67b621ab49bb7e3e5/69fc5c241ce40e8a4d89317f_Openhands.png', 'ai-coding');

COMMIT;

-- =====================================================================
-- Useful queries
-- =====================================================================
-- All components in a category, A→Z:
--   SELECT name, one_liner FROM stack_components
--   WHERE category_slug = 'large-language-model-llm' AND NOT archived
--   ORDER BY name;
--
-- Most-requested components in the last 30 days:
--   SELECT sc.name, COUNT(*) AS picks
--   FROM stack_submission_items si
--   JOIN stack_components sc ON sc.slug = si.component_slug
--   JOIN stack_submissions  s ON s.id   = si.submission_id
--   WHERE s.submitted_at >= NOW() - INTERVAL '30 days'
--   GROUP BY sc.name
--   ORDER BY picks DESC
--   LIMIT 20;
