const { ipcRenderer } = require('electron');

let holder = document.querySelector('.drop-target');

holder.ondragover = () => false;
holder.ondragleave = () => false;
holder.ondragend = () => false;

holder.ondrop = (e) => {
  e.preventDefault();

  let found = false;
  for (let f of e.dataTransfer.files) {
    if (~f.path.indexOf('.yyp')) {
      found = true;
      ipcRenderer.send('fileDrop', f.path);
      holder.innerHTML = 'Organized!<br><br>ctrl + shift + z to do it again';
    }
  }

  if (!found) {
    alert('You didn\'t drop a yyp...');
  }
  
  return false;
};
