const STORAGE_KEY = 'soundboxd.demo.v1';
const STAR_CHAR = '★';
const EMPTY_STAR_CHAR = '☆';
const MOOD_LABELS = {
  animado: 'Animado',
  calmo: 'Calmo',
  reflexivo: 'Reflexivo',
  nostalgico: 'Nostálgico',
  focado: 'Focado',
  outro: 'Outro'
};
const CONTEXT_LABELS = {
  deslocamento: 'No caminho',
  casa: 'Em casa',
  estudo: 'Estudando ou trabalhando',
  amigos: 'Com amigos',
  descanso: 'Relaxando',
  outro: 'Outro momento'
};

const albums = [
  {
    id: 'blonde',
    title: 'Blonde',
    artist: 'Frank Ocean',
    year: 2016,
    tracks: 17,
    cover: 'https://placehold.co/240x240?text=Blonde',
    trackNames: ['Nikes', 'Ivy', 'Pink + White', 'Be Yourself', 'Solo'],
    trackDurations: ['5:14', '4:09', '3:04', '0:29', '4:19']
  },
  {
    id: 'channel-orange',
    title: 'Channel Orange',
    artist: 'Frank Ocean',
    year: 2012,
    tracks: 17,
    cover: 'https://placehold.co/240x240?text=Channel+Orange'
  },
  {
    id: 'nostalgia-ultra',
    title: 'Nostalgia, Ultra',
    artist: 'Frank Ocean',
    year: 2011,
    tracks: 14,
    cover: 'https://placehold.co/240x240?text=Nostalgia'
  },
  {
    id: 'endless',
    title: 'Endless',
    artist: 'Frank Ocean',
    year: 2016,
    tracks: 19,
    cover: 'https://placehold.co/240x240?text=Endless'
  },
  {
    id: 'blonde-on-blonde',
    title: 'Blonde on Blonde',
    artist: 'Bob Dylan',
    year: 1966,
    tracks: 14,
    cover: 'https://placehold.co/240x240?text=Blonde+on+Blonde'
  },
  {
    id: 'to-pimp-a-butterfly',
    title: 'To Pimp a Butterfly',
    artist: 'Kendrick Lamar',
    year: 2015,
    tracks: 16,
    cover: 'https://placehold.co/240x240?text=To+Pimp+a+Butterfly'
  },
  {
    id: 'sour',
    title: 'SOUR',
    artist: 'Olivia Rodrigo',
    year: 2021,
    tracks: 11,
    cover: 'https://placehold.co/240x240?text=SOUR'
  }
];

function createEmptyState() {
  return {
    accounts: [],
    currentUserId: null,
    ratings: {},
    reviews: [],
    listened: [],
    lists: [],
    likedPosts: []
  };
}

let storageError = null;
let state = readState();
let noticeTimer;

function readState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createEmptyState();

    const parsed = JSON.parse(saved);
    return {
      ...createEmptyState(),
      ...parsed,
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      listened: Array.isArray(parsed.listened) ? parsed.listened : [],
      lists: Array.isArray(parsed.lists) ? parsed.lists : [],
      likedPosts: Array.isArray(parsed.likedPosts) ? parsed.likedPosts : [],
      ratings: parsed.ratings && typeof parsed.ratings === 'object' ? parsed.ratings : {}
    };
  } catch (error) {
    storageError = error;
    console.error('Não foi possível ler os dados locais do Soundboxd.', error);
    return createEmptyState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Não foi possível salvar os dados locais do Soundboxd.', error);
    notify('Não foi possível salvar. Verifique o armazenamento do navegador.', 'error');
    return false;
  }
}

