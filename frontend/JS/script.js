// ---------- ESTRELAS CLICÁVEIS ----------

const starRatings = document.querySelectorAll('.star-rating');

starRatings.forEach((ratingContainer) => {
  const stars = ratingContainer.querySelectorAll('.star');

  stars.forEach((star) => {
    star.addEventListener('click', () => {
      const selectedValue = parseInt(star.dataset.value);
      ratingContainer.dataset.rating = selectedValue;

      stars.forEach((s) => {
        const starValue = parseInt(s.dataset.value);
        s.classList.toggle('filled', starValue <= selectedValue);
      });

      console.log(`Nota selecionada: ${selectedValue}`);
    });
  });
});

// Botão "Avaliar" revela o componente de estrelas do usuário
const toggleRateBtn = document.getElementById('toggle-rate-btn');
const userRating = document.getElementById('user-rating');

if (toggleRateBtn && userRating) {
  toggleRateBtn.addEventListener('click', () => {
    userRating.style.display = userRating.style.display === 'none' ? 'flex' : 'none';
  });
}

// ---------- MODAL ----------

const modal = document.getElementById('add-list-modal');
const openModalBtn = document.getElementById('open-list-modal-btn');
const closeModalBtn = document.getElementById('modal-close-btn');

function openModal() {
  modal.classList.add('active');
}

function closeModal() {
  modal.classList.remove('active');
}

if (openModalBtn) openModalBtn.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('active')) {
    closeModal();
  }
});