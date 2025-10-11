document.addEventListener('DOMContentLoaded', () => {
  const card = document.querySelector('#book-card');
  if (!card) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            card.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 },
    );
    observer.observe(card);
  } else {
    card.classList.add('is-visible');
  }

  const primaryButton = card.querySelector('.card-btn');
  if (primaryButton) {
    primaryButton.addEventListener('click', () => {
      if (prefersReduced) return;
      primaryButton.classList.add('is-pressed');
      window.setTimeout(() => primaryButton.classList.remove('is-pressed'), 160);
    });
  }
});