function element(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function notify(message, type = 'info') {
  let notice = document.querySelector('.app-notice');
  if (!notice) {
    notice = element('div', 'app-notice');
    notice.setAttribute('role', type === 'error' ? 'alert' : 'status');
    document.body.prepend(notice);
  }

  notice.className = `app-notice ${type}`;
  notice.textContent = message;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => notice.remove(), 5000);
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function accountForSession() {
  return state.accounts.find((account) => account.id === state.currentUserId) || null;
}

function displayName() {
  return accountForSession()?.username || 'Visitante';
}

function albumForId(id) {
  return albums.find((album) => album.id === id);
}

function makeStars(rating) {
  const score = Number(rating) || 0;
  return STAR_CHAR.repeat(score) + EMPTY_STAR_CHAR.repeat(5 - score);
}

function makeAlbumCard(album, rating) {
  const article = element('article', 'album-card');
  const link = element('a');
  link.href = `music.html?id=${encodeURIComponent(album.id)}`;

  const image = element('img');
  image.src = album.cover;
  image.alt = `Capa do álbum ${album.title}`;

  const title = element('p', 'album-title', album.title);
  const artist = element('p', 'album-artist', album.artist);

  link.append(image, title, artist);
  article.append(link);
  if (rating) article.append(element('p', 'rating', makeStars(rating)));
  return article;
}

function updateHeader() {
  const nav = document.querySelector('.topbar nav');
  const account = accountForSession();
  if (!nav || !account || nav.querySelector('[data-logout]')) return;

  const logout = element('button', 'logout-btn', `Sair (${account.username})`);
  logout.type = 'button';
  logout.dataset.logout = 'true';
  nav.append(logout);
}

function createList(name, albumId) {
  const normalizedName = name.trim();
  if (!normalizedName) return null;

  const list = {
    id: makeId('list'),
    name: normalizedName,
    albumIds: albumId ? [albumId] : [],
    createdAt: new Date().toISOString()
  };

  state.lists.unshift(list);
  if (!saveState()) {
    state.lists.shift();
    return null;
  }

  renderLists();
  renderProfile();
  return list;
}

function renderListSelector() {
  const select = document.getElementById('modal-list-select');
  const addButton = document.querySelector('#add-to-list-form button[type="submit"]');
  if (!select) return;

  select.replaceChildren();
  if (!state.lists.length) {
    const option = element('option', '', 'Crie uma lista abaixo primeiro');
    option.value = '';
    option.disabled = true;
    option.selected = true;
    select.append(option);
    if (addButton) addButton.disabled = true;
    return;
  }

  if (addButton) addButton.disabled = false;
  state.lists.forEach((list) => {
    const option = element('option', '', list.name);
    option.value = list.id;
    select.append(option);
  });
}

function renderLists() {
  const container = document.getElementById('lists-container');
  renderListSelector();
  if (!container) return;

  container.replaceChildren();
  if (!state.lists.length) {
    container.append(element('p', 'app-empty', 'Você ainda não criou listas. Use “Nova lista” para começar.'));
    return;
  }

  state.lists.forEach((list) => {
    const card = element('article', 'list-card');
    const info = element('div', 'list-info');
    const title = element('h2', 'list-title', list.name);
    const meta = element('p', 'list-meta', `${list.albumIds.length} álbuns · criada por ${displayName()}`);
    const remove = element('button', 'list-remove-btn', 'Excluir lista');
    remove.type = 'button';
    remove.dataset.removeList = list.id;
    info.append(title, meta, remove);

    const preview = element('div', 'list-preview');
    list.albumIds.forEach((albumId) => {
      const album = albumForId(albumId);
      if (!album) return;
      const item = element('span', 'list-album-item', album.title);
      const removeAlbum = element('button', 'list-remove-btn', 'Remover');
      removeAlbum.type = 'button';
      removeAlbum.dataset.removeAlbum = albumId;
      removeAlbum.dataset.listId = list.id;
      item.append(removeAlbum);
      preview.append(item);
    });

    if (!list.albumIds.length) {
      preview.append(element('p', 'list-meta', 'Ainda não há álbuns nesta lista.'));
    }

    card.append(info, preview);
    container.append(card);
  });
}

function renderSearch(query) {
  const heading = document.getElementById('search-heading');
  const results = document.getElementById('search-results-grid');
  if (!heading || !results) return;

  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const matches = albums.filter((album) => {
    const searchable = `${album.title} ${album.artist} ${album.year}`.toLocaleLowerCase('pt-BR');
    return !normalizedQuery || searchable.includes(normalizedQuery);
  });

  heading.textContent = normalizedQuery ? `Resultados para "${query.trim()}"` : 'Todos os álbuns';
  results.replaceChildren();
  matches.forEach((album) => results.append(makeAlbumCard(album)));
  if (!matches.length) results.append(element('p', 'app-empty', 'Nenhum álbum encontrado no catálogo de demonstração.'));
}

function initSearch() {
  const form = document.getElementById('search-form');
  const input = form?.querySelector('[name="q"]');
  if (!form || !input) return;

  const params = new URLSearchParams(window.location.search);
  input.value = params.get('q') ?? 'Frank Ocean';
  renderSearch(input.value);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const url = new URL(window.location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
    renderSearch(query);
  });
}

