import http from '@/axios/index.js';

export function aiSubjectLines(content, topic) {
    return http.post('/ai/subjectLines', { content, topic });
}

export function aiAssist(text, action = 'polish') {
    return http.post('/ai/assist', { text, action });
}

export default {
    aiSubjectLines,
    aiAssist
};
