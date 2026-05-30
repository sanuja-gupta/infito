// js/feedback-form.js

export function initFeedback() {
    document.getElementById('fb-yes').addEventListener('click', () => selectFeedback('yes'));
    document.getElementById('fb-no').addEventListener('click', () => selectFeedback('no'));
    document.getElementById('submit-feedback').addEventListener('click', submitFeedback);
}

function selectFeedback(type) {
    document.getElementById('fb-yes').classList.remove('selected');
    document.getElementById('fb-no').classList.remove('selected');
    document.getElementById(`fb-${type}`).classList.add('selected');
    document.getElementById('feedback-text').style.display = 'block';
    document.getElementById('submit-feedback').style.display = 'inline-block';
    window._feedbackType = type;
}

async function submitFeedback() {
    const msg = document.getElementById('feedback-text').value.trim();
    const type = window._feedbackType || 'none';
    const idea = document.getElementById('idea').value;

    try {
        await fetch('http://127.0.0.1:5000/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, message: msg, idea })
        });
    } catch (e) {
        console.log('Feedback error:', e);
    }

    document.getElementById('feedback-text').style.display = 'none';
    document.getElementById('submit-feedback').style.display = 'none';
    document.getElementById('feedback-thanks').style.display = 'block';
}

export function resetFeedback() {
    document.getElementById('fb-yes').classList.remove('selected');
    document.getElementById('fb-no').classList.remove('selected');
    document.getElementById('feedback-text').style.display = 'none';
    document.getElementById('submit-feedback').style.display = 'none';
    document.getElementById('feedback-thanks').style.display = 'none';
    document.getElementById('feedback-text').value = '';
    window._feedbackType = null;
}