function renderAlbumReviews(albumId) {
  const container = document.getElementById('community-reviews');
  if (!container) return;

  const reviews = state.reviews.filter((review) => review.albumId === albumId);
  container.replaceChildren();
  if (!reviews.length) {
    container.append(element('p', 'app-empty', 'Ainda não há reviews salvas para este álbum.'));
    return;
  }

  reviews.forEach((review) => {
    const card = element('article', 'review-card');
    const image = element('img');
    image.src = 'https://placehold.co/60x60?text=User';
    image.alt = '';
    const content = element('div', 'review-content');
    content.append(
      element('p', 'review-header', review.username),
      element('p', 'rating', makeStars(review.rating)),
      element('p', 'review-text', review.text)
    );
    card.append(image, content);
    container.append(card);
  });
}

function setAlbumRating(albumId, rating) {
  const previousRating = state.ratings[albumId];
  state.ratings[albumId] = rating;
  if (!saveState()) {
    if (previousRating === undefined) delete state.ratings[albumId];
    else state.ratings[albumId] = previousRating;
    return;
  }

  const ratingContainer = document.getElementById('user-rating');
  if (ratingContainer) {
    ratingContainer.dataset.rating = String(rating);
    ratingContainer.querySelectorAll('.star').forEach((star) => {
      star.classList.toggle('filled', Number(star.dataset.value) <= rating);
    });
  }

  const score = document.getElementById('album-user-rating');
  if (score) score.textContent = `${rating}/5`;
  notify(`Nota ${rating}/5 salva neste navegador.`, 'success');
  renderProfile();
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('input, select, button')?.focus();
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

function initAlbum() {
  const titleNode = document.getElementById('album-title');
  if (!titleNode) return;

  const albumId = new URLSearchParams(window.location.search).get('id') || 'blonde';
  const album = albumForId(albumId);
  if (!album) {
    titleNode.textContent = 'Álbum não encontrado';
    document.querySelectorAll('.album-hero, .tracklist-section, .review-section').forEach((section) => {
      section.hidden = true;
    });
    notify('Este álbum não existe no catálogo local.', 'error');
    return;
  }

  document.title = `Soundboxd — ${album.title}`;
  titleNode.textContent = album.title;
  document.getElementById('album-artist').textContent = album.artist;
  document.getElementById('album-meta').textContent = `${album.year} · ${album.tracks} faixas`;
  const cover = document.getElementById('album-cover');
  cover.src = album.cover;
  cover.alt = `Capa do álbum ${album.title}`;

  const tracklist = document.querySelector('.tracklist');
  if (tracklist && album.trackNames) {
    tracklist.replaceChildren();
    album.trackNames.forEach((trackName, index) => {
      const row = element('li');
      row.append(
        element('span', 'track-number', String(index + 1)),
        document.createTextNode(` ${trackName}`),
        element('span', 'track-duration', album.trackDurations?.[index] || '')
      );
      tracklist.append(row);
    });
  } else if (tracklist) {
    tracklist.replaceChildren(element('li', '', 'Faixas indisponíveis no catálogo de demonstração.'));
  }

  const ratingContainer = document.getElementById('user-rating');
  const currentRating = Number(state.ratings[album.id]) || 0;
  const score = document.getElementById('album-user-rating');
  score.textContent = currentRating ? `${currentRating}/5` : '0/5';
  ratingContainer.dataset.rating = String(currentRating);
  ratingContainer.querySelectorAll('.star').forEach((star) => {
    star.classList.toggle('filled', Number(star.dataset.value) <= currentRating);
    star.addEventListener('click', () => setAlbumRating(album.id, Number(star.dataset.value)));
  });

  const rateButton = document.getElementById('toggle-rate-btn');
  rateButton.addEventListener('click', () => {
    ratingContainer.hidden = !ratingContainer.hidden;
    if (!ratingContainer.hidden) ratingContainer.querySelector('.star')?.focus();
  });

  const listenButton = document.getElementById('mark-listened-btn');
  const listenModal = document.getElementById('listen-modal');
  const listenForm = document.getElementById('listen-form');
  const listenedAtInput = document.getElementById('listen-at');
  document.getElementById('listen-album-label').textContent = `${album.title} — ${album.artist}`;
  listenedAtInput.value = toLocalDateTimeValue(new Date());
  listenButton.addEventListener('click', () => openModal(listenModal));
  document.getElementById('listen-modal-close').addEventListener('click', () => closeModal(listenModal));
  listenModal.addEventListener('click', (event) => {
    if (event.target === listenModal) closeModal(listenModal);
  });
  listenForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const listenedAt = new Date(listenedAtInput.value);
    if (Number.isNaN(listenedAt.getTime()) || listenedAt > new Date()) {
      notify('Escolha uma data e hora válidas, que não estejam no futuro.', 'error');
      return;
    }

    const entry = {
      id: makeId('listen'),
      albumId: album.id,
      listenedAt: listenedAt.toISOString(),
      mood: document.getElementById('listen-mood').value,
      context: document.getElementById('listen-context').value,
      note: document.getElementById('listen-note').value.trim()
    };
    state.listened.unshift(entry);
    if (!saveState()) {
      state.listened = state.listened.filter((item) => item.id !== entry.id);
      return;
    }

    listenForm.reset();
    listenedAtInput.value = toLocalDateTimeValue(new Date());
    closeModal(listenModal);
    renderProfile();
    renderDiary();
    notify('Escuta registrada no seu diário.', 'success');
  });

  const reviewForm = document.getElementById('review-form');
  reviewForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('review-text');
    const text = input.value.trim();
    if (!text) {
      input.focus();
      notify('Escreva sua review antes de publicar.', 'error');
      return;
    }

    const review = {
      id: makeId('review'),
      albumId: album.id,
      username: displayName(),
      text,
      rating: Number(state.ratings[album.id]) || 0,
      createdAt: new Date().toISOString()
    };
    state.reviews.unshift(review);
    if (!saveState()) {
      state.reviews = state.reviews.filter((entry) => entry.id !== review.id);
      return;
    }
    input.value = '';
    renderAlbumReviews(album.id);
    renderProfile();
    notify('Review publicada neste navegador.', 'success');
  });

  renderAlbumReviews(album.id);
  renderListSelector();
  const modal = document.getElementById('add-list-modal');
  document.getElementById('open-list-modal-btn').addEventListener('click', () => openModal(modal));
  document.getElementById('modal-close-btn').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(modal);
  });

  document.getElementById('add-to-list-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const list = state.lists.find((item) => item.id === document.getElementById('modal-list-select').value);
    if (!list) {
      notify('Crie uma lista antes de adicionar o álbum.', 'error');
      return;
    }
    if (list.albumIds.includes(album.id)) {
      notify('Este álbum já está nesta lista.', 'info');
      return;
    }

    list.albumIds.push(album.id);
    if (!saveState()) {
      list.albumIds.pop();
      return;
    }
    renderLists();
    closeModal(modal);
    notify(`Álbum adicionado à lista “${list.name}”.`, 'success');
  });

  document.getElementById('create-list-from-album-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('new-list-name');
    const list = createList(input.value, album.id);
    if (!list) return;
    input.value = '';
    closeModal(modal);
    notify(`Lista “${list.name}” criada com este álbum.`, 'success');
  });
}

