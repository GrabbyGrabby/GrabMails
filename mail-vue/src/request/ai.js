import http from '@/axios/index.js';

export function aiSubjectLines(content, topic) {
    return http.post('/ai/subjectLines', { content, topic });
}

export function aiAssist(text, action = 'polish') {
    return http.post('/ai/assist', { text, action });
}

export function aiCompose(prompt, tone = 'professional', context = '') {
    return http.post('/ai/compose', { prompt, tone, context });
}

export default {
    aiSubjectLines,
    aiAssist,
    aiCompose
};
