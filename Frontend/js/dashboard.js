/** Dashboard interactions for schools without a destination yet. */
document.querySelectorAll('button.school-button').forEach(button => {
  button.addEventListener('click', () => {
    showToast(`Kho tài liệu ${button.dataset.school} đang được phát triển.`, 'info');
  });
});

document.getElementById('dashboardSearch').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.getElementById('schoolSearch');
  if (!input.value.trim()) {
    input.focus();
    return;
  }
  showToast('Tính năng tìm kiếm trường và môn học đang được phát triển.', 'info');
});
