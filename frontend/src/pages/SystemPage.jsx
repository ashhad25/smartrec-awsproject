// pages/SystemPage.jsx
import { useState, useEffect } from 'react';
import { healthAPI } from '../services/api.js';
import { Spinner } from '../components/ui.jsx';

function StatusDot({ ok = true }) {
  return (
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: ok ? '#34d399' : '#ef4444', display: 'inline-block', marginRight: 8, flexShrink: 0 }} />
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

export default function SystemPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthAPI.check()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20 }}>

      {/* Live health */}
      <Section title="Live System Health">
        {loading ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            <Spinner size={16} /> Checking backend…
          </div>
        ) : health ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              ['Status', health.status, health.status === 'healthy'],
              ['Products', health.products, true],
              ['Users', health.users, true],
              ['Interactions', health.interactions, true],
              ['TF-IDF Vectors', health.tfidfVectors, true],
              ['Uptime', `${health.uptime}s`, true],
            ].map(([label, val, ok]) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                  <StatusDot ok={ok} />{label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: ok ? '#f9fafb' : '#ef4444' }}>{val}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#1a0a0a', border: '1px solid #450a0a', borderRadius: 8, padding: 14 }}>
            <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>Backend unreachable</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
              Start the server: <code style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>cd backend && npm run dev</code>
            </div>
          </div>
        )}
      </Section>

      {/* AWS Services */}
      <Section title="AWS Infrastructure (Design Reference)">
        {[
          ['Amazon DynamoDB', 'Users · Products · Interactions · RecommendationScores tables. On-Demand capacity + DAX cache (80–90% read reduction).'],
          ['Amazon S3', 'Data lake for exported interaction logs, trained TF-IDF artifacts, and offline feature store.'],
          ['AWS Lambda', 'Event-driven triggers from API Gateway, DynamoDB Streams (interaction recording), and weekly ML batch pipeline.'],
          ['EC2 / Fargate', 'Node.js backend API hosting. Offline ML training jobs. ECS Auto-Scaling on CPU/memory metrics.'],
          ['Amazon API Gateway', 'REST endpoint exposure. JWT Cognito authorizers for user endpoints. IAM SigV4 for internal service calls. Throttling + rate limiting.'],
          ['CloudWatch', 'Monitors p50/p95/p99 API latency, DynamoDB consumed capacity, Lambda cold start frequency.'],
          ['KMS + IAM', '365-day CMK rotation. Least-privilege per-service roles. No wildcard actions in production. VPC endpoints for DynamoDB.'],
          ['Amazon Neptune', 'Graph DB evaluated in Week 7 benchmark against DynamoDB for relationship-heavy queries.'],
        ].map(([svc, desc]) => (
          <div key={svc} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
            <StatusDot />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{svc}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </Section>

      {/* DynamoDB Schema */}
      <Section title="DynamoDB Table Schema">
        {[
          ['Users', 'PK: userId', 'segmentId-index (GSI)', 'segmentId · preferences · lastActive · tfidfPreferenceVector · createdAt'],
          ['Products', 'PK: productId', 'category-index (GSI)', 'category · tfidfVector · popularityScore · price · stock · brand · tags'],
          ['Interactions', 'PK: userId / SK: timestamp#id', 'productId-index (GSI)', 'productId · interactionType · weight · ttl (90 days)'],
          ['RecommendationScores', 'PK: userId / SK: productId', '—', 'score · source · algorithm · ttl (7 days)'],
        ].map(([table, pk, gsi, fields]) => (
          <div key={table} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>{table}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{pk}</div>
                {gsi !== '—' && <div style={{ fontSize: 10, color: '#f59e0b' }}>{gsi}</div>}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fields}</div>
          </div>
        ))}
      </Section>

      {/* Security */}
      <Section title="Security Controls — PIPEDA Compliant">
        {[
          ['Encryption at Rest', '#60a5fa', 'AWS KMS Customer Managed Key · 365-day rotation · All 4 DynamoDB tables encrypted (SSEType: KMS).'],
          ['Encryption in Transit', '#60a5fa', 'TLS 1.2+ enforced via API Gateway HTTPS · all client-to-API traffic encrypted.'],
          ['Cognito Authentication', '#a78bfa', 'Amazon Cognito User Pool (ca-central-1_gEjzRUuk1) · JWT tokens · all 5 demo users provisioned in Cognito.'],
          ['VPC Isolation', '#34d399', 'DynamoDB VPC Gateway Endpoint active · traffic never leaves AWS network · state: available.'],
          ['Least-Privilege IAM', '#34d399', 'Three per-service IAM roles · SmartRec-EC2-Role · SmartRec-Lambda-Role · SmartRec-APIGateway-Role · no wildcard actions.'],
          ['CloudTrail + TTL', '#f59e0b', 'CloudTrail audit logging active on SmartRec-AuditTrail · DynamoDB TTL enabled on Interactions table · 90-day automatic expiry · PIPEDA right to erasure endpoint implemented.'],
        ].map(([ctrl, color, desc]) => (
          <div key={ctrl} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{ctrl}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </Section>

      {/* Dev timeline */}
      <Section title="10-Week Development Timeline">
        {[
          ['Week 1', 'Requirements', 'Architecture diagram · data model spec · tool selection'],
          ['Week 2', 'Infrastructure', 'AWS account · DynamoDB 4 tables · S3 bucket · IAM user · CLI setup'],
          ['Week 3', 'Backend Dev', 'REST API · Express routes · JWT auth · all recommendation endpoints'],
          ['Week 4', 'ML Pipeline Pt.1', 'TF-IDF service · popularity scoring · content-based filtering'],
          ['Week 5', 'ML Pipeline Pt.2', 'Collaborative filtering (Jaccard) · cold-start fallback logic'],
          ['Week 6', 'Frontend', 'React app · 6 pages · EC2 deployment · API Gateway · S3 hosting'],
          ['Week 7', 'DB Evaluation', 'Neptune cluster deployed · 4-query benchmark · DynamoDB wins Q1+Q4 · Neptune wins Q2+Q3 · DynamoDB selected'],
          ['Week 8', 'Security', 'KMS CMK 365-day rotation · 3 IAM least-privilege roles · KMS applied to all 4 tables'],
          ['Week 9', 'Testing', '60+ unit & integration tests · tfidf.service · collaborative · API endpoints'],
          ['Week 10', 'Deployment', 'Live on AWS · S3 frontend · EC2 backend · API Gateway HTTPS · CloudWatch monitoring'],
        ].map(([week, phase, deliverable], i) => (
          <div key={week} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700, minWidth: 54, fontFamily: 'var(--font-mono)' }}>{week}</span>
            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, minWidth: 110 }}>{phase}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{deliverable}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}