function renderProfile() {
  const albumsContainer = document.getElementById('profile-albums');
  if (!albumsContainer) return;

  const ratedAlbums = Object.entries(state.ratings)
    .map(([albumId, rating]) => ({ album: albumForId(albumId), rating }))
    .filter((entry) => entry.album);
  albumsContainer.replaceChildren();
  ratedAlbums.forEach(({ album, rating }) => albumsContainer.append(makeAlbumCard(album, rating)));
  if (!ratedAlbums.length) albumsContainer.append(element('p', 'app-empty', 'Avalie um álbum para vê-lo aqui.'));

  const reviewsContainer = document.getElementById('profile-reviews');
  const reviews = state.reviews;
  reviewsContainer.replaceChildren();
  reviews.forEach((review) => {
    const album = albumForId(review.albumId);
    if (!album) return;
    const card = element('article', 'review-card');
    const image = element('img');
    image.src = album.cover;
    image.alt = `Capa do álbum ${album.title}`;
    const content = element('div', 'review-content');
    content.append(
      element('p', 'review-header', `${album.title} — ${album.artist}`),
      element('p', 'rating', makeStars(review.rating)),
      element('p', 'review-text', review.text)
    );
    card.append(image, content);
    reviewsContainer.append(card);
  });
  if (!reviews.length) reviewsContainer.append(element('p', 'app-empty', 'Suas reviews aparecerão aqui.'));

  const profileName = document.getElementById('profile-name');
  if (profileName) profileName.textContent = accountForSession()?.username || 'Visitante';
  document.getElementById('profile-listened-count').textContent = String(state.listened.length);
  document.getElementById('profile-review-count').textContent = String(state.reviews.length);
  document.getElementById('profile-list-count').textContent = String(state.lists.length);
}

