(() => {
  function initBackground() {
    if (document.querySelector('.ambient-background')) return;
    const layer = document.createElement('div');
    layer.className = 'ambient-background';
    layer.setAttribute('aria-hidden', 'true');
    const count = window.matchMedia('(max-width: 700px)').matches ? 20 : 42;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index++) {
      const particle = document.createElement('span');
      particle.className = 'ambient-particle';
      particle.style.setProperty('--x', `${Math.random() * 100}%`);
      particle.style.setProperty('--size', `${2 + Math.random() * 2}px`);
      particle.style.setProperty('--duration', `${12 + Math.random() * 16}s`);
      particle.style.setProperty('--delay', `${-Math.random() * 28}s`);
      particle.style.setProperty('--drift', `${Math.random() * 50 - 25}px`);
      particle.style.setProperty('--particle-color', ['var(--rain-violet)', 'var(--rain-cyan)', 'var(--rain-blue)'][index % 3]);
      fragment.appendChild(particle);
    }
    layer.appendChild(fragment);
    document.body.prepend(layer);
    const pause = () => layer.classList.toggle('is-paused', document.hidden);
    document.addEventListener('visibilitychange', pause);
    pause();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBackground);
  else initBackground();
})();
