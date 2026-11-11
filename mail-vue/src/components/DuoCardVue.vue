<template>
  <div ref="container" class="duo-card-vue-container"></div>
</template>

<script setup>
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { DuoCard } from './DuoCard';

const props = defineProps({
  title: { type: String, default: 'GrabMails' },
  description: { type: String, default: 'Serverless email service powered by Cloudflare Workers and D1 database.' },
  stats: { type: Array, default: () => [
    { value: "+99.9%", label: "Inbound & Outbound\nDeliverability" },
    { value: "0", label: "Serverless Edge\nLogs Stored" },
    { value: "<1ms", label: "Cloudflare Edge\nGlobal Latency" },
  ]},
  className: { type: String, default: '' },
});

const container = ref(null);
let root = null;

function render() {
  if (!container.value) return;
  if (!root) root = createRoot(container.value);
  root.render(React.createElement(DuoCard, { ...props }));
}

onMounted(() => render());
watch(() => ({ ...props }), () => render(), { deep: true });
onBeforeUnmount(() => {
  if (root) {
    root.unmount();
    root = null;
  }
});
</script>

<style>
.duo-card-vue-container {
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1680px;
}

.duo-card-btn {
  --half-w: 260px;
  --card-h: 360px;
  position: relative;
  width: calc(var(--half-w) * (1 + var(--spread, 0)));
  height: var(--card-h);
  border-radius: 32px;
  transform-style: preserve-3d;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  text-align: left;
  font-family: 'Poppins', sans-serif;
  color: #ffffff;
  transition: width 100ms linear;

  @media (max-width: 768px) {
    --half-w: 160px;
    --card-h: 240px;
  }
}

.duo-card-btn .leaf {
  position: absolute;
  top: 0;
  width: var(--half-w);
  height: 100%;
}

.duo-card-btn .flap {
  right: var(--half-w);
  transform-origin: right center;
  transform-style: preserve-3d;
  transform: rotateY(var(--turn, 180deg));
  will-change: transform;
  z-index: 2;
}

.duo-card-btn .face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  backface-visibility: hidden;
}

.duo-card-btn .cover {
  transform: rotateY(180deg);
  border-radius: 6px 32px 32px 6px;
  background: linear-gradient(135deg, #190019 0%, #051F20 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
}

.duo-card-btn .cover-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 80% 20%, rgba(142, 182, 155, 0.35) 0%, transparent 60%),
              radial-gradient(circle at 20% 80%, rgba(251, 228, 216, 0.25) 0%, transparent 70%);
}

.duo-card-btn .cover-content {
  position: relative;
  z-index: 2;
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  justify-content: space-between;
}

.duo-badge {
  display: inline-block;
  align-self: flex-start;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 9999px;
  background: rgba(142, 182, 155, 0.25);
  color: #8EB69B;
  border: 1px solid rgba(142, 182, 155, 0.35);
}

.duo-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 10px 0 6px 0;
}

.duo-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.45;
}

.click-hint {
  font-size: 11px;
  color: #8EB69B;
  font-weight: 500;
  margin-top: auto;
}

.duo-card-btn .inside {
  border-radius: 32px 0 0 32px;
  right: -1px;
  background: #051F20;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.duo-card-btn .inside-bg {
  position: absolute;
  inset: 0;
}

.duo-card-btn .inside-bg.day {
  background: linear-gradient(135deg, #8EB69B 0%, #051F20 100%);
}

.duo-card-btn .inside-bg.night {
  background: linear-gradient(135deg, #051F20 0%, #190019 100%);
  opacity: var(--night, 0);
}

.duo-card-btn .inside-content {
  position: relative;
  z-index: 2;
  padding: 24px;
}

.duo-card-btn .right {
  right: 0;
  overflow: hidden;
  border-radius: calc(6px * var(--hinge-k, 1)) 32px 32px calc(6px * var(--hinge-k, 1));
  background: #051F20;
  border: 1px solid rgba(255, 255, 255, 0.12);
  will-change: transform;
}

.duo-card-btn[data-state="folded"] .right {
  visibility: hidden;
}

.stats-column {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 20px;
  box-sizing: border-box;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: var(--reveal, 1);
  transform: translateY(calc((1 - var(--reveal, 1)) * 8px));
}

.stat-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.stat-val {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}

.stat-lbl {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  white-space: pre-line;
  line-height: 1.3;
}
</style>