function renderDiary() {
  const timeline = document.getElementById('diary-entries');
  if (!timeline) return;

  timeline.replaceChildren();
  const entries = state.listened
    .map((entry, index) => {
      const listenedAt = entry.listenedAt
        ? new Date(entry.listenedAt)
        : new Date(`${entry.date}T12:00:00`);
      return { entry, index, album: albumForId(entry.albumId), listenedAt };
    })
    .filter(({ album, listenedAt }) => album && !Number.isNaN(listenedAt.getTime()))
    .sort((a, b) => b.listenedAt - a.listenedAt);

  if (!entries.length) {
    timeline.append(element('p', 'app-empty', 'Sua linha do tempo começa quando você registrar uma escuta em qualquer álbum.'));
    return;
  }

  const groups = new Map();
  entries.forEach((item) => {
    const { listenedAt } = item;
    const dayKey = [
      listenedAt.getFullYear(),
      String(listenedAt.getMonth() + 1).padStart(2, '0'),
      String(listenedAt.getDate()).padStart(2, '0')
    ].join('-');
    if (!groups.has(dayKey)) groups.set(dayKey, []);
    groups.get(dayKey).push(item);
  });

  groups.forEach((dayEntries, dayKey) => {
    const group = element('section', 'timeline-day');
    const dayDate = new Date(`${dayKey}T12:00:00`);
    const heading = element('h3', 'timeline-date', dayDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }));
    const dayContent = element('div', 'timeline-day-entries');

    dayEntries.forEach(({ entry, index, album, listenedAt }) => {
      const card = element('article', 'timeline-entry');
      const timeText = entry.listenedAt
        ? listenedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'Escuta registrada';
      const time = element('time', 'timeline-time', timeText);
      if (entry.listenedAt) time.dateTime = entry.listenedAt;

      const cover = element('img', 'timeline-cover');
      cover.src = album.cover;
      cover.alt = `Capa do álbum ${album.title}`;

      const content = element('div', 'timeline-content');
      content.append(
        element('h4', 'timeline-album', album.title),
        element('p', 'timeline-artist', album.artist)
      );
      const mood = MOOD_LABELS[entry.mood];
      const context = CONTEXT_LABELS[entry.context];
      if (mood || context) {
        const details = [mood, context].filter(Boolean).join(' · ');
        content.append(element('p', 'timeline-mood', details));
      }
      if (entry.note) content.append(element('p', 'timeline-note', entry.note));
      if (state.ratings[album.id]) {
        content.append(element('p', 'timeline-rating', `Sua nota: ${makeStars(state.ratings[album.id])}`));
      }

      const removeButton = element('button', 'timeline-delete', 'Remover registro');
      removeButton.type = 'button';
      removeButton.dataset.removeListen = String(index);
      card.append(time, cover, content, removeButton);
      dayContent.append(card);
    });

    group.append(heading, dayContent);
    timeline.append(group);
  });
}

function toLocalDateTimeValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function initDiary() {
  const timeline = document.getElementById('diary-entries');
  if (!timeline) return;

  timeline.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-listen]');
    if (!button) return;

    const index = Number(button.dataset.removeListen);
    if (!Number.isInteger(index) || !state.listened[index]) return;
    const [removed] = state.listened.splice(index, 1);
    if (!saveState()) {
      state.listened.splice(index, 0, removed);
      return;
    }
    renderDiary();
    renderProfile();
    notify('Registro removido do diário.', 'success');
  });
}

function initListPage() {
  const container = document.getElementById('lists-container');
  if (!container) return;

  const modal = document.getElementById('new-list-modal');
  const form = document.getElementById('new-list-form');
  document.getElementById('new-list-btn').addEventListener('click', () => openModal(modal));
  document.getElementById('new-list-close').addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(modal);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('new-list-title-input');
    const list = createList(input.value);
    if (!list) return;
    input.value = '';
    closeModal(modal);
    notify(`Lista “${list.name}” criada.`, 'success');
  });

  container.addEventListener('click', (event) => {
    const removeListButton = event.target.closest('[data-remove-list]');
    if (removeListButton) {
      const index = state.lists.findIndex((list) => list.id === removeListButton.dataset.removeList);
      if (index < 0) return;
      const [removed] = state.lists.splice(index, 1);
      if (!saveState()) {
        state.lists.splice(index, 0, removed);
        return;
      }
      renderLists();
      renderProfile();
      notify(`Lista “${removed.name}” excluída.`, 'success');
      return;
    }

    const removeAlbumButton = event.target.closest('[data-remove-album]');
    if (removeAlbumButton) {
      const list = state.lists.find((item) => item.id === removeAlbumButton.dataset.listId);
      if (!list) return;
      const previousAlbumIds = [...list.albumIds];
      list.albumIds = list.albumIds.filter((id) => id !== removeAlbumButton.dataset.removeAlbum);
      if (!saveState()) {
        list.albumIds = previousAlbumIds;
        return;
      }
      renderLists();
    }
  });

  renderLists();
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, saltHex) {
  if (!window.crypto?.subtle || !window.crypto?.getRandomValues) {
    throw new Error('Use HTTPS ou localhost para habilitar o cadastro local seguro.');
  }

  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{2}/g), (byte) => Number.parseInt(byte, 16))
    : window.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  return { salt: bytesToHex(salt), hash: bytesToHex(hash) };
}

