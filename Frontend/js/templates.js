/** Shared HTML templates. Classic scripts also work when opened with file://. */
window.StudyHub = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icon = name => `<i class="${escape(name)}" aria-hidden="true"></i>`;
  const normalize = value => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const date = value => value.split('-').reverse().join('/');
  const breadcrumbs = items => items.map((item, index) => index === items.length - 1
    ? `<strong aria-current="page">${escape(item.label)}</strong>`
    : `${item.href ? `<a href="${escape(item.href)}">${escape(item.label)}</a>` : `<span>${escape(item.label)}</span>`}${icon('fa-solid fa-chevron-right')}`).join('');
  const folderCard = item => `<a class="faculty-card ${escape(item.theme)}" href="${escape(item.href)}" data-name="${escape(item.name)}">
    <div class="faculty-art" aria-hidden="true"><div class="folder"><div class="folder-back"></div><div class="folder-front">${icon(item.icon)}</div></div></div>
    <div class="faculty-card-content"><h2>${escape(item.name)}</h2><div class="faculty-card-bottom"><span class="document-count">${icon('fa-regular fa-file-lines')}${escape(item.count)} tài liệu</span><span class="card-arrow">${icon('fa-solid fa-arrow-right')}</span></div></div></a>`;
  const schoolCard = item => {
    const content = `<span class="school-image-frame"><img class="school-logo" src="${escape(item.image)}" alt="" loading="lazy" /></span>`;
    const attributes = `class="school-button" data-school="${escape(item.id)}" aria-label="Chọn ${escape(item.name)}" title="${escape(item.name)}"`;
    return item.href ? `<a ${attributes} href="${escape(item.href)}">${content}</a>` : `<button ${attributes} type="button">${content}</button>`;
  };
  const subjectArtwork = id => ({
    'giai-tich': `${icon('fa-solid fa-chart-area')}<span class="subject-formula">∫ f(x) dx</span><span class="subject-art-grid">${icon('fa-solid fa-wave-square')}</span>`,
    ctdl: `${icon('fa-solid fa-diagram-project')}<code>struct Node {<br>&nbsp; int data;<br>&nbsp; Node* left;<br>&nbsp; Node* right;<br>};</code>`,
    'dai-so-tuyen-tinh': `<span class="subject-matrix">1 &nbsp; 0 &nbsp; 2<br>0 &nbsp; 1 &nbsp; 3<br>2 &nbsp; 3 &nbsp; 1</span>${icon('fa-solid fa-arrows-up-down-left-right')}${icon('fa-solid fa-cubes')}`,
    'tu-tuong-ho-chi-minh': `${icon('fa-solid fa-book-open')}<span class="subject-vietnam-flag">★</span>${icon('fa-solid fa-landmark')}`,
    'he-dieu-hanh': `${icon('fa-solid fa-desktop')}${icon('fa-solid fa-gears')}${icon('fa-brands fa-linux')}`,
    'nhap-mon-lap-trinh': `${icon('fa-solid fa-code')}<span class="subject-code-symbol">{ }</span>${icon('fa-solid fa-list-check')}`
  })[id] || icon('fa-solid fa-book-open');
  const subjectCard = item => `<article class="subject-card" data-id="${escape(item.id)}" data-name="${escape(item.name)}" data-semester="${escape(item.semester)}" data-type="${escape(item.type)}" data-lecturer="${escape(item.lecturer)}" data-date="${escape(item.date)}">
    <a class="subject-open" href="${escape(item.href)}" aria-label="Xem tài liệu môn ${escape(item.name)}"><div class="subject-placeholder subject-artwork color-${escape(item.color)}" aria-hidden="true">${subjectArtwork(item.id)}</div><h2>${escape(item.name)}</h2></a>
    <div class="subject-formats">${item.formats.map(format => `<span class="subject-format format-${escape(format.toLowerCase())}">${icon('fa-solid fa-file')}${escape(format)}</span>`).join('')}</div>
    <div class="subject-meta"><p>${icon('fa-regular fa-user')}GV: ${escape(item.lecturer)}</p><p>${icon('fa-regular fa-calendar-days')}Cập nhật: <time datetime="${escape(item.date)}">${date(item.date)}</time></p><p>${icon('fa-regular fa-file-lines')}${escape(item.count)} tài liệu</p></div>
    <div class="subject-actions"><a class="subject-arrow" href="${escape(item.href)}" aria-label="Mở môn ${escape(item.name)}">${icon('fa-solid fa-arrow-right')}</a><button class="subject-save" type="button" aria-pressed="false" aria-label="Lưu môn ${escape(item.name)}">${icon('fa-regular fa-bookmark')}<span>Lưu vào Kho Tài liệu</span></button></div></article>`;
  const path = [
    { label: 'Trang chủ', href: 'dashboard.html' }, { label: 'ĐHQG TP.HCM' },
    { label: 'UIT', href: 'uit-faculties.html' }, { label: 'Khoa', href: 'uit-faculties.html' },
    { label: 'Ngành', href: 'uit-is-majors.html' }, { label: 'Môn', href: 'uit-is-cttt-subjects.html' }
  ];
  return { escape, icon, normalize, date, breadcrumbs, folderCard, schoolCard, subjectCard, path };
})();
