(() => {
  function init() {
    try { if (sessionStorage.getItem('studyhub-reminder-dismissed') === 'true') return; } catch { /* Session storage is optional. */ }
    const lines = [
      'Chỉ 10 phút tập trung cũng là một bước tiến. Bắt đầu nhé! 🌱',
      'Học một chút hôm nay, tự tin hơn vào ngày mai. Bạn làm được! ✨',
      'Thử ôn lại một ý quan trọng rồi làm một bài tập nhé! 📚',
      'Không cần hoàn hảo, chỉ cần tiến bộ từng chút một. 💙',
      'Một phiên học nhỏ, một bước gần hơn đến mục tiêu! 🚀',
      'Uống chút nước, thả lỏng vai rồi cùng học tiếp nhé! 💧'
    ];
    const bot = document.createElement('aside');
    bot.className = 'study-reminder';
    bot.setAttribute('aria-label', 'Robot nhắc học');
    bot.hidden = true;
    bot.innerHTML = `<div class="study-bot-bubble"><button class="study-bot-close" type="button" aria-label="Tắt nhắc học trong phiên này">×</button><strong>Bạn học nhỏ của bạn</strong><p class="study-bot-line" role="status" aria-live="polite"></p></div><svg class="study-bot-character" viewBox="0 0 150 170" aria-hidden="true"><ellipse cx="75" cy="158" rx="44" ry="7" fill="#425ca522"/><g class="study-bot-wave"><path d="M107 103 Q133 96 132 76" fill="none" stroke="#538ef5" stroke-width="13" stroke-linecap="round"/><rect x="122" y="55" width="23" height="29" rx="11" fill="#87b5ff" stroke="#3873d4" stroke-width="2"/><path d="M130 56v-7m7 8 3-8" stroke="#538ef5" stroke-width="5" stroke-linecap="round"/></g><path d="M41 102 Q24 112 25 127" fill="none" stroke="#538ef5" stroke-width="13" stroke-linecap="round"/><rect x="44" y="93" width="63" height="51" rx="20" fill="#8dbbff" stroke="#3973d4" stroke-width="3"/><rect x="51" y="137" width="19" height="17" rx="7" fill="#3e77db"/><rect x="82" y="137" width="19" height="17" rx="7" fill="#3e77db"/><circle cx="75" cy="117" r="10" fill="#e8f7ff"/><path d="m70 118 4 4 7-9" fill="none" stroke="#23b7d5" stroke-width="3" stroke-linecap="round"/><path d="M75 33V19" stroke="#538ef5" stroke-width="6"/><circle cx="75" cy="15" r="6" fill="#45d5e8"/><rect x="28" y="49" width="10" height="27" rx="5" fill="#3973d4"/><rect x="112" y="49" width="10" height="27" rx="5" fill="#3973d4"/><rect x="35" y="31" width="79" height="64" rx="21" fill="#91bfff" stroke="#3973d4" stroke-width="3"/><rect x="43" y="40" width="63" height="45" rx="15" fill="#162d60"/><g class="study-bot-eyes"><rect x="55" y="51" width="10" height="15" rx="5" fill="#e6fbff"/><rect x="84" y="51" width="10" height="15" rx="5" fill="#e6fbff"/></g><ellipse class="study-bot-mouth" cx="75" cy="74" rx="7" ry="3" fill="#6be5f0"/><path d="M45 37h35" stroke="#d9ecff" stroke-width="3" stroke-linecap="round"/></svg>`;
    document.body.appendChild(bot);
    let timer = null, last = -1, dismissed = false, nextAppearance = Date.now() + 30000;
    function hide() { bot.classList.remove('is-visible'); timer = setTimeout(() => { bot.hidden = true; if (!dismissed) timer = setTimeout(show, Math.max(0, nextAppearance - Date.now())); }, 900); }
    function show() {
      if (dismissed) return;
      if (document.hidden || document.querySelector('dialog[open]')) { timer = setTimeout(show, 10000); return; }
      nextAppearance = Date.now() + 30000;
      const index = (last + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length;
      last = index;
      bot.querySelector('.study-bot-line').textContent = lines[index];
      bot.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!dismissed && !bot.hidden) bot.classList.add('is-visible'); }));
      timer = setTimeout(hide, 5000);
    }
    bot.querySelector('.study-bot-close').addEventListener('click', () => {
      dismissed = true; clearTimeout(timer); hide();
      try { sessionStorage.setItem('studyhub-reminder-dismissed', 'true'); } catch { /* Dismiss locally. */ }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clearTimeout(timer); bot.classList.remove('is-visible'); bot.hidden = true; }
      else if (!dismissed) { clearTimeout(timer); nextAppearance = Date.now() + 30000; timer = setTimeout(show, 30000); }
    });
    timer = setTimeout(show, 30000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
