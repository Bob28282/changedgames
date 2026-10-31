const picker = document.getElementById('game-file');
const nameLabel = document.getElementById('file-name');
picker.addEventListener('change', () => {
  const file = picker.files && picker.files[0];
  nameLabel.textContent = file ? file.name : 'No game selected';
});