function setAuthMessage(message, type = 'info') {
  const node = document.getElementById('auth-message');
  if (!node) return;
  node.textContent = message;
  node.dataset.type = type;
}

function initAuth() {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim().toLocaleLowerCase('pt-BR');
      const password = document.getElementById('password').value;
      const confirmation = document.getElementById('confirm-password').value;

      if (password.length < 8) {
        setAuthMessage('A senha precisa ter pelo menos 8 caracteres.', 'error');
        return;
      }
      if (password !== confirmation) {
        setAuthMessage('As senhas não conferem.', 'error');
        return;
      }
      if (state.accounts.some((account) => account.email === email)) {
        setAuthMessage('Já existe uma conta local com este e-mail.', 'error');
        return;
      }

      try {
        const credentials = await hashPassword(password);
        const account = {
          id: makeId('user'),
          username,
          email,
          salt: credentials.salt,
          passwordHash: credentials.hash
        };
        state.accounts.push(account);
        const previousUserId = state.currentUserId;
        state.currentUserId = account.id;
        if (!saveState()) {
          state.accounts.pop();
          state.currentUserId = previousUserId;
          return;
        }
        updateHeader();
        setAuthMessage('Conta de demonstração criada. Agora você pode entrar.', 'success');
        registerForm.reset();
      } catch (error) {
        console.error('Falha ao criar a conta de demonstração.', error);
        setAuthMessage(error.message || 'Não foi possível criar a conta neste navegador.', 'error');
      }
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value.trim().toLocaleLowerCase('pt-BR');
      const password = document.getElementById('password').value;
      const account = state.accounts.find((item) => item.email === email);
      if (!account) {
        setAuthMessage('Conta local não encontrada. Crie uma conta neste navegador primeiro.', 'error');
        return;
      }

      try {
        const credentials = await hashPassword(password, account.salt);
        if (credentials.hash !== account.passwordHash) {
          setAuthMessage('E-mail ou senha incorretos.', 'error');
          return;
        }
        const previousUserId = state.currentUserId;
        state.currentUserId = account.id;
        if (!saveState()) {
          state.currentUserId = previousUserId;
          return;
        }
        updateHeader();
        setAuthMessage(`Bem-vindo, ${account.username}!`, 'success');
        loginForm.reset();
      } catch (error) {
        console.error('Falha ao entrar na conta de demonstração.', error);
        setAuthMessage(error.message || 'Não foi possível entrar neste navegador.', 'error');
      }
    });
  }
}

function initLikes() {
  document.querySelectorAll('[data-like-id]').forEach((button) => {
    const postId = button.dataset.likeId;
    const baseCount = Number(button.dataset.baseCount) || 0;
    const update = () => {
      const liked = state.likedPosts.includes(postId);
      button.textContent = `${liked ? '♥ Curtido' : '♡ Curtir'} · ${baseCount + Number(liked)}`;
      button.setAttribute('aria-pressed', String(liked));
    };

    update();
    button.addEventListener('click', () => {
      const index = state.likedPosts.indexOf(postId);
      if (index >= 0) state.likedPosts.splice(index, 1);
      else state.likedPosts.push(postId);
      if (!saveState()) {
        if (index >= 0) state.likedPosts.splice(index, 0, postId);
        else state.likedPosts.pop();
        return;
      }
      update();
    });
  });
}

function initGlobalEvents() {
  document.addEventListener('click', (event) => {
    if (!event.target.matches('[data-logout]')) return;
    state.currentUserId = null;
    if (!saveState()) return;
    event.target.remove();
    notify('Você saiu da conta local.', 'success');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.modal-overlay.active').forEach(closeModal);
  });
}

function initialize() {
  if (storageError) notify('Não foi possível ler os dados salvos; os dados locais foram iniciados vazios.', 'error');
  updateHeader();
  initSearch();
  initAlbum();
  initListPage();
  initAuth();
  initLikes();
  renderProfile();
  initDiary();
  renderDiary();
  initGlobalEvents();
}

initialize